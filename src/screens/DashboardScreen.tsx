import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BalanceHero } from '../components/BalanceHero';
import { BudgetBar } from '../components/BudgetBar';
import { DonutChart } from '../components/DonutChart';
import { MonthNavigator } from '../components/MonthNavigator';
import { SummaryCards } from '../components/SummaryCards';
import { categorize } from '../categorize';
import { fmtDH } from '../format';
import { selectExpenseByCategory, selectSummary, useStore } from '../store';
import { colors, radius, spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';

export function DashboardScreen() {
  const timestamp  = useStore((s) => s.cache?.timestamp ?? '—');
  const refresh    = useStore((s) => s.refreshChaabi);
  const expData    = useStore(selectExpenseByCategory);
  const summary    = useStore(selectSummary);
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Mini donut: top 3 expense categories only (keeps the preview compact)
  const miniData = [...expData]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logo}>
            budget<Text style={styles.logoDot}>.</Text>ma
          </Text>
          <View style={styles.liveTag}>
            <Text style={styles.liveText}>⚡ live</Text>
          </View>
        </View>
        <View style={styles.saveRow}>
          <View style={styles.dot} />
          <Text style={styles.saveText}>Sauvegardé · {timestamp}</Text>
        </View>
      </View>

      <MonthNavigator />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <BalanceHero />
        <SummaryCards />
        <BudgetBar />

        {/* ── Mini chart preview ────────────────────────── */}
        <Pressable
          style={styles.chartCard}
          onPress={() => (navigation as any).navigate('Charts')}
        >
          <View style={styles.chartCardHeader}>
            <Text style={styles.chartCardTitle}>📊 Répartition dépenses</Text>
            <Text style={styles.chartCardLink}>Voir tout  ›</Text>
          </View>

          {expData.length > 0 ? (
            <DonutChart
              data={miniData}
              size={180}
              strokeWidth={28}
              centerText={fmtDH(summary.depenses)}
            />
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>Aucune dépense ce mois-ci</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: 12,
  },
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo:     { color: colors.primary, fontSize: 22, fontWeight: '800' },
  logoDot:  { color: colors.textSecondary },
  liveTag: {
    backgroundColor: 'rgba(124,111,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveText: { color: colors.primaryLight, fontSize: 11, fontWeight: '700' },
  saveRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.income },
  saveText: { color: colors.textSecondary, fontSize: 11 },
  body:     { padding: spacing.page, gap: spacing.cardGapLg, paddingBottom: 32 },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 14,
    alignItems: 'center',
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  chartCardTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  chartCardLink:  { color: colors.primaryLight, fontSize: 13, fontWeight: '600' },
  chartEmpty:     { paddingVertical: 24 },
  chartEmptyText: { color: colors.textSecondary, fontSize: 14 },
});
