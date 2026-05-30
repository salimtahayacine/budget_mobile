// Parser Chaabi Bank email — React Native (pas de DOMParser)
// Utilise des regex sur le HTML brut, fidèle à la logique du web §7

import { parseDH } from '../format';
import { Transaction } from '../types';

export interface ParseResult {
  txs:         Transaction[];
  balance:     number | null;
  balanceDate: string;        // DD/MM/YYYY
  error?:      string;
}

// Extrait le texte d'un fragment HTML (retire les balises, décode les entités)
function htmlText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')           // strip tags
    .replace(/&nbsp;/gi,  ' ')
    .replace(/&#160;/gi,  ' ')
    .replace(/&amp;/gi,   '&')
    .replace(/&lt;/gi,    '<')
    .replace(/&gt;/gi,    '>')
    .replace(/&quot;/gi,  '"')
    .replace(/\s+/g,      ' ')
    .trim();
}

export function parseChaabi(rawHtml: string): ParseResult {
  if (!rawHtml?.trim()) {
    return { txs: [], balance: null, balanceDate: '', error: 'Contenu vide' };
  }

  const txs: Transaction[] = [];
  let balance:     number | null = null;
  let balanceDate: string        = '';

  // Normalise le HTML sur une seule ligne pour simplifier les regex
  const html = rawHtml
    .replace(/\r?\n/g, ' ')
    .replace(/\t/g,    ' ')
    .replace(/\s{2,}/g,' ');

  // Extrait tous les blocs <tr>…</tr>
  const trRe = /<tr(?:\s[^>]*)?>(.+?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trRe.exec(html)) !== null) {
    const rowHtml = trMatch[1];

    // Extrait les cellules <td>…</td> du bloc courant
    const tdRe = /<td(?:\s[^>]*)?>(.+?)<\/td>/gi;
    const cells: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRe.exec(rowHtml)) !== null) {
      cells.push(htmlText(tdMatch[1]));
    }

    // Ligne de transaction : 6 cellules, première = DD/MM/YYYY
    if (cells.length >= 6 && /^\d{2}\/\d{2}\/\d{4}$/.test(cells[0])) {
      const lib    = cells[2] ?? '';
      const debit  = parseDH(cells[4] ?? '');
      const credit = parseDH(cells[5] ?? '');
      if (lib && (debit > 0 || credit > 0)) {
        txs.push({
          id:     Date.now() + txs.length,
          lib:    lib.trim(),
          date:   cells[0],
          debit,
          credit,
          source: 'chaabi',
        });
      }
    }

    // Ligne "Nouveau solde"
    const rowText = htmlText(rowHtml);
    if (/nouveau\s+solde/i.test(rowText)) {
      const lastCell = cells[cells.length - 1] ?? '';
      const parsed   = parseDH(lastCell);
      if (parsed > 0) balance = parsed;
      const dm = rowText.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dm) balanceDate = dm[1];
    }
  }

  if (txs.length === 0 && balance === null) {
    return {
      txs: [],
      balance: null,
      balanceDate: '',
      error: 'Aucune transaction détectée. Vérifiez que vous avez collé le HTML complet du relevé Chaabi.',
    };
  }

  return { txs, balance, balanceDate };
}
