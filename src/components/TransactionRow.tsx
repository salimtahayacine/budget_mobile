import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { categorize } from '../categorize';
import { fmtDH } from '../format';
import { colors, font, radius } from '../theme';
import { Transaction } from '../types';

interface Props {
  tx:        Transaction;
  onDelete?: (id: number) => void;
  onEdit?:   (tx: Transaction) => void;
}

export function TransactionRow({ tx, onDelete, onEdit }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const { label, color } = categorize(tx.lib);
  const isCredit = tx.credit > 0;
  const amt      = isCredit ? tx.credit : tx.debit;
  const short    = tx.lib.length > 42 ? tx.lib.slice(0, 42) + '…' : tx.lib;

  const renderRightActions = () => (
    <View style={styles.actions}>
      {onEdit && (
        <Pressable
          style={[styles.actionBtn, styles.editAction]}
          onPress={() => { swipeRef.current?.close(); onEdit(tx); }}
        >
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionLabel}>Modifier</Text>
        </Pressable>
      )}
      {onDelete && (
        <Pressable
          style={[styles.actionBtn, styles.deleteAction]}
          onPress={() => { swipeRef.current?.close(); onDelete(tx.id); }}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionLabel}>Suppr.</Text>
        </Pressable>
      )}
    </View>
  );

  const content = (
    <Pressable
      style={[styles.row, tx.source === 'manual' && styles.manualRow]}
      onPress={() => tx.source === 'manual' && onEdit?.(tx)}
      disabled={tx.source !== 'manual' || !onEdit}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />

      <View style={styles.body}>
        <Text style={styles.lib} numberOfLines={1}>{short}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.catLabel, { color }]}>{label}</Text>
          {tx.source === 'manual' && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{tx.fromWish ? 'souhait' : 'manuel'}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.date}>{tx.date.slice(0, 5)}</Text>
        <Text style={[styles.amt, isCredit ? styles.cr : styles.dr]}>
          {isCredit ? '+' : '−'}{fmtDH(amt)}
        </Text>
        {tx.source === 'manual' && onEdit && (
          <Text style={styles.editHint}>appui › modifier</Text>
        )}
      </View>
    </Pressable>
  );

  if (tx.source === 'manual' && (onDelete || onEdit)) {
    return (
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
      >
        {content}
      </Swipeable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  manualRow: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  dot:       { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  body:      { flex: 1 },
  lib:       { color: colors.text, fontSize: 13, fontWeight: '500' },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  catLabel:  { fontSize: 11, fontWeight: '600' },
  tag: {
    backgroundColor: 'rgba(124,111,255,0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tagText:  { color: colors.primaryLight, fontSize: 10, fontWeight: '700' },
  right:    { alignItems: 'flex-end', gap: 2 },
  date:     { color: colors.textSecondary, fontSize: 11 },
  amt:      { fontFamily: font.mono, fontSize: 13, fontWeight: '700' },
  editHint: { color: colors.textSecondary, fontSize: 9, marginTop: 1 },
  cr: { color: colors.income },
  dr: { color: colors.expense },

  actions: { flexDirection: 'row' },
  actionBtn: {
    width: 68,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  editAction:   { backgroundColor: '#2563eb' },
  deleteAction: { backgroundColor: '#dc2626' },
  actionIcon:   { fontSize: 18 },
  actionLabel:  { color: '#fff', fontSize: 10, fontWeight: '700' },
});
