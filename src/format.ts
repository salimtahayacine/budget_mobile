// Formatting & date helpers — SPEC_MOBILE.md §2.4, §16

export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const MONTHS_SHORT = [
  'jan', 'fév', 'mar', 'avr', 'mai', 'jun',
  'jul', 'aoû', 'sep', 'oct', 'nov', 'déc',
];

const dhFormatter = new Intl.NumberFormat('fr-MA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtDH(n: number): string {
  return dhFormatter.format(n) + ' DH';
}

// Parse Chaabi amount strings: strip whitespace variants, comma → dot
export function parseDH(str: string): number {
  if (!str) return 0;
  const s = str.replace(/[ \s ]/g, '').replace(',', '.').trim();
  return parseFloat(s) || 0;
}

// "DD/MM/YYYY" → { day, month (0-indexed), year }
export function parseDate(dmy: string): { day: number; month: number; year: number } | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dmy);
  if (!m) return null;
  return { day: Number(m[1]), month: Number(m[2]) - 1, year: Number(m[3]) };
}

// Does a "DD/MM/YYYY" string fall in the given year/month (0-indexed)?
export function inMonth(dmy: string, year: number, month: number): boolean {
  const p = parseDate(dmy);
  return !!p && p.year === year && p.month === month;
}

// today as DD/MM/YYYY
export function todayDMY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// "Mai 2026"
export function monthLabel(year: number, month: number): string {
  return `${MONTHS_FR[month]} ${year}`;
}
