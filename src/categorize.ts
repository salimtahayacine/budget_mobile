// Categorization engine — SPEC_MOBILE.md §6

export interface Category {
  label: string;
  color: string;
}

export function categorize(lib: string): Category {
  const L = (lib || '').toUpperCase();

  if (L.includes('RETRAIT GAB')) return { label: '🏧 Retrait GAB', color: '#ffa94d' };
  if (L.includes('ATTIME TECHNOLO')) return { label: '💼 Salaire', color: '#4ade80' };
  if ((L.includes('VIR. RECU') || L.includes('VIR. INSTANTANE RECU')) && !L.includes('ATTIME'))
    return { label: '💸 Virement reçu', color: '#34d399' };
  if (L.includes('EN FAVEUR DE') || L.includes('VIR. INSTANTANE EN FAVEUR'))
    return { label: '📤 Virement envoyé', color: '#ff6b9d' };
  if (L.includes('CLAUDE')) return { label: '🤖 IA & Tech', color: '#7c6fff' };
  if (L.includes('GOOGLE')) return { label: '☁️ Google', color: '#818cf8' };
  if (L.includes('INWI') || L.includes('WIN BY INWI')) return { label: '📱 Télécoms', color: '#a78bfa' };
  if (L.includes('COMMISSION') || L.includes('TAXE')) return { label: '🏦 Frais bancaires', color: '#888899' };
  if (L.includes('PAIEMENT DE FACTURE')) return { label: '💳 Facture', color: '#fbbf24' };
  if (L.includes('ACHAT PAR CARTE')) return { label: '🛍️ Achat carte', color: '#f97316' };
  if (L.includes('LOYER') || L.includes('LOCATION')) return { label: '🏠 Loyer', color: '#06b6d4' };
  if (L.includes('COURSES') || L.includes('SUPERMARCHE') || L.includes('MARJANE') || L.includes('CARREFOUR'))
    return { label: '🛒 Courses', color: '#84cc16' };
  if (L.includes('RESTAURANT') || L.includes('FOOD') || L.includes('CAFE'))
    return { label: '🍽️ Resto/Café', color: '#f43f5e' };

  return { label: '📦 Autre', color: '#64748b' };
}

// Category options for the manual add form (SPEC §9.2). Keyword is prepended
// to the libellé on save so categorize() picks it up later.
export interface CategoryOption {
  label: string;   // displayed in dropdown
  keyword: string; // '' = auto-détecté
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { label: 'Auto-détecté', keyword: '' },
  { label: '🏠 Loyer', keyword: 'LOYER' },
  { label: '🛒 Courses', keyword: 'COURSES' },
  { label: '🍽️ Resto/Café', keyword: 'RESTAURANT' },
  { label: '🏧 Retrait GAB', keyword: 'RETRAIT GAB' },
  { label: '🛍️ Achat carte', keyword: 'ACHAT PAR CARTE' },
  { label: '🤖 IA & Tech', keyword: 'CLAUDE' },
  { label: '☁️ Google', keyword: 'GOOGLE' },
  { label: '📱 Télécoms', keyword: 'INWI' },
  { label: '🏦 Frais bancaires', keyword: 'COMMISSION' },
  { label: '📤 Virement envoyé', keyword: 'EN FAVEUR DE' },
];
