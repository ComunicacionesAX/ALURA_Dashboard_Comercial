import Dashboard from '@/components/Dashboard';
import { getSessionFromCookies } from '@/lib/auth';

export default async function Home() {
  const session = await getSessionFromCookies();
  return <Dashboard currentUserEmail={session?.email ?? null} />;
}
