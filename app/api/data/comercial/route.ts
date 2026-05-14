import { readSheet } from '@/lib/sheetsClient';
import { transformComercial } from '@/lib/transformComercial';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await readSheet('Informe Comercial Gerencial');
    const data = transformComercial(rows);
    return Response.json(data);
  } catch (err) {
    console.error('[api/data/comercial]', err);
    return Response.json({ error: 'Error cargando datos comerciales' }, { status: 500 });
  }
}
