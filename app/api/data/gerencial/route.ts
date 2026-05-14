import { readSheet } from '@/lib/sheetsClient';
import { transformGerencial, buildGerencialFilterOptions } from '@/lib/transformGerencial';
import type { GerencialFilters } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: Partial<GerencialFilters> = {
      sociedad:  searchParams.get('sociedad')  || '',
      sbu:       searchParams.get('sbu')       || '',
      periodo:   searchParams.get('periodo')   || '',
      consultor: searchParams.get('consultor') || '',
      cliente:   searchParams.get('cliente')   || '',
    };

    const rows = await readSheet('Informe Comercial Gerencial');

    // Always return filter options; scope clientes by selected consultor
    const filterOptions = buildGerencialFilterOptions(rows, filters.consultor || '');

    const data = transformGerencial(rows, filters);
    return Response.json({ ...data, filterOptions });
  } catch (err) {
    console.error('[api/data/gerencial]', err);
    return Response.json({ error: 'Error cargando datos gerenciales' }, { status: 500 });
  }
}
