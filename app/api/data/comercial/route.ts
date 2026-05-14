import { readSheet } from '@/lib/sheetsClient';
import { transformComercial, buildComercialFilterOptions } from '@/lib/transformComercial';
import type { ComercialFilters } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: Partial<ComercialFilters> = {
      consultor: searchParams.get('consultor') || '',
      cliente:   searchParams.get('cliente')   || '',
      producto:  searchParams.get('producto')  || '',
      periodo:   searchParams.get('periodo')   || '',
    };

    const rows = await readSheet('Informe Comercial Gerencial');

    // Always return filter options, but scope clientes/productos by consultor when one is selected
    const filterOptions = buildComercialFilterOptions(rows, filters.consultor || '');

    const data = transformComercial(rows, filters);
    return Response.json({ ...data, filterOptions });
  } catch (err) {
    console.error('[api/data/comercial]', err);
    return Response.json({ error: 'Error cargando datos comerciales' }, { status: 500 });
  }
}
