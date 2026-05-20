import { google } from 'googleapis';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const FILE_ID = '1c8vJpVXrVZhSbcDHOX1I18aDEZlsM2fm';

export type RawRow = Record<string, string | number | boolean>;

// ── Schedule-based cache invalidation ────────────────────────────────────────
// Data refreshes twice a week (Bogotá time, UTC-5, no DST):
//   • Monday  00:00  — fresh data available at start of week
//   • Friday  16:00  — weekly close update
//
// The cache is valid as long as it was filled AFTER the most recent of those
// two points. No cron job needed; staleness is checked on every request.

const BOGOTA_OFFSET_HOURS = -5;

function getLastScheduledRefreshMs(nowMs: number = Date.now()): number {
  // Shift to Bogotá "wall clock" so getUTCDay/Hour return Bogotá values
  const bogota = new Date(nowMs + BOGOTA_OFFSET_HOURS * 3_600_000);
  const dow = bogota.getUTCDay(); // 0=Sun … 6=Sat

  // Hours elapsed since the most recent Monday 00:00 Bogotá
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const hoursFromMon =
    daysFromMon * 24 + bogota.getUTCHours() + bogota.getUTCMinutes() / 60;

  // Friday 16:00 is 4*24 + 16 = 112 h after Monday 00:00
  const hoursBack =
    hoursFromMon >= 112 ? hoursFromMon - 112 : hoursFromMon;

  return nowMs - Math.round(hoursBack * 3_600_000);
}

function isCacheStale(ts: number): boolean {
  return ts < getLastScheduledRefreshMs();
}

// ── Persistent global cache ───────────────────────────────────────────────────

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

let _auth: InstanceType<typeof google.auth.GoogleAuth> | null = null;
function getAuth() {
  if (_auth) return _auth;
  const credsPath = path.join(process.cwd(), 'gsheets_credentials.json');
  const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
  _auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return _auth;
}

async function getBuffer(): Promise<Buffer> {
  if (store.buf && !isCacheStale(store.buf.ts)) return store.buf.data;

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
  // Fast path: buffer and parsed rows are both fresh
  if (store.buf && !isCacheStale(store.buf.ts) && store.rows.has(sheetName)) {
    return store.rows.get(sheetName)!;
  }

  // Deduplicate concurrent parses of the same sheet
  if (!store.parseInflight.has(sheetName)) {
    const p = (async () => {
      const buf = await getBuffer();
      const wb = XLSX.read(buf, {
        type: 'buffer',
        sheets: [sheetName],
        cellDates: false,
        cellStyles: false,
        cellFormula: false,
        cellNF: false,
        raw: true,
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
