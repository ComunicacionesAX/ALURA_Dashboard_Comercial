import Dashboard from '@/components/Dashboard';
import { loadDashboardData } from '@/lib/excelData';
import { mockData } from '@/lib/mockData';

export default async function Home() {
  try {
    const data = await loadDashboardData();
    return <Dashboard initialData={data} />;
  } catch (error) {
    console.error('Error cargando datos:', error);
    return <Dashboard initialData={mockData} />;
  }
}
