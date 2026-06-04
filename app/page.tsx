import Dashboard from '@/components/Dashboard';
import { getSessionFromCookies, getUserRole } from '@/lib/auth';

export default async function Home() {
  const session = await getSessionFromCookies();
  const userRole = session ? getUserRole(session.email) : 'consultor';
  return <Dashboard currentUserEmail={session?.email ?? null} userRole={userRole} />;
}
