import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BalanceHero } from '../components/BalanceHero';
import { BudgetBar } from '../components/BudgetBar';
import { MonthNavigator } from '../components/MonthNavigator';
import { SummaryCards } from '../components/SummaryCards';
import { useStore } from '../store';
import { colors, spacing } from '../theme';

export function DashboardScreen() {
  const timestamp = useStore((s) => s.cache?.timestamp ?? '—');
  const refresh = useStore((s) => s.refreshChaabi);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

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
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  logoDot: { color: colors.textSecondary },
  liveTag: {
    backgroundColor: 'rgba(124,111,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveText: { color: colors.primaryLight, fontSize: 11, fontWeight: '700' },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.income },
  saveText: { color: colors.textSecondary, fontSize: 11 },
  body: { padding: spacing.page, gap: spacing.cardGapLg },
});
