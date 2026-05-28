// Mock Chaabi data — stands in for the Gmail fetch until real OAuth is wired.
// Real transactions from SPEC_MOBILE.md §7.4 / DISCUSSION.md (Mai 2026).

import { CachedChaabi, Transaction } from './types';

function tx(date: string, lib: string, debit: number, credit: number): Transaction {
  return { id: new Date(date.split('/').reverse().join('-')).getTime() + Math.floor(Math.random() * 1000), lib, date, debit, credit, source: 'chaabi' };
}

export const MOCK_CHAABI: CachedChaabi = {
  balance: 92342.78,
  balanceDate: '27/05/2026',
  timestamp: '28/5 à 14:32',
  calEvents: [
    { summary: 'Réunion ATTIME', start: { dateTime: '2026-05-29T10:00:00+01:00' } },
    { summary: 'Loyer à payer', start: { date: '2026-05-31' } },
    { summary: 'Café avec Said', start: { dateTime: '2026-06-01T16:30:00+01:00' } },
    { summary: 'Courses Marjane', start: { date: '2026-06-02' } },
  ],
  txs: [
    tx('05/05/2026', 'VIR. INSTANTANE RECU ATTIME TECHNOLO', 0, 8500),
    tx('20/05/2026', 'VIR. INSTANTANE RECU ATTIME TECHNOLO', 0, 8500),
    tx('12/05/2026', 'VIR. RECU MR SALIM SAID', 0, 3500),
    tx('08/05/2026', 'RETRAIT GAB AL YAMAMA', 4700, 0),
    tx('03/05/2026', 'CLAUDE.AI SUBSCRIPTION', 189.57, 0),
    tx('15/05/2026', 'WIN BY INWI / INWI RECHARGE', 69, 0),
    tx('18/05/2026', 'GOOGLE ONE GOOGLE WOLF WAR', 35.74, 0),
    tx('22/05/2026', 'VIR. INSTANTANE EN FAVEUR DE AMTIL OUBAYD', 150, 0),
    tx('25/05/2026', 'COMMISSION TAXE', 14.85, 0),
  ],
};
