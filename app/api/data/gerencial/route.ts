import { readSheet } from '@/lib/sheetsClient';
import { transformGerencial } from '@/lib/transformGerencial';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await readSheet('Informe Comercial Gerencial');
    const data = transformGerencial(rows);
    return Response.json(data);
  } catch (err) {
    console.error('[api/data/gerencial]', err);
    return Response.json({ error: 'Error cargando datos gerenciales' }, { status: 500 });
  }
}
