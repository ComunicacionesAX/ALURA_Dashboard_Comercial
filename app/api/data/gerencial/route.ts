import { requireApiSession, getSessionFromRequest, getUserRole } from '@/lib/auth-core';
import { readSheet } from '@/lib/sheetsClient';
import { loadDashboardData } from '@/lib/excelData';
import { mockData } from '@/lib/mockData';
import { applyLocalOtifOverrides } from '@/lib/otifLocalData';
import { transformGerencial, buildGerencialFilterOptions } from '@/lib/transformGerencial';
import type { GerencialFilters } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const session = await getSessionFromRequest(request);
  if (!session || getUserRole(session.email) !== 'gerencial') {
    return Response.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filters: Partial<GerencialFilters> = {
      sociedad:  searchParams.get('sociedad')  || '',
      sbu:       searchParams.get('sbu')       || '',
      division:  searchParams.get('division')  || '',
      periodo:   searchParams.get('periodo')   || '',
      consultor: searchParams.get('consultor') || '',
      cliente:   searchParams.get('cliente')   || '',
    };

    const rows = await readSheet('Informe Comercial Gerencial');
    const filterOptions = buildGerencialFilterOptions(rows, filters.consultor || '');
    const data = applyLocalOtifOverrides(transformGerencial(rows, filters) as typeof mockData);
    return Response.json({ ...data, filterOptions });
  } catch (err) {
    console.warn('[api/data/gerencial] fallback local activado:', err);
    try {
      const data = applyLocalOtifOverrides(await loadDashboardData());
      return Response.json(data);
    } catch (fallbackErr) {
      console.warn('[api/data/gerencial] fallback mock activado:', fallbackErr);
      // Asegurar que siempre se apliquen las sobreescrituras OTIF
      const dataWithOtif = applyLocalOtifOverrides(mockData);
      return Response.json(dataWithOtif);
    }
  }
}
