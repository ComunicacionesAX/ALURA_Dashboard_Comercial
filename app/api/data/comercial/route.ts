import { requireApiSession } from '@/lib/auth-core';
import { readSheet } from '@/lib/sheetsClient';
import { loadDashboardData } from '@/lib/excelData';
import { mockData } from '@/lib/mockData';
import { applyLocalOtifOverrides } from '@/lib/otifLocalData';
import { transformComercial, buildComercialFilterOptions } from '@/lib/transformComercial';
import { DashboardData } from '@/lib/types';
import type { ComercialFilters } from '@/lib/types';

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

export async function GET(request: Request) {
  const authError = await requireApiSession(request);
  if (authError) {
    return authError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const filters: Partial<ComercialFilters> = {
      sociedad:  searchParams.get('sociedad')  || '',
      consultor: searchParams.get('consultor') || '',
      cliente:   searchParams.get('cliente')   || '',
      productos: searchParams.getAll('producto').filter(Boolean),
      division:  searchParams.get('division')  || '',
      periodo:   searchParams.get('periodo')   || '',
    };

    const rows = await readSheet('Informe Comercial Gerencial');
    const filterOptions = buildComercialFilterOptions(rows, filters.consultor || '');
    const data = applyLocalOtifOverrides(transformComercial(rows, filters) as DashboardData);
    return Response.json({ ...data, filterOptions });
  } catch (err) {
    console.warn('[api/data/comercial] fallback local activado:', err);
    try {
      const data = applyLocalOtifOverrides(await loadDashboardData());
      return Response.json(buildComercialFallback(data));
    } catch (fallbackErr) {
      console.warn('[api/data/comercial] fallback mock activado:', fallbackErr);
      // Asegurar que siempre se apliquen las sobreescrituras OTIF
      const dataWithOtif = applyLocalOtifOverrides(mockData);
      return Response.json(buildComercialFallback(dataWithOtif));
    }
  }
}
