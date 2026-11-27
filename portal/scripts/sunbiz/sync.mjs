// Keeps public.sunbiz_entities in step with the Florida Division of Corporations data files.
//   node sync.mjs full    -> loads the quarterly files (every Florida company), removes companies no longer in them, then the newer daily files
//   node sync.mjs daily   -> loads each daily file not loaded yet (runs a full load first if the table is empty)
//   node sync.mjs file X  -> loads one local data file (for testing)
// Needs SUPABASE_DB_URL (Supabase → Connect → Session pooler connection string).
import SftpClient from 'ssh2-sftp-client';
import pg from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import unzipper from 'unzipper';
import readline from 'node:readline';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { parseLine, keep, copyRow, COLS } from './parse.mjs';

const SFTP = { host: 'sftp.floridados.gov', port: 22, username: 'Public', password: 'PubAccess1845!', readyTimeout: 60000 }; // public credentials published by the state
const KEEP_INACTIVE_YEARS = +(process.env.SUNBIZ_KEEP_INACTIVE_YEARS || 5);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: process.env.SUNBIZ_DB_SSL === 'off' ? false : { rejectUnauthorized: false } }); // SUNBIZ_DB_SSL=off only for a local test database

async function stage() {
  await db.query(`create temp table if not exists sunbiz_stage (seq bigint, doc_number text, name text, status text, filing_type text, file_date date, last_txn_date date, fei text,
    principal jsonb, mailing jsonb, ra jsonb, officers jsonb, more_officers boolean, reports jsonb)`);
  await db.query('truncate sunbiz_stage');
}

// Streams text lines into the staging table; returns { read, kept }
async function load(lines, counter) {
  const copy = db.query(copyFrom(`copy sunbiz_stage (${COLS.join(',')}) from stdin`));
  const rows = Readable.from((async function* () {
    for await (const line of lines) {
      counter.read++;
      const r = parseLine(line);
      if (!r || !keep(r, KEEP_INACTIVE_YEARS)) continue;
      counter.kept++;
      yield copyRow(r, counter.read);
      if (counter.read % 500000 === 0) log(`  ${counter.read.toLocaleString()} lines`);
    }
  })());
  await pipeline(rows, copy);
}

const linesOf = (stream) => readline.createInterface({ input: stream.setEncoding('latin1'), crlfDelay: Infinity });

// Moves the staged rows into the live table (latest line wins when a company appears twice)
async function merge() {
  const cols = COLS.slice(1);
  const set = cols.slice(1).map(c => `${c} = excluded.${c}`).join(', ');
  const { rowCount } = await db.query(`insert into public.sunbiz_entities (${cols.join(',')})
    select distinct on (doc_number) ${cols.join(',')} from sunbiz_stage order by doc_number, seq desc
    on conflict (doc_number) do update set ${set}, updated_at = now()`);
  // A daily update can turn a company inactive long ago; drop it if it falls outside the window
  const { rowCount: dropped } = await db.query(`delete from public.sunbiz_entities s using sunbiz_stage t
    where s.doc_number = t.doc_number and s.status = 'I' and coalesce(s.last_txn_date, s.file_date, '1900-01-01') < (current_date - make_interval(years => $1))`, [KEEP_INACTIVE_YEARS]);
  return { rowCount, dropped };
}

async function findDir(sftp, ...paths) {
  for (const p of paths) for (const base of ['', '/', '/Public/', 'Public/']) { const d = base + p; if (await sftp.exists(d) === 'd') return d; }
  throw new Error(`Folder not found on the state server: ${paths.join(' or ')}`);
}

async function full(sftp) {
  const dir = await findDir(sftp, 'doc/quarterly/cor', 'doc/Quarterly/Cor');
  const list = (await sftp.list(dir)).filter(x => /^cordata.*\.zip$/i.test(x.name));
  const zips = list.map(x => x.name).sort();
  const snapshot = new Date(Math.min(...list.map(x => x.modifyTime))).toISOString().slice(0, 10).replace(/-/g, ''); // when the state made these files
  if (!zips.length) throw new Error(`No cordata zip files in ${dir}`);
  await stage();
  const c = { read: 0, kept: 0 };
  for (const z of zips) {
    log(`Downloading ${dir}/${z}`);
    const tmp = `/tmp/${z}`;
    await sftp.fastGet(`${dir}/${z}`, tmp);
    const zip = await unzipper.Open.file(tmp);
    for (const entry of zip.files.filter(e => e.type === 'File')) { log(`  reading ${entry.path}`); await load(linesOf(entry.stream()), c); }
    fs.rmSync(tmp, { force: true });
  }
  if (c.kept < 1000000) throw new Error(`Only ${c.kept} companies read from the quarterly files; stopping so the table isn't emptied by a bad download.`);
  log(`Read ${c.read.toLocaleString()} lines, kept ${c.kept.toLocaleString()}. Updating the table…`);
  await db.query('drop index if exists public.sunbiz_name_trgm'); // much faster to rebuild once than to update row by row
  const m = await merge();
  const { rowCount: removed } = await db.query('delete from public.sunbiz_entities s where not exists (select 1 from sunbiz_stage t where t.doc_number = s.doc_number)');
  await db.query('create index if not exists sunbiz_name_trgm on public.sunbiz_entities using gin (name_norm gin_trgm_ops)');
  await db.query('insert into public.sunbiz_sync_log (mode, source_file, rows_read, rows_kept) values ($1,$2,$3,$4)', ['full', `${zips.join(',')}@${snapshot}`, c.read, c.kept]);
  log(`Done: ${m.rowCount.toLocaleString()} saved, ${removed.toLocaleString()} removed.`);
}

async function daily(sftp) {
  const { rows: [{ n }] } = await db.query('select count(*)::int n from (select 1 from public.sunbiz_entities limit 1) x');
  if (!n) { log('Table is empty: running the full load first.'); await full(sftp); }
  // Apply the daily files dated after the quarterly snapshot we loaded, skipping the ones already applied since then
  const { rows: [lf] } = await db.query(`select id, substring(source_file from '@(\\d{8})') d from public.sunbiz_sync_log where mode = 'full' order by id desc limit 1`);
  const { rows: [ld] } = await db.query(`select max(substring(source_file from '(\\d{8})c\\.txt')) d from public.sunbiz_sync_log where mode = 'daily' and id > $1`, [lf?.id || 0]);
  const since = ld?.d || lf?.d || '00000000';
  const dir = await findDir(sftp, 'doc/cor', 'doc/Cor');
  const files = (await sftp.list(dir)).map(x => x.name).filter(x => /^\d{8}c\.txt$/i.test(x) && x.slice(0, 8) > since).sort();
  if (!files.length) return log(`No new daily files after ${since}.`);
  for (const file of files) {
    await stage();
    const c = { read: 0, kept: 0 };
    log(`Loading ${dir}/${file}`);
    await load(linesOf(sftp.createReadStream(`${dir}/${file}`)), c);
    const m = await merge();
    await db.query('insert into public.sunbiz_sync_log (mode, source_file, rows_read, rows_kept) values ($1,$2,$3,$4)', ['daily', file, c.read, c.kept]);
    log(`  ${c.read} lines, ${m.rowCount} saved, ${m.dropped} dropped`);
  }
}

async function localFile(path) {
  await stage();
  const c = { read: 0, kept: 0 };
  await load(linesOf(fs.createReadStream(path)), c);
  const m = await merge();
  log(`${c.read} lines, ${m.rowCount} saved`);
}

const mode = process.argv[2] || 'daily';
if (!process.env.SUPABASE_DB_URL) { console.error('Missing SUPABASE_DB_URL'); process.exit(1); }
await db.connect();
await db.query("set statement_timeout = 0; set maintenance_work_mem = '128MB'");
const sftp = new SftpClient();
try {
  if (mode === 'file') await localFile(process.argv[3]);
  else {
    await sftp.connect(SFTP);
    if (mode === 'full') await full(sftp);
    await daily(sftp); // after a full load this re-applies the daily files newer than the quarterly snapshot
  }
} catch (e) { console.error(e); process.exitCode = 1; }
finally { await sftp.end().catch(() => {}); await db.end(); }
