import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fmtDH, MONTHS_FR } from '../format';
import { selectSummary, useStore } from '../store';
import { colors, font, radius } from '../theme';

export function SummaryCards() {
  const summary = useStore(selectSummary);
  const month = useStore((s) => s.selectedMonth.month);
  const monthName = MONTHS_FR[month];

  const netPositive = summary.net >= 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Card
        label="💰 Revenus"
        amount={fmtDH(summary.revenus)}
        color={colors.income}
        sub={`Chaabi ${fmtDH(summary.chaabiRevenus)} + Manuel ${fmtDH(summary.manualRevenus)}`}
      />
      <Card
        label="💸 Dépenses"
        amount={fmtDH(summary.depenses)}
        color={colors.expense}
        sub={monthName}
      />
      <Card
        label="📊 Flux net"
        amount={(netPositive ? '+' : '') + fmtDH(summary.net)}
        color={netPositive ? colors.primary : colors.expense}
        sub={netPositive ? 'Épargne du mois' : 'Déficit du mois'}
      />
    </ScrollView>
  );
}

function Card({ label, amount, color, sub }: { label: string; amount: string; color: string; sub: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardAmount, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {amount}
      </Text>
      <Text style={styles.cardSub} numberOfLines={2}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 12, paddingVertical: 2 },
  card: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  cardAmount: { fontSize: 22, fontFamily: font.mono, fontWeight: '700', marginVertical: 8 },
  cardSub: { color: colors.textSecondary, fontSize: 11 },
});
