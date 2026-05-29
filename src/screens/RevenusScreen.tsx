import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddRevenueSheet } from '../components/AddRevenueSheet';
import { FAB } from '../components/FAB';
import { MonthNavigator } from '../components/MonthNavigator';
import { fmtDH } from '../format';
import { selectMonthRevenues, useStore } from '../store';
import { colors, font, radius, spacing } from '../theme';
import { ManualRevenue } from '../types';
import { useRef } from 'react';

function RevenueRow({
  rev,
  onDelete,
}: {
  rev: ManualRevenue;
  onDelete: (id: number) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <Pressable
      style={styles.deleteAction}
      onPress={() => { swipeRef.current?.close(); onDelete(rev.id); }}
    >
      <Text style={styles.deleteIcon}>🗑️</Text>
      <Text style={styles.deleteLabel}>Suppr.</Text>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <View style={styles.row}>
        <View style={styles.dot} />
        <View style={styles.body}>
          <Text style={styles.lib} numberOfLines={1}>{rev.lib}</Text>
          <Text style={styles.catLabel}>💰 Revenu manuel</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.date}>{rev.date.slice(0, 5)}</Text>
          <Text style={styles.amt}>+{fmtDH(rev.amount)}</Text>
        </View>
      </View>
    </Swipeable>
  );
}

export function RevenusScreen() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const revs      = useStore(selectMonthRevenues);
  const deleteRev = useStore((s) => s.deleteRevenue);

  const total = revs.reduce((a, r) => a + r.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Revenus manuels</Text>
      </View>

      <MonthNavigator />

      {/* Total bar */}
      {revs.length > 0 && (
        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>Total du mois</Text>
          <Text style={styles.totalValue}>{fmtDH(total)}</Text>
        </View>
      )}

      <FlatList
        data={revs}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <RevenueRow rev={item} onDelete={deleteRev} />
        )}
        ListEmptyComponent={<Empty />}
        contentContainerStyle={revs.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={() => setSheetOpen(true)} color="#16a34a" />

      <AddRevenueSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </SafeAreaView>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>💸</Text>
      <Text style={styles.emptyText}>Aucun revenu manuel ce mois-ci</Text>
      <Text style={styles.emptySub}>Les revenus Chaabi sont affichés dans Transactions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.page, paddingVertical: 14 },
  title:  { color: colors.text, fontSize: 20, fontWeight: '800' },

  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1,
    borderColor: colors.income,
    borderRadius: radius.card,
    marginHorizontal: spacing.page,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  totalLabel: { color: colors.incomeLight, fontSize: 13, fontWeight: '600' },
  totalValue: { color: colors.income, fontFamily: font.mono, fontSize: 16, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.income,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  dot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.income, flexShrink: 0 },
  body:     { flex: 1 },
  lib:      { color: colors.text, fontSize: 13, fontWeight: '500' },
  catLabel: { color: colors.incomeLight, fontSize: 11, fontWeight: '600', marginTop: 3 },
  right:    { alignItems: 'flex-end', gap: 4 },
  date:     { color: colors.textSecondary, fontSize: 11 },
  amt:      { color: colors.income, fontFamily: font.mono, fontSize: 13, fontWeight: '700' },

  deleteAction: {
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    gap: 2,
  },
  deleteIcon:  { fontSize: 20 },
  deleteLabel: { color: '#fff', fontSize: 10, fontWeight: '700' },

  listContent:    { paddingBottom: 90 },
  emptyContainer: { flex: 1 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { color: colors.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySub:       { color: colors.textSecondary, fontSize: 12, marginTop: 6, textAlign: 'center' },
});
