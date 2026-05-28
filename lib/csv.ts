import type { Customer, Interaction } from '@/lib/supabase/queries';

function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return '';
  const s = String(value);
  // Quote if contains comma, quote, or newline. Double up internal quotes.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(cells: Array<string | number | null | undefined>) {
  return cells.map(csvEscape).join(',');
}

export function customersToCsv(
  customers: Customer[],
  totals: Map<string, number>,
  lastSeen: Map<string, string>
): string {
  const headers = [
    'First name',
    'Last name',
    'Phone',
    'Email',
    'Birthday',
    'Status',
    'Tags',
    'Lifetime Value',
    'Last interaction',
    'Notes',
    'Created at',
  ];
  const lines = [row(headers)];
  for (const c of customers) {
    lines.push(
      row([
        c.first_name,
        c.last_name ?? '',
        c.phone ?? '',
        c.email ?? '',
        c.birthday ?? '',
        c.status,
        c.tags.join('; '),
        totals.get(c.id) ?? 0,
        lastSeen.get(c.id) ?? '',
        c.notes ?? '',
        c.created_at,
      ])
    );
  }
  return lines.join('\n');
}

export function interactionsToCsv(
  interactions: Interaction[],
  customers: Customer[]
): string {
  const byId = new Map(customers.map((c) => [c.id, c]));
  const headers = [
    'Customer first name',
    'Customer last name',
    'Kind',
    'Amount',
    'Occurred at',
    'Notes',
  ];
  const lines = [row(headers)];
  for (const i of interactions) {
    const c = byId.get(i.customer_id);
    lines.push(
      row([
        c?.first_name ?? '',
        c?.last_name ?? '',
        i.kind,
        i.amount ?? '',
        i.occurred_at,
        i.notes ?? '',
      ])
    );
  }
  return lines.join('\n');
}

/** Browser download trigger. */
export function downloadCsv(filename: string, csv: string) {
  // BOM so Excel/Sheets detect UTF-8 correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
