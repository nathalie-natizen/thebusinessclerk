import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
export default async function Home() {
  const { profile } = await requireUser();
  redirect(['staff', 'admin'].includes(profile?.role) ? '/staff/pipeline' : '/dashboard');
}
