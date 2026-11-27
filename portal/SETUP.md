# THE BUSINESS CLERK – client & staff portal setup

Live at **https://app.thebusinessclerk.com** (Vercel). Clients sign in with the email on file (secure link, no password).

## 1. Supabase (login, database, file storage)
1. Create a project at supabase.com (region: US East). Save the database password somewhere safe.
2. **SQL Editor → New query →** paste `supabase/schema.sql` → **Run**.
3. **Authentication → URL Configuration:** Site URL `https://app.thebusinessclerk.com`; Redirect URLs add `https://app.thebusinessclerk.com/auth/callback`.
4. **Authentication → Emails → SMTP:** connect your own sender (Resend, step 4) so sign-in emails come from hello@thebusinessclerk.com and aren't rate-limited.
5. Sign in once at the portal with your email, then run in SQL Editor:
   `update public.profiles set role = 'admin' where email = 'YOUR EMAIL';`
   For staff (e.g. the office): `update public.profiles set role = 'staff' where email = 'STAFF EMAIL';`
6. **Project Settings → API:** copy the URL, `anon` key and `service_role` key into Vercel (step 6). Never share the service_role key.

## 2. Stripe (payments, card on file, subscriptions)
1. Create the account for THE BUSINESS CLERK LLC and finish business verification.
2. **Product catalog:** create the products and copy each Price ID:
   Registered Agent $49/year (recurring) · Business Address & Mail $20/month (recurring) · Florida LLC Formation $213 · Florida Corporation Formation $158 · Annual Report Filing $100 · EIN Application $75 · Launch Pack $599.
3. **Settings → Billing → Customer portal:** turn on update payment method, view invoices, cancel subscriptions.
4. **Developers → Webhooks → Add endpoint:** `https://app.thebusinessclerk.com/api/stripe/webhook` with events `checkout.session.completed` and `customer.subscription.deleted`. Copy the signing secret.
5. Website "buy" links: `https://app.thebusinessclerk.com/api/stripe/checkout?product=llc` (also `corp`, `ra`, `mail`, `annual_report`, `ein`, `launch`).

## 3. Twilio (text alerts)
1. Create the account and buy a local Florida number (or a toll-free number).
2. Register it: **A2P 10DLC** brand + campaign for a local number, or **toll-free verification**. US carriers block unregistered business texts; approval usually takes days to a few weeks.
   Use case: "Account notifications: alerts when mail or legal notices arrive." Opt-in: clients check the box on the Account page.
3. Copy Account SID, Auth Token and the number.

## 4. Resend (notification emails)
1. Create an account at resend.com, add the domain `thebusinessclerk.com`, and add the DNS records it shows in GoDaddy.
2. Create an API key.

## 5. DNS (GoDaddy)
`CNAME app → the value Vercel shows when you add app.thebusinessclerk.com`.

## 6. Vercel environment variables
Project → Settings → Environment Variables: add everything in `.env.example`, then **Redeploy**.

## How the office uses it
- **New client:** Staff → New entity → a file number (TBC-#####) is created. Put it on the PMB line, the folder label and every scan.
- **Mail arrives:** open the entity → Record mail → choose the type, attach the scan → the client gets an email (and a text, if they opted in) the same day. Lawsuits and state notices are automatically urgent.
- **Client requests** (forward/shred) appear in Mail queue. Mark them done with a tracking number.
- **Orders:** update the status; the client sees the timeline and gets notified.

Security: every table uses row level security (clients only ever see their own companies), files live in private storage and download through 60-second links, staff notes are in a separate staff-only table, and secret keys live only in Vercel.

## Carrier tracking (EasyPost)
1. Create an account at easypost.com and copy the **Production API key**.
2. In Vercel → thebusinessclerk-portal → Settings → Environment Variables add `EASYPOST_API_KEY` = the production key.
3. In EasyPost → Webhooks & Events, add `https://app.thebusinessclerk.com/api/tracking/webhook` (Production). Every update is re-checked with EasyPost using the API key, so the URL needs no secret.
4. Redeploy. From then on, when staff mark mail as forwarded with a carrier + tracking number, the item updates itself (in transit, out for delivery, delivered) and the client is notified.
Without EasyPost, tracking numbers still show as a link to the carrier's site; statuses just don't update automatically.

## Florida company lookup (Sunbiz records)
The order form ("Find your company in the Florida records") and Staff → New entity search our own copy of the state's public data files. The state publishes them free on its SFTP server (no API); a GitHub Action loads them into Supabase.
1. **Supabase plan:** the full list of Florida companies (active ones plus inactive ones from the last 5 years) needs roughly 2–4 GB of database space, more than the free plan's 500 MB. Use the Pro plan (8 GB included).
2. **SQL Editor:** run `supabase/23_sunbiz_registry.sql`.
3. **Supabase → Connect → Session pooler:** copy the connection string and put your database password in it. (Use the session pooler, not the direct connection: GitHub's servers can't reach the direct one.)
4. **GitHub → repository → Settings → Secrets and variables → Actions → New repository secret:** name `SUPABASE_DB_URL`, value = that string.
5. **GitHub → Actions → Sunbiz records sync → Run workflow → mode `full`.** The first load takes about 30–90 minutes. After that it runs by itself: daily files Tuesday–Saturday, and a full refresh on the 15th of January, April, July and October.
Check it worked: `select count(*) from sunbiz_entities;` and `select * from sunbiz_sync_log order by id desc limit 5;`. Until step 2 is done the box says the search is unavailable, and until the first load finishes it finds nothing; either way clients can still type their details as before.
