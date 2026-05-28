// Design system — extracted from SPEC_MOBILE.md §2

export const colors = {
  // Backgrounds & surfaces
  bg: '#0f0f14',
  surface: '#1a1a24',
  surfaceElevated: '#1e1e2c',
  surfaceSubtle: '#22222e',
  border: '#2d2d3d',
  borderElevated: '#3d3d5d',

  // Brand accents
  primary: '#7c6fff',
  primaryLight: '#c0b8ff',
  secondary: '#ff6b9d',

  // Semantic
  income: '#4ade80',
  incomeLight: '#86efac',
  expense: '#ff4d6d',
  warning: '#fbbf24',
  warningMuted: '#fcd34d',

  // Text
  text: '#e8e8f0',
  textSecondary: '#888899',
  textMeta: '#8899bb',
} as const;

// Gradient stop pairs (use with expo-linear-gradient or manual interpolation)
export const gradients = {
  logo: ['#7c6fff', '#ff6b9d'],
  balanceHero: ['#1a1a2e', '#16213e'],
  budgetOk: ['#22c55e', '#4ade80'],
  budgetWarn: ['#f59e0b', '#fbbf24'],
  budgetOver: ['#dc2626', '#ff4d6d'],
} as const;

export const spacing = {
  page: 16,
  cardGap: 12,
  cardGapLg: 14,
} as const;

export const radius = {
  button: 8,
  card: 12,
  hero: 16,
} as const;

export const font = {
  mono: 'Courier New',
} as const;
