// Data models — SPEC_MOBILE.md §4

export interface Transaction {
  id: number;            // Date.now()
  lib: string;           // libellé
  date: string;          // DD/MM/YYYY
  debit: number;         // expense (0 if income)
  credit: number;        // income (0 if expense)
  source: 'chaabi' | 'manual';
  fromWish?: boolean;
  category?: string;     // manual category keyword override
}

export interface ManualRevenue {
  id: number;
  lib: string;
  date: string;          // DD/MM/YYYY
  amount: number;        // positive
}

export type Priority = 'urgent' | 'normal' | 'envie';

export interface WishItem {
  id: number;
  name: string;
  price: number;
  prio: Priority;
  note: string;
  done: boolean;
  convertedDate: string | null; // DD/MM/YYYY
}

export interface SelectedMonth {
  year: number;
  month: number; // 0-indexed
}

export interface AppSettings {
  budgetLimit: number;
  manualBalance: number;
  selectedMonth: SelectedMonth;
}

export interface CalendarEvent {
  summary?: string;
  start?: { date?: string; dateTime?: string };
}

export interface CachedChaabi {
  txs: Transaction[];
  balance: number | null;
  balanceDate: string;   // DD/MM/YYYY
  calEvents: CalendarEvent[];
  timestamp: string;     // "28/5 à 14:32"
}
