import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { fmtDH } from '../format';
import { colors, font, radius } from '../theme';
import { Priority, WishItem } from '../types';

interface Props {
  wish:     WishItem;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit:   (wish: WishItem) => void;
}

const PRIO_STYLE: Record<Priority, { bg: string; border: string; label: string }> = {
  urgent: { bg: 'rgba(255,77,109,0.12)', border: colors.expense,  label: '🔴 Urgente'     },
  normal: { bg: 'rgba(251,191,36,0.12)', border: colors.warning,  label: '🟡 Normale'     },
  envie:  { bg: 'rgba(74,222,128,0.12)', border: colors.income,   label: '🟢 Simple envie' },
};

export function WishCard({ wish, onToggle, onDelete, onEdit }: Props) {
  const swipeRef  = useRef<Swipeable>(null);
  const prioStyle = PRIO_STYLE[wish.prio];

  const renderRightActions = () => (
    <View style={styles.actions}>
      <Pressable
        style={[styles.actionBtn, styles.editAction]}
        onPress={() => { swipeRef.current?.close(); onEdit(wish); }}
      >
        <Text style={styles.actionIcon}>✏️</Text>
        <Text style={styles.actionLabel}>Modifier</Text>
      </Pressable>
      <Pressable
        style={[styles.actionBtn, styles.deleteAction]}
        onPress={() => { swipeRef.current?.close(); onDelete(wish.id); }}
      >
        <Text style={styles.actionIcon}>🗑️</Text>
        <Text style={styles.actionLabel}>Suppr.</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <View style={[styles.card, { borderColor: prioStyle.border, backgroundColor: prioStyle.bg }]}>
        {/* Checkbox */}
        <Pressable
          style={[styles.checkbox, wish.done && styles.checkboxDone]}
          onPress={() => onToggle(wish.id)}
          hitSlop={8}
        >
          {wish.done && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>

        {/* Corps tappable → édition */}
        <Pressable style={styles.body} onPress={() => !wish.done && onEdit(wish)}>
          <View style={styles.topRow}>
            <Text style={[styles.name, wish.done && styles.nameStrike]} numberOfLines={1}>
              {wish.name}
            </Text>
            <Text style={styles.price}>{fmtDH(wish.price)}</Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={[styles.prioBadge, { backgroundColor: prioStyle.bg, borderColor: prioStyle.border }]}>
              <Text style={styles.prioText}>{prioStyle.label}</Text>
            </View>
            {wish.done && wish.convertedDate && (
              <View style={styles.convertedBadge}>
                <Text style={styles.convertedText}>✓ Converti le {wish.convertedDate.slice(0, 5)}</Text>
              </View>
            )}
            {!wish.done && (
              <Text style={styles.editHint}>appui pour modifier</Text>
            )}
          </View>

          {!!wish.note && (
            <Text style={styles.note} numberOfLines={2}>{wish.note}</Text>
          )}
        </Pressable>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    gap: 12,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  checkboxDone:  { backgroundColor: colors.income, borderColor: colors.income },
  checkmark:     { color: '#fff', fontSize: 13, fontWeight: '800' },
  body:          { flex: 1, gap: 6 },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name:          { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  nameStrike:    { textDecorationLine: 'line-through', color: colors.textSecondary },
  price:         { color: colors.warning, fontFamily: font.mono, fontSize: 14, fontWeight: '700', flexShrink: 0 },
  bottomRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  prioBadge: {
    borderRadius: 999, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  prioText:      { fontSize: 11, fontWeight: '600', color: colors.text },
  convertedBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  convertedText: { color: colors.income, fontSize: 11, fontWeight: '600' },
  editHint:      { color: colors.textSecondary, fontSize: 10, fontStyle: 'italic' },
  note:          { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },

  actions:      { flexDirection: 'row', marginVertical: 5, marginRight: 16, borderRadius: radius.card, overflow: 'hidden' },
  actionBtn:    { width: 68, justifyContent: 'center', alignItems: 'center', gap: 2 },
  editAction:   { backgroundColor: '#2563eb' },
  deleteAction: { backgroundColor: '#dc2626' },
  actionIcon:   { fontSize: 18 },
  actionLabel:  { color: '#fff', fontSize: 10, fontWeight: '700' },
});
