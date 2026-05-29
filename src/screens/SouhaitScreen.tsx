import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddWishSheet } from '../components/AddWishSheet';
import { FAB } from '../components/FAB';
import { WishCard } from '../components/WishCard';
import { fmtDH } from '../format';
import { selectWishlistBalance, useStore } from '../store';
import { colors, font, radius, spacing } from '../theme';
import { Priority, WishItem } from '../types';

const PRIO_ORDER: Record<Priority, number> = { urgent: 0, normal: 1, envie: 2 };

function sortWishes(wishes: WishItem[]): WishItem[] {
  return [...wishes].sort((a, b) => {
    // Pending before done
    if (a.done !== b.done) return a.done ? 1 : -1;
    // Among pending: by priority
    if (!a.done) return PRIO_ORDER[a.prio] - PRIO_ORDER[b.prio];
    return 0;
  });
}

export function SouhaitScreen() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const wishes         = useStore((s) => s.wishes);
  const manualBalance  = useStore((s) => s.manualBalance);
  const toggleWish     = useStore((s) => s.toggleWish);
  const deleteWish     = useStore((s) => s.deleteWish);
  const wishBalance    = useStore(selectWishlistBalance);

  const sorted    = sortWishes(wishes);
  const pending   = wishes.filter((w) => !w.done);
  const converted = wishes.filter((w) =>  w.done);

  const totalPending   = pending.reduce((a, w) => a + w.price, 0);
  const totalConverted = converted.reduce((a, w) => a + w.price, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Souhaits</Text>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <SumItem label="En attente"   value={fmtDH(totalPending)}   color={colors.warning}    />
          <SumItem label="Convertis"    value={fmtDH(totalConverted)} color={colors.textSecondary} />
          <SumItem
            label="Solde restant"
            value={manualBalance != null ? fmtDH(wishBalance) : '— DH'}
            color={wishBalance >= 0 ? colors.income : colors.expense}
          />
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(w) => String(w.id)}
        renderItem={({ item }) => (
          <WishCard wish={item} onToggle={toggleWish} onDelete={deleteWish} />
        )}
        ListEmptyComponent={<Empty />}
        contentContainerStyle={sorted.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={() => setSheetOpen(true)} color={colors.warning} icon="+" />

      <AddWishSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </SafeAreaView>
  );
}

function SumItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.sumItem}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={[styles.sumValue, { color }]}>{value}</Text>
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🌟</Text>
      <Text style={styles.emptyText}>Aucun souhait pour l'instant</Text>
      <Text style={styles.emptySub}>Appuie sur + pour en ajouter un</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.page, paddingVertical: 14 },
  title:  { color: colors.text, fontSize: 20, fontWeight: '800' },

  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    marginHorizontal: spacing.page,
    marginBottom: 12,
    padding: 14,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumItem:    { alignItems: 'center', flex: 1 },
  sumLabel:   { color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  sumValue:   { fontFamily: font.mono, fontSize: 13, fontWeight: '700' },

  listContent:    { paddingBottom: 90 },
  emptyContainer: { flex: 1 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { color: colors.text, fontSize: 16, fontWeight: '600' },
  emptySub:       { color: colors.textSecondary, fontSize: 13, marginTop: 6 },
});
