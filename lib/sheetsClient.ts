import { google } from 'googleapis';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const FILE_ID = '1c8vJpVXrVZhSbcDHOX1I18aDEZlsM2fm';
const CACHE_TTL_MS = 10 * 60 * 1000;

export type RawRow = Record<string, string | number | boolean>;

// Persist cache on the global object so Next.js hot-reloads don't clear it
declare global {
  // eslint-disable-next-line no-var
  var __sheetsCache: {
    buf: { data: Buffer; ts: number } | null;
    rows: Map<string, RawRow[]>;
    bufInflight: Promise<Buffer> | null;
    parseInflight: Map<string, Promise<RawRow[]>>;
  } | undefined;
}

if (!global.__sheetsCache) {
  global.__sheetsCache = {
    buf: null,
    rows: new Map(),
    bufInflight: null,
    parseInflight: new Map(),
  };
}
const store = global.__sheetsCache;

function getAuth() {
  const credsPath = path.join(process.cwd(), 'gsheets_credentials.json');
  const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

async function getBuffer(): Promise<Buffer> {
  const now = Date.now();
  if (store.buf && now - store.buf.ts < CACHE_TTL_MS) return store.buf.data;

  if (!store.bufInflight) {
    store.bufInflight = (async () => {
      const auth = getAuth();
      const drive = google.drive({ version: 'v3', auth });
      const res = await drive.files.get(
        { fileId: FILE_ID, alt: 'media', supportsAllDrives: true },
        { responseType: 'arraybuffer' }
      );
      const data = Buffer.from(res.data as ArrayBuffer);
      store.buf = { data, ts: Date.now() };
      store.rows.clear(); // invalidate parsed rows when buffer refreshes
      store.bufInflight = null;
      return data;
    })().catch(err => { store.bufInflight = null; throw err; });
  }
  return store.bufInflight;
}

export async function readSheet(sheetName: string): Promise<RawRow[]> {
  const now = Date.now();

  // Fast path: cached rows still within TTL
  if (store.buf && now - store.buf.ts < CACHE_TTL_MS && store.rows.has(sheetName)) {
    return store.rows.get(sheetName)!;
  }

  // Deduplicate concurrent parses of the same sheet
  if (!store.parseInflight.has(sheetName)) {
    const p = (async () => {
      const buf = await getBuffer();
      const wb = XLSX.read(buf, {
        type: 'buffer',
        sheets: [sheetName],
        cellDates: false,    // keep dates as Excel serials (we parse them manually)
        cellStyles: false,   // skip style metadata
        cellFormula: false,  // skip formula strings
        cellNF: false,       // skip number format strings
        raw: true,           // skip number formatting
      });
      const ws = wb.Sheets[sheetName];
      const rows: RawRow[] = ws
        ? XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '', raw: true })
        : [];
      store.rows.set(sheetName, rows);
      store.parseInflight.delete(sheetName);
      return rows;
    })().catch(err => { store.parseInflight.delete(sheetName); throw err; });
    store.parseInflight.set(sheetName, p);
  }
  return store.parseInflight.get(sheetName)!;
}
