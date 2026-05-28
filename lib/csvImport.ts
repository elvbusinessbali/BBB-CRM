import type { Status } from '@/lib/status';

export type ParsedCustomer = {
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  tags: string[];
  notes: string | null;
  status: Status;
  /** Raw source row, for the user-facing preview. */
  _source: Record<string, string>;
};

/* ------------------------------------------------------------------ */
/* CSV parser — handles quoted strings, embedded commas, escaped quotes */
/* ------------------------------------------------------------------ */
export function parseCsv(text: string): Record<string, string>[] {
  // Strip UTF-8 BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows = splitRows(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length === 1 && cells[0] === '') continue; // skip blank line
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = (cells[j] ?? '').trim();
    }
    out.push(obj);
  }
  return out;
}

function splitRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      // Treat CRLF as a single newline
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  // Final cell / row
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Column auto-detection — match common header names in EN + ID        */
/* ------------------------------------------------------------------ */

type Field =
  | 'first_name'
  | 'last_name'
  | 'name'
  | 'phone'
  | 'email'
  | 'birthday'
  | 'tags'
  | 'notes'
  | 'status';

const FIELD_ALIASES: Record<Field, string[]> = {
  first_name: ['first name', 'first', 'firstname', 'given name', 'given', 'nama depan', 'nama_depan', 'first_name'],
  last_name:  ['last name', 'last', 'lastname', 'surname', 'family name', 'nama belakang', 'nama_belakang', 'last_name'],
  name:       ['name', 'full name', 'fullname', 'customer name', 'nama', 'nama lengkap'],
  phone:      ['phone', 'mobile', 'mobile number', 'tel', 'telephone', 'whatsapp', 'wa', 'wa number', 'nomor', 'nomor hp', 'no hp', 'no. hp', 'no_telepon'],
  email:      ['email', 'e-mail', 'mail', 'email address', 'surel'],
  birthday:   ['birthday', 'dob', 'date of birth', 'birth date', 'birthdate', 'tanggal lahir', 'tgl lahir', 'tanggal_lahir'],
  tags:       ['tags', 'tag', 'labels', 'label', 'category', 'kategori'],
  notes:      ['notes', 'note', 'comment', 'comments', 'description', 'catatan', 'keterangan'],
  status:     ['status', 'stage', 'pipeline', 'state'],
};

export type ColumnMap = Partial<Record<Field, string>>;

/** Given parsed headers, guess which CSV column maps to each of our fields. */
export function detectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const field of Object.keys(FIELD_ALIASES) as Field[]) {
    for (const alias of FIELD_ALIASES[field]) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1) {
        map[field] = headers[idx];
        break;
      }
    }
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Row → ParsedCustomer transform                                     */
/* ------------------------------------------------------------------ */

const STATUS_ALIASES: Record<string, Status> = {
  cold: 'cold',
  warm: 'warm',
  hot: 'hot',
  'deal done': 'deal_done',
  deal_done: 'deal_done',
  done: 'deal_done',
  won: 'deal_done',
  active: 'deal_done',
  customer: 'deal_done',
  paused: 'paused',
  pause: 'paused',
  inactive: 'paused',
  dihentikan: 'paused',
  dingin: 'cold',
  hangat: 'warm',
  panas: 'hot',
  'sudah deal': 'deal_done',
};

export function mapRow(row: Record<string, string>, cols: ColumnMap): ParsedCustomer | null {
  const get = (f: Field) => (cols[f] ? row[cols[f]!] : '');

  let first = get('first_name').trim();
  let last = get('last_name').trim() || null;

  // If we only have a single "name" column, split it on the first space.
  if (!first) {
    const full = get('name').trim();
    if (!full) return null;
    const sp = full.indexOf(' ');
    if (sp === -1) {
      first = full;
      last = null;
    } else {
      first = full.slice(0, sp);
      last = full.slice(sp + 1).trim() || null;
    }
  }
  if (!first) return null;

  const phone = get('phone').trim() || null;
  const email = get('email').trim() || null;

  // Birthday → YYYY-MM-DD if possible
  let birthday: string | null = null;
  const birthdayRaw = get('birthday').trim();
  if (birthdayRaw) {
    const parsed = parseDate(birthdayRaw);
    birthday = parsed;
  }

  // Tags → split on , or ;
  const tagsRaw = get('tags').trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const notes = get('notes').trim() || null;

  // Status → normalize
  let status: Status = 'cold';
  const statusRaw = get('status').trim().toLowerCase();
  if (statusRaw && STATUS_ALIASES[statusRaw]) {
    status = STATUS_ALIASES[statusRaw];
  }

  return {
    first_name: first,
    last_name: last,
    phone,
    email,
    birthday,
    tags,
    notes,
    status,
    _source: row,
  };
}

function parseDate(s: string): string | null {
  // Accept YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, etc. Be lenient.
  const trimmed = s.trim();
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  // DD/MM/YYYY or DD-MM-YYYY
  const m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let d = parseInt(m[1], 10);
    let mo = parseInt(m[2], 10);
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    // Guess: if first > 12, it's day-first. Otherwise prefer day-first too (Indonesian/European default).
    if (d > 12 && mo <= 12) {
      // already day-first
    } else if (mo > 12 && d <= 12) {
      // swap
      const t = d; d = mo; mo = t;
    }
    if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
    return `${y.toString().padStart(4, '0')}-${mo.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  }
  // Try Date.parse fallback
  const t = Date.parse(trimmed);
  if (!isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return null;
}
