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
  first_name: [
    'first name', 'first', 'firstname', 'first_name', 'fname',
    'given name', 'given', 'forename',
    'nama depan', 'nama_depan', 'namadepan',
  ],
  last_name: [
    'last name', 'last', 'lastname', 'last_name', 'lname',
    'surname', 'family name', 'familyname',
    'nama belakang', 'nama_belakang', 'namabelakang', 'nama keluarga',
  ],
  name: [
    'name', 'full name', 'fullname', 'full_name', 'customer name', 'customername',
    'contact name', 'contact', 'display name',
    'nama', 'nama lengkap', 'nama_lengkap', 'nama customer', 'nama pelanggan', 'pelanggan',
  ],
  phone: [
    'phone', 'phone number', 'phonenumber', 'phone_number',
    'mobile', 'mobile number', 'mobile phone', 'mobile_phone', 'cell', 'cellphone',
    'tel', 'telephone', 'telp',
    'whatsapp', 'whatsapp number', 'wa', 'wa number', 'wa_number', 'no wa', 'nowa',
    'nomor', 'nomor hp', 'no hp', 'no. hp', 'nohp', 'no_hp', 'no telepon', 'no_telepon', 'no telp',
    'hp', 'kontak', 'contact number',
  ],
  email: [
    'email', 'e-mail', 'email address', 'emailaddress', 'mail',
    'surel', 'alamat email',
  ],
  birthday: [
    'birthday', 'dob', 'd.o.b', 'date of birth', 'birth date', 'birthdate', 'birth',
    'tanggal lahir', 'tgl lahir', 'tanggal_lahir', 'ulang tahun',
  ],
  tags: [
    'tags', 'tag', 'labels', 'label', 'category', 'categories', 'segment',
    'kategori', 'tipe customer', 'jenis',
  ],
  notes: [
    'notes', 'note', 'comment', 'comments', 'description', 'remarks', 'memo',
    'catatan', 'keterangan', 'note customer', 'memo',
  ],
  status: [
    'status', 'stage', 'pipeline', 'state', 'lead status', 'customer status',
    'tahap', 'kondisi',
  ],
};

export type ColumnMap = Partial<Record<Field, string>>;

/** Loose canonicalization: lowercase, drop everything except letters/numbers. */
function canon(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** Given parsed headers, guess which CSV column maps to each of our fields. */
export function detectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  const canonized = headers.map(canon);
  for (const field of Object.keys(FIELD_ALIASES) as Field[]) {
    for (const alias of FIELD_ALIASES[field]) {
      const a = canon(alias);
      const idx = canonized.indexOf(a);
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

  const phone = normalizePhone(get('phone'));
  const email = normalizeEmail(get('email'));

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

/** Strip spaces, dashes, parens; keep leading + if present. Returns null if no digits. */
function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return null;
  return hasPlus ? '+' + digits : digits;
}

function normalizeEmail(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return null;
  return trimmed;
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
