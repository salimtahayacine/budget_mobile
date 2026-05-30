import { useRef, useState } from 'react';
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

function RevenueRow({
  rev,
  onDelete,
  onEdit,
}: {
  rev:      ManualRevenue;
  onDelete: (id: number) => void;
  onEdit:   (rev: ManualRevenue) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={styles.actions}>
      <Pressable
        style={[styles.actionBtn, styles.editAction]}
        onPress={() => { swipeRef.current?.close(); onEdit(rev); }}
      >
        <Text style={styles.actionIcon}>✏️</Text>
        <Text style={styles.actionLabel}>Modifier</Text>
      </Pressable>
      <Pressable
        style={[styles.actionBtn, styles.deleteAction]}
        onPress={() => { swipeRef.current?.close(); onDelete(rev.id); }}
      >
        <Text style={styles.actionIcon}>🗑️</Text>
        <Text style={styles.actionLabel}>Suppr.</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
      <Pressable style={styles.row} onPress={() => onEdit(rev)}>
        <View style={styles.dot} />
        <View style={styles.body}>
          <Text style={styles.lib} numberOfLines={1}>{rev.lib}</Text>
          <Text style={styles.catLabel}>💰 Revenu manuel · appui pour modifier</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.date}>{rev.date.slice(0, 5)}</Text>
          <Text style={styles.amt}>+{fmtDH(rev.amount)}</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

export function RevenusScreen() {
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [editingRev, setEditingRev] = useState<ManualRevenue | undefined>();

  const revs      = useStore(selectMonthRevenues);
  const deleteRev = useStore((s) => s.deleteRevenue);

  const total = revs.reduce((a, r) => a + r.amount, 0);

  const openEdit = (rev: ManualRevenue) => {
    setEditingRev(rev);
    setSheetOpen(true);
  };
  const closeSheet = () => {
    setSheetOpen(false);
    setEditingRev(undefined);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Revenus manuels</Text>
      </View>

      <MonthNavigator />

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
          <RevenueRow rev={item} onDelete={deleteRev} onEdit={openEdit} />
        )}
        ListEmptyComponent={<Empty />}
        contentContainerStyle={revs.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={() => { setEditingRev(undefined); setSheetOpen(true); }} color="#16a34a" />

      <AddRevenueSheet visible={sheetOpen} onClose={closeSheet} editingRev={editingRev} />
    </SafeAreaView>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>💸</Text>
      <Text style={styles.emptyText}>Aucun revenu manuel ce mois-ci</Text>
      <Text style={styles.emptySub}>Les revenus Chaabi sont dans Transactions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.page, paddingVertical: 14 },
  title:  { color: colors.text, fontSize: 20, fontWeight: '800' },

  totalBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderWidth: 1, borderColor: colors.income,
    borderRadius: radius.card,
    marginHorizontal: spacing.page, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  totalLabel: { color: colors.incomeLight, fontSize: 13, fontWeight: '600' },
  totalValue: { color: colors.income, fontFamily: font.mono, fontSize: 16, fontWeight: '700' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderLeftWidth: 3, borderLeftColor: colors.income,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 10,
  },
  dot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.income, flexShrink: 0 },
  body:     { flex: 1 },
  lib:      { color: colors.text, fontSize: 13, fontWeight: '500' },
  catLabel: { color: colors.incomeLight, fontSize: 11, fontWeight: '600', marginTop: 3 },
  right:    { alignItems: 'flex-end', gap: 4 },
  date:     { color: colors.textSecondary, fontSize: 11 },
  amt:      { color: colors.income, fontFamily: font.mono, fontSize: 13, fontWeight: '700' },

  actions:      { flexDirection: 'row' },
  actionBtn:    { width: 68, justifyContent: 'center', alignItems: 'center', gap: 2 },
  editAction:   { backgroundColor: '#2563eb' },
  deleteAction: { backgroundColor: '#dc2626' },
  actionIcon:   { fontSize: 18 },
  actionLabel:  { color: '#fff', fontSize: 10, fontWeight: '700' },

  listContent:    { paddingBottom: 90 },
  emptyContainer: { flex: 1 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { color: colors.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySub:       { color: colors.textSecondary, fontSize: 12, marginTop: 6, textAlign: 'center' },
});
