// Pre-warm the data cache when the server starts so the first user request
// hits memory instead of waiting for a 73 MB download + xlsb parse.
export async function register() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[instrumentation] Dev mode: skip pre-warming cache');
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { hasSheetsCredentials } = await import('./lib/sheetsClient');

    if (!hasSheetsCredentials()) {
      console.warn('[instrumentation] Sin credenciales de Google Sheets. Se usaran datos locales.');
      return;
    }

    try {
      const { readSheet } = await import('./lib/sheetsClient');
      await readSheet('Informe Comercial Gerencial');
      console.log('[instrumentation] Cache pre-warmed: Informe Comercial Gerencial');
    } catch (err) {
      // Non-fatal: the first real request will download the file instead
      console.warn('[instrumentation] Cache pre-warm failed:', err);
    }
  }
}
