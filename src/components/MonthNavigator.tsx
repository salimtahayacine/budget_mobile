import { Pressable, StyleSheet, Text, View } from 'react-native';
import { monthLabel } from '../format';
import { useStore } from '../store';
import { colors, radius } from '../theme';

export function MonthNavigator() {
  const { year, month } = useStore((s) => s.selectedMonth);
  const prevMonth = useStore((s) => s.prevMonth);
  const nextMonth = useStore((s) => s.nextMonth);
  const goToday = useStore((s) => s.goToday);

  return (
    <View style={styles.row}>
      <Pressable onPress={prevMonth} style={styles.arrow} hitSlop={8}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.label}>{monthLabel(year, month)}</Text>
        <Pressable onPress={goToday} style={styles.chip} hitSlop={6}>
          <Text style={styles.chipText}>Aujourd'hui</Text>
        </Pressable>
      </View>

      <Pressable onPress={nextMonth} style={styles.arrow} hitSlop={8}>
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: colors.text, fontSize: 22, lineHeight: 24 },
  center: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: colors.text, fontSize: 16, fontWeight: '700' },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(124,111,255,0.18)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: { color: colors.primaryLight, fontSize: 11, fontWeight: '600' },
});
