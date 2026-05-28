import { getSessionFromCookies } from '@/lib/auth';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  const session = await getSessionFromCookies();

  return <Dashboard currentUserEmail={session?.email ?? null} />;
}
