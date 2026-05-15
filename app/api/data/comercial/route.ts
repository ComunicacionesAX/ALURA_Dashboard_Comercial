import { readSheet } from '@/lib/sheetsClient';
import { loadDashboardData } from '@/lib/excelData';
import { mockData } from '@/lib/mockData';
import { applyLocalOtifOverrides } from '@/lib/otifLocalData';
import { transformComercial } from '@/lib/transformComercial';
import { DashboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';

function buildComercialFallback(data: DashboardData): DashboardData {
  return {
    ...data,
    kpis: {
      ...data.kpis,
      margenBruto: {
        ...data.kpis.margenBruto,
        label: 'Cumplimiento Ppto',
      },
    },
  };
}

export async function GET() {
  try {
    const rows = await readSheet('Informe Comercial Gerencial');
    const data = applyLocalOtifOverrides(transformComercial(rows) as DashboardData);
    return Response.json(data);
  } catch (err) {
    console.warn('[api/data/comercial] fallback local activado:', err);
    try {
      const data = await loadDashboardData();
      return Response.json(buildComercialFallback(data));
    } catch (fallbackErr) {
      console.warn('[api/data/comercial] fallback mock activado:', fallbackErr);
      return Response.json(buildComercialFallback(mockData));
    }
  }
}
