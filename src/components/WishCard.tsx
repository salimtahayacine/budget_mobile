import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { fmtDH } from '../format';
import { colors, font, radius } from '../theme';
import { Priority, WishItem } from '../types';

interface Props {
  wish: WishItem;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const PRIO_STYLE: Record<Priority, { bg: string; border: string; label: string }> = {
  urgent: { bg: 'rgba(255,77,109,0.12)', border: colors.expense,  label: '🔴 Urgente'     },
  normal: { bg: 'rgba(251,191,36,0.12)', border: colors.warning,  label: '🟡 Normale'     },
  envie:  { bg: 'rgba(74,222,128,0.12)', border: colors.income,   label: '🟢 Simple envie' },
};

export function WishCard({ wish, onToggle, onDelete }: Props) {
  const swipeRef  = useRef<Swipeable>(null);
  const prioStyle = PRIO_STYLE[wish.prio];

  const renderRightActions = () => (
    <Pressable
      style={styles.deleteAction}
      onPress={() => { swipeRef.current?.close(); onDelete(wish.id); }}
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
      <View style={[styles.card, { borderColor: prioStyle.border, backgroundColor: prioStyle.bg }]}>
        {/* Checkbox + content */}
        <Pressable
          style={[styles.checkbox, wish.done && styles.checkboxDone]}
          onPress={() => onToggle(wish.id)}
          hitSlop={8}
        >
          {wish.done && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>

        <View style={styles.body}>
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
          </View>

          {!!wish.note && (
            <Text style={styles.note} numberOfLines={2}>{wish.note}</Text>
          )}
        </View>
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxDone: {
    backgroundColor: colors.income,
    borderColor: colors.income,
  },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  body:      { flex: 1, gap: 6 },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name:      { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  nameStrike:{ textDecorationLine: 'line-through', color: colors.textSecondary },
  price:     { color: colors.warning, fontFamily: font.mono, fontSize: 14, fontWeight: '700', flexShrink: 0 },
  bottomRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  prioBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  prioText: { fontSize: 11, fontWeight: '600', color: colors.text },
  convertedBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  convertedText: { color: colors.income, fontSize: 11, fontWeight: '600' },
  note: { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },

  deleteAction: {
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: radius.card,
    marginVertical: 5,
    marginRight: 16,
    gap: 2,
  },
  deleteIcon:  { fontSize: 20 },
  deleteLabel: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
