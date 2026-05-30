import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarComparison } from '../components/BarComparison';
import { DonutChart, DonutSegment } from '../components/DonutChart';
import { MonthNavigator } from '../components/MonthNavigator';
import { categorize } from '../categorize';
import { fmtDH } from '../format';
import {
  selectExpenseByCategory,
  selectMonthRevenues,
  selectMonthTxs,
  selectSummary,
  useStore,
} from '../store';
import { colors, radius, spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';

type Tab = 'depenses' | 'revenus' | 'comparaison';

// Green shades palette for the Revenus donut (spec §9.4)
const GREEN_SHADES = [
  '#4ade80', '#22c55e', '#16a34a', '#86efac',
  '#bbf7d0', '#6ee7b7', '#34d399', '#10b981',
];

export function ChartsScreen() {
  const [tab, setTab] = useState<Tab>('depenses');
  const navigation    = useNavigation();

  // Expense data (by category)
  const expenseData: DonutSegment[] = useStore(selectExpenseByCategory);

  // Revenue data: Chaabi credits + manual revenues (green shades)
  const monthTxs     = useStore(selectMonthTxs);
  const manualRevs   = useStore(selectMonthRevenues);
  const rawRevGroups = buildRevenueSegments(monthTxs, manualRevs);

  // Comparaison data
  const summary = useStore(selectSummary);

  const totalExp = expenseData.reduce((a, d) => a + d.total, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.title}>📊 Graphiques</Text>
      </View>

      <MonthNavigator />

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {([
          { key: 'depenses',    label: '💸 Dépenses'   },
          { key: 'revenus',     label: '💰 Revenus'    },
          { key: 'comparaison', label: '📈 Comparaison' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'depenses' && (
          <>
            <Text style={styles.sectionTitle}>
              Dépenses par catégorie · total {fmtDH(totalExp)}
            </Text>
            <DonutChart
              data={expenseData}
              centerText={totalExp > 0 ? fmtDH(totalExp) : undefined}
            />
          </>
        )}

        {tab === 'revenus' && (
          <>
            <Text style={styles.sectionTitle}>
              Revenus par source · total {fmtDH(summary.revenus)}
            </Text>
            <DonutChart
              data={rawRevGroups}
              centerText={summary.revenus > 0 ? fmtDH(summary.revenus) : undefined}
            />
          </>
        )}

        {tab === 'comparaison' && (
          <>
            <Text style={styles.sectionTitle}>Comparaison du mois</Text>
            <BarComparison
              revenus={summary.revenus}
              depenses={summary.depenses}
              epargne={Math.max(0, summary.net)}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Build revenue segments with green palette for the donut
function buildRevenueSegments(
  txs: ReturnType<typeof selectMonthTxs>,
  manualRevs: ReturnType<typeof selectMonthRevenues>
): DonutSegment[] {
  const groups: Record<string, number> = {};

  // Chaabi/manual credit transactions grouped by category
  for (const t of txs.filter((t) => t.credit > 0)) {
    const { label } = categorize(t.lib);
    groups[label] = (groups[label] ?? 0) + t.credit;
  }
  // Manual revenue entries as a single bucket
  const manualTotal = manualRevs.reduce((a, r) => a + r.amount, 0);
  if (manualTotal > 0) groups['💰 Revenu manuel'] = manualTotal;

  return Object.entries(groups).map(([label, total], i) => ({
    label,
    total,
    color: GREEN_SHADES[i % GREEN_SHADES.length],
  }));
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: colors.text, fontSize: 24, lineHeight: 26, marginTop: -2 },
  title:     { color: colors.text, fontSize: 20, fontWeight: '800' },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText:       { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: colors.primaryLight },

  body:         { padding: spacing.page, gap: 20, paddingBottom: 40 },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
});
