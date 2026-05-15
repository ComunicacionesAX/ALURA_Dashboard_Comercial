import { readSheet } from '@/lib/sheetsClient';
import { loadDashboardData } from '@/lib/excelData';
import { mockData } from '@/lib/mockData';
import { applyLocalOtifOverrides } from '@/lib/otifLocalData';
import { transformGerencial } from '@/lib/transformGerencial';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await readSheet('Informe Comercial Gerencial');
    const data = applyLocalOtifOverrides(transformGerencial(rows) as typeof mockData);
    return Response.json(data);
  } catch (err) {
    console.warn('[api/data/gerencial] fallback local activado:', err);
    try {
      const data = await loadDashboardData();
      return Response.json(data);
    } catch (fallbackErr) {
      console.warn('[api/data/gerencial] fallback mock activado:', fallbackErr);
      return Response.json(mockData);
    }
  }
}
