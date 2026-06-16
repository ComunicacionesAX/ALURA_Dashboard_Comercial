import { requireApiSession } from '@/lib/auth-core';
import { hasSheetsCredentials, readSheet } from '@/lib/sheetsClient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authError = await requireApiSession(request);
  if (authError) return authError;

  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      GSHEETS_FILE_ID:          process.env.GSHEETS_FILE_ID ? '✓ configurado' : '✗ FALTA',
      GSHEETS_CREDENTIALS_JSON: process.env.GSHEETS_CREDENTIALS_JSON ? '✓ configurado' : '✗ FALTA',
      AUTH_GERENCIAL_USERS:     process.env.AUTH_GERENCIAL_USERS ? '✓ configurado' : '✗ FALTA',
      AUTH_SECRET:              process.env.AUTH_SECRET ? '✓ configurado' : '✗ FALTA',
    },
    credentials_detected: hasSheetsCredentials(),
  };

  // Intentar leer Google Sheets
  try {
    const rows = await readSheet('Informe Comercial Gerencial');
    const sample = rows.slice(0, 1);
    report.sheets_status = 'OK';
    report.sheets_rows   = rows.length;
    report.sheets_columns = sample.length > 0 ? Object.keys(sample[0]) : [];
    report.has_Es_Ppto   = sample.length > 0 ? 'Es_Ppto' in sample[0] : false;
    report.has_UB        = sample.length > 0 ? 'UB' in sample[0] : false;
    report.has_Ppto_UB   = sample.length > 0 ? 'Ppto UB' in sample[0] : false;

    // Verificar valores Es_Ppto
    const esppto = new Set(rows.map(r => String(r['Es_Ppto'] ?? '')));
    report.Es_Ppto_values = [...esppto].slice(0, 5);
  } catch (err) {
    report.sheets_status = 'ERROR';
    report.sheets_error  = String(err);
  }

  return Response.json(report, { status: 200 });
}
