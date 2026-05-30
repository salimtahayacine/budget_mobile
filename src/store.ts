// Global store + AsyncStorage persistence — SPEC_MOBILE.md §5, §13
// + Google Drive sync (Option A)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { DRIVE_PUSH_DEBOUNCE_MS } from './config';
import { categorize } from './categorize';
import { inMonth, todayDMY } from './format';
import { MOCK_CHAABI } from './mockData';
import {
  clearTokens,
  getValidToken,
  GoogleTokens,
  loadStoredTokens,
} from './services/googleAuth';
import {
  BackupData,
  BACKUP_VERSION,
  mergeBackup,
  pullBackup,
  pushBackup,
} from './services/driveSync';
import {
  CachedChaabi,
  ManualRevenue,
  SelectedMonth,
  Transaction,
  WishItem,
} from './types';

// ─── AsyncStorage keys ────────────────────────────────────────────────────

const K = {
  limit:   'bma_limit',
  manual:  'bma_manual',
  revs:    'bma_revs',
  wishes:  'bma_wishes',
  cache:   'bma_cache',
  balance: 'bma_balance',
} as const;

const DEFAULT_LIMIT = 3500;

async function setJSON(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

// ─── Drive push debounce ─────────────────────────────────────────────────

let _pushTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePush() {
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(async () => {
    _pushTimer = null;
    const s = useStore.getState();
    if (!s.googleTokens) return;
    const token = await getValidToken(s.googleTokens);
    if (!token) return;
    const backup = buildBackup(s);
    await pushBackup(token, backup);
    useStore.setState({ lastDriveSync: new Date().toISOString() });
  }, DRIVE_PUSH_DEBOUNCE_MS);
}

function buildBackup(s: BudgetState): BackupData {
  return {
    version:      BACKUP_VERSION,
    updatedAt:    new Date().toISOString(),
    manualTxs:    s.manualTxs,
    manualRevs:   s.manualRevs,
    wishes:       s.wishes,
    budgetLimit:  s.budgetLimit,
    manualBalance: s.manualBalance,
  };
}

// ─── Store interface ──────────────────────────────────────────────────────

interface BudgetState {
  hydrated: boolean;

  budgetLimit:    number;
  manualBalance:  number | null;
  selectedMonth:  SelectedMonth;

  manualTxs:  Transaction[];
  manualRevs: ManualRevenue[];
  wishes:     WishItem[];
  cache:      CachedChaabi | null;

  // Google auth + Drive sync
  googleTokens:  GoogleTokens | null;
  lastDriveSync: string | null;   // ISO timestamp
  driveStatus:   'idle' | 'syncing' | 'error';

  // Lifecycle
  hydrate: () => Promise<void>;

  // Google auth
  setGoogleTokens: (t: GoogleTokens | null) => void;
  disconnectGoogle: () => Promise<void>;
  syncWithDrive: () => Promise<void>;

  // Settings
  setBudgetLimit:   (v: number) => void;
  setManualBalance: (v: number) => void;
  setSelectedMonth: (m: SelectedMonth) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  goToday:   () => void;

  // Transactions
  addManualTx:    (t: Omit<Transaction, 'id' | 'source'>) => void;
  updateManualTx: (id: number, updates: Partial<Omit<Transaction, 'id' | 'source'>>) => void;
  deleteManualTx: (id: number) => void;

  // Revenues
  addRevenue:    (r: Omit<ManualRevenue, 'id'>) => void;
  updateRevenue: (id: number, updates: Partial<Omit<ManualRevenue, 'id'>>) => void;
  deleteRevenue: (id: number) => void;

  // Wishes
  addWish:    (w: Omit<WishItem, 'id' | 'done' | 'convertedDate'>) => void;
  updateWish: (id: number, updates: Partial<Omit<WishItem, 'id'>>) => void;
  deleteWish: (id: number) => void;
  toggleWish: (id: number) => void;

  // Chaabi sync (mock → real OAuth plus tard)
  refreshChaabi: () => Promise<void>;
  clearCache:    () => Promise<void>;
  importChaabi:  (txs: Transaction[], balance: number | null, balanceDate: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────

const now = new Date();

export const useStore = create<BudgetState>((set, get) => ({
  hydrated:      false,
  budgetLimit:   DEFAULT_LIMIT,
  manualBalance: null,
  selectedMonth: { year: now.getFullYear(), month: now.getMonth() },
  manualTxs:     [],
  manualRevs:    [],
  wishes:        [],
  cache:         null,
  googleTokens:  null,
  lastDriveSync: null,
  driveStatus:   'idle',

  // ── Hydration ────────────────────────────────────────────────────────
  hydrate: async () => {
    const [limit, manual, revs, wishes, cache, balance, storedTokens] =
      await Promise.all([
        getJSON<number>(K.limit),
        getJSON<Transaction[]>(K.manual),
        getJSON<ManualRevenue[]>(K.revs),
        getJSON<WishItem[]>(K.wishes),
        getJSON<CachedChaabi>(K.cache),
        getJSON<number>(K.balance),
        loadStoredTokens(),
      ]);

    // Premier lancement : seed les données mock Chaabi
    let resolvedCache = cache;
    if (!resolvedCache) {
      resolvedCache = MOCK_CHAABI;
      await setJSON(K.cache, resolvedCache);
    }

    // Auto-populate balance depuis email si pas encore défini
    let resolvedBalance = balance;
    if (resolvedBalance == null && resolvedCache?.balance != null) {
      resolvedBalance = resolvedCache.balance;
      await setJSON(K.balance, resolvedBalance);
    }

    set({
      budgetLimit:   limit ?? DEFAULT_LIMIT,
      manualTxs:     manual ?? [],
      manualRevs:    revs ?? [],
      wishes:        wishes ?? [],
      cache:         resolvedCache,
      manualBalance: resolvedBalance,
      googleTokens:  storedTokens,
      hydrated:      true,
    });

    // Pull Drive en arrière-plan si connecté
    if (storedTokens) {
      get().syncWithDrive();
    }
  },

  // ── Google auth ───────────────────────────────────────────────────────
  setGoogleTokens: (t) => {
    set({ googleTokens: t });
    if (t) get().syncWithDrive();
  },

  disconnectGoogle: async () => {
    await clearTokens();
    set({ googleTokens: null, lastDriveSync: null });
  },

  // Pull depuis Drive → merge → update local + push si local plus récent
  syncWithDrive: async () => {
    const { googleTokens } = get();
    if (!googleTokens) return;

    const token = await getValidToken(googleTokens);
    if (!token) { set({ driveStatus: 'error' }); return; }

    set({ driveStatus: 'syncing' });
    try {
      const remote = await pullBackup(token);
      if (!remote) {
        // Pas encore de backup → push local
        await pushBackup(token, buildBackup(get()));
        set({ driveStatus: 'idle', lastDriveSync: new Date().toISOString() });
        return;
      }

      const local = buildBackup(get());
      const merged = mergeBackup(local, remote);

      // Appliquer le merge localement
      await Promise.all([
        setJSON(K.manual,  merged.manualTxs),
        setJSON(K.revs,    merged.manualRevs),
        setJSON(K.wishes,  merged.wishes),
        setJSON(K.limit,   merged.budgetLimit),
        setJSON(K.balance, merged.manualBalance),
      ]);

      set({
        manualTxs:     merged.manualTxs,
        manualRevs:    merged.manualRevs,
        wishes:        merged.wishes,
        budgetLimit:   merged.budgetLimit,
        manualBalance: merged.manualBalance,
        driveStatus:   'idle',
        lastDriveSync: new Date().toISOString(),
      });

      // Push le merge vers Drive
      await pushBackup(token, merged);
    } catch (e) {
      console.warn('[store] syncWithDrive error:', e);
      set({ driveStatus: 'error' });
    }
  },

  // ── Settings ──────────────────────────────────────────────────────────
  setBudgetLimit: (v) => {
    set({ budgetLimit: v });
    setJSON(K.limit, v);
    schedulePush();
  },
  setManualBalance: (v) => {
    set({ manualBalance: v });
    setJSON(K.balance, v);
    schedulePush();
  },
  setSelectedMonth: (m) => set({ selectedMonth: m }),
  prevMonth: () => {
    const { year, month } = get().selectedMonth;
    set({ selectedMonth: month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 } });
  },
  nextMonth: () => {
    const { year, month } = get().selectedMonth;
    set({ selectedMonth: month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 } });
  },
  goToday: () => {
    const d = new Date();
    set({ selectedMonth: { year: d.getFullYear(), month: d.getMonth() } });
  },

  // ── Transactions ──────────────────────────────────────────────────────
  addManualTx: (t) => {
    const tx: Transaction = { ...t, id: Date.now(), source: 'manual' };
    const next = [...get().manualTxs, tx];
    set({ manualTxs: next });
    setJSON(K.manual, next);
    schedulePush();
  },
  updateManualTx: (id, updates) => {
    const next = get().manualTxs.map((t) => t.id === id ? { ...t, ...updates } : t);
    set({ manualTxs: next });
    setJSON(K.manual, next);
    schedulePush();
  },
  deleteManualTx: (id) => {
    const next = get().manualTxs.filter((t) => t.id !== id);
    set({ manualTxs: next });
    setJSON(K.manual, next);
    schedulePush();
  },

  // ── Revenues ─────────────────────────────────────────────────────────
  addRevenue: (r) => {
    const rev: ManualRevenue = { ...r, id: Date.now() };
    const next = [...get().manualRevs, rev];
    set({ manualRevs: next });
    setJSON(K.revs, next);
    schedulePush();
  },
  updateRevenue: (id, updates) => {
    const next = get().manualRevs.map((r) => r.id === id ? { ...r, ...updates } : r);
    set({ manualRevs: next });
    setJSON(K.revs, next);
    schedulePush();
  },
  deleteRevenue: (id) => {
    const next = get().manualRevs.filter((r) => r.id !== id);
    set({ manualRevs: next });
    setJSON(K.revs, next);
    schedulePush();
  },

  // ── Wishes ───────────────────────────────────────────────────────────
  addWish: (w) => {
    const wish: WishItem = { ...w, id: Date.now(), done: false, convertedDate: null };
    const next = [...get().wishes, wish];
    set({ wishes: next });
    setJSON(K.wishes, next);
    schedulePush();
  },
  updateWish: (id, updates) => {
    const next = get().wishes.map((w) => w.id === id ? { ...w, ...updates } : w);
    set({ wishes: next });
    setJSON(K.wishes, next);
    schedulePush();
  },
  deleteWish: (id) => {
    const next = get().wishes.filter((w) => w.id !== id);
    set({ wishes: next });
    setJSON(K.wishes, next);
    schedulePush();
  },
  toggleWish: (id) => {
    const { wishes, manualTxs } = get();
    const wish = wishes.find((w) => w.id === id);
    if (!wish) return;

    if (!wish.done) {
      const date = todayDMY();
      const tx: Transaction = {
        id: Date.now(), lib: `🌟 Souhait: ${wish.name}`,
        date, debit: wish.price, credit: 0, source: 'manual', fromWish: true,
      };
      const nextWishes = wishes.map((w) => w.id === id ? { ...w, done: true, convertedDate: date } : w);
      const nextTxs    = [...manualTxs, tx];
      set({ wishes: nextWishes, manualTxs: nextTxs });
      setJSON(K.wishes, nextWishes);
      setJSON(K.manual, nextTxs);
    } else {
      const linkedLib  = `🌟 Souhait: ${wish.name}`;
      const nextWishes = wishes.map((w) => w.id === id ? { ...w, done: false, convertedDate: null } : w);
      const nextTxs    = manualTxs.filter((t) => !(t.fromWish && t.lib === linkedLib));
      set({ wishes: nextWishes, manualTxs: nextTxs });
      setJSON(K.wishes, nextWishes);
      setJSON(K.manual, nextTxs);
    }
    schedulePush();
  },

  // ── Chaabi sync (mock) ────────────────────────────────────────────────
  refreshChaabi: async () => {
    const fresh: CachedChaabi = { ...MOCK_CHAABI, timestamp: liveTimestamp() };
    set({ cache: fresh });
    await setJSON(K.cache, fresh);
    if (get().manualBalance == null && fresh.balance != null) {
      get().setManualBalance(fresh.balance);
    }
  },
  clearCache: async () => {
    await AsyncStorage.removeItem(K.cache);
    set({ cache: null });
  },
  // ── Import manuel HTML ────────────────────────────────────────────────
  importChaabi: async (txs, balance, balanceDate) => {
    const fresh: CachedChaabi = {
      txs,
      balance:     balance ?? get().cache?.balance ?? null,
      balanceDate: balanceDate || get().cache?.balanceDate || '',
      calEvents:   get().cache?.calEvents ?? [],
      timestamp:   liveTimestamp(),
    };
    set({ cache: fresh });
    await setJSON(K.cache, fresh);
    if (balance != null && get().manualBalance == null) {
      get().setManualBalance(balance);
    }
    schedulePush();
  },
}));

function liveTimestamp(): string {
  const d  = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()}/${d.getMonth() + 1} à ${hh}:${mm}`;
}

// ─── Selectors (dérivés, filtrés par mois) — SPEC §10 ────────────────────

export interface MonthSummary {
  revenus:       number;
  chaabiRevenus: number;
  manualRevenus: number;
  depenses:      number;
  net:           number;
  pct:           number;
  budgetState:   'ok' | 'warn' | 'over';
  over:          number;
}

export function selectAllTxs(s: BudgetState): Transaction[] {
  return [...(s.cache?.txs ?? []), ...s.manualTxs];
}

export function selectMonthTxs(s: BudgetState): Transaction[] {
  const { year, month } = s.selectedMonth;
  return selectAllTxs(s).filter((t) => inMonth(t.date, year, month));
}

export function selectMonthRevenues(s: BudgetState): ManualRevenue[] {
  const { year, month } = s.selectedMonth;
  return s.manualRevs.filter((r) => inMonth(r.date, year, month));
}

export function selectSummary(s: BudgetState): MonthSummary {
  const txs           = selectMonthTxs(s);
  const chaabiRevenus = txs.filter((t) => t.credit > 0).reduce((a, t) => a + t.credit, 0);
  const manualRevenus = selectMonthRevenues(s).reduce((a, r) => a + r.amount, 0);
  const revenus       = chaabiRevenus + manualRevenus;
  const depenses      = txs.filter((t) => t.debit > 0).reduce((a, t) => a + t.debit, 0);
  const net           = revenus - depenses;
  const ratio         = depenses / s.budgetLimit;
  const pct           = Math.min(ratio * 100, 100);
  const budgetState: MonthSummary['budgetState'] =
    ratio < 0.7 ? 'ok' : ratio < 1 ? 'warn' : 'over';
  return { revenus, chaabiRevenus, manualRevenus, depenses, net, pct, budgetState, over: Math.max(0, depenses - s.budgetLimit) };
}

export function selectExpenseByCategory(s: BudgetState) {
  const groups: Record<string, { color: string; total: number }> = {};
  for (const t of selectMonthTxs(s).filter((t) => t.debit > 0)) {
    const { label, color } = categorize(t.lib);
    if (!groups[label]) groups[label] = { color, total: 0 };
    groups[label].total += t.debit;
  }
  return Object.entries(groups).map(([label, g]) => ({ label, color: g.color, total: g.total }));
}

export function selectWishlistBalance(s: BudgetState): number {
  const pending = s.wishes.filter((w) => !w.done).reduce((a, w) => a + w.price, 0);
  return (s.manualBalance ?? 0) - pending;
}
