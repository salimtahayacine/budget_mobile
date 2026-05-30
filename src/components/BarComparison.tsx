// Bar chart comparison — react-native-svg
// 3 bars: Revenus (vert) | Dépenses (rouge) | Épargne (violet)
// Y-axis ticks + grid lines style spec §9.4

import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Line, Rect, Svg, Text as SvgText } from 'react-native-svg';
import { fmtDH } from '../format';
import { colors, font } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  revenus:  number;
  depenses: number;
  epargne:  number; // max(0, revenus - depenses)
}

const PADDING_LEFT  = 72;  // space for Y-axis labels
const PADDING_RIGHT = 16;
const PADDING_TOP   = 16;
const PADDING_BOT   = 44;  // space for X-axis labels
const CHART_H       = 200;
const SVG_W         = SCREEN_W - 32; // full width minus page padding
const SVG_H         = CHART_H + PADDING_TOP + PADDING_BOT;
const PLOT_W        = SVG_W - PADDING_LEFT - PADDING_RIGHT;
const PLOT_H        = CHART_H;
const BAR_GAP       = 12;
const NUM_BARS      = 3;
const BAR_W         = (PLOT_W - BAR_GAP * (NUM_BARS + 1)) / NUM_BARS;
const TICK_COUNT    = 4;

const BARS = [
  { key: 'revenus',  label: '💰 Revenus',  color: '#22c55e' },
  { key: 'depenses', label: '💸 Dépenses', color: '#ff4d6d' },
  { key: 'epargne',  label: '📈 Épargne',  color: '#7c6fff' },
] as const;

function niceMax(v: number): number {
  if (v === 0) return 1000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / magnitude) * magnitude;
}

export function BarComparison({ revenus, depenses, epargne }: Props) {
  const values = { revenus, depenses, epargne };
  const maxVal = niceMax(Math.max(revenus, depenses, epargne, 1));

  const toY = (v: number) =>
    PADDING_TOP + PLOT_H - (v / maxVal) * PLOT_H;

  // Y-axis tick values
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) =>
    (maxVal / TICK_COUNT) * i
  );

  return (
    <View style={styles.wrap}>
      <Svg width={SVG_W} height={SVG_H}>
        {/* Grid lines */}
        {ticks.map((t, i) => {
          const y = toY(t);
          return (
            <Line
              key={i}
              x1={PADDING_LEFT} y1={y}
              x2={SVG_W - PADDING_RIGHT} y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray={i === 0 ? undefined : '4 4'}
            />
          );
        })}

        {/* Y-axis labels */}
        {ticks.map((t, i) => (
          <SvgText
            key={i}
            x={PADDING_LEFT - 6}
            y={toY(t) + 4}
            textAnchor="end"
            fontSize={9}
            fill={colors.textSecondary}
            fontFamily={font.mono}
          >
            {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : String(Math.round(t))}
          </SvgText>
        ))}

        {/* Bars */}
        {BARS.map((bar, i) => {
          const x   = PADDING_LEFT + BAR_GAP * (i + 1) + BAR_W * i;
          const val = values[bar.key];
          const h   = Math.max((val / maxVal) * PLOT_H, val > 0 ? 2 : 0);
          const y   = PADDING_TOP + PLOT_H - h;

          return (
            <Rect
              key={bar.key}
              x={x}
              y={y}
              width={BAR_W}
              height={h}
              rx={4}
              ry={4}
              fill={bar.color}
              opacity={val === 0 ? 0.2 : 0.85}
            />
          );
        })}

        {/* X-axis labels (amount above bar) */}
        {BARS.map((bar, i) => {
          const x   = PADDING_LEFT + BAR_GAP * (i + 1) + BAR_W * i + BAR_W / 2;
          const val = values[bar.key];
          const h   = (val / maxVal) * PLOT_H;
          const y   = PADDING_TOP + PLOT_H - h - 4;
          if (val === 0) return null;
          return (
            <SvgText
              key={bar.key}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize={9}
              fill={bar.color}
              fontFamily={font.mono}
              fontWeight="bold"
            >
              {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(Math.round(val))}
            </SvgText>
          );
        })}
      </Svg>

      {/* X-axis legend */}
      <View style={styles.legend}>
        {BARS.map((bar) => (
          <View key={bar.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: bar.color }]} />
            <Text style={styles.legendText}>{bar.label}</Text>
          </View>
        ))}
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <SumCard label="Revenus"  value={fmtDH(revenus)}  color="#22c55e" />
        <SumCard label="Dépenses" value={fmtDH(depenses)} color="#ff4d6d" />
        <SumCard label="Épargne"  value={fmtDH(epargne)}  color="#7c6fff" />
      </View>
    </View>
  );
}

function SumCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.sumCard, { borderColor: color }]}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={[styles.sumValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { gap: 16, alignItems: 'center' },
  legend:     { flexDirection: 'row', gap: 20, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textSecondary, fontSize: 12 },

  summaryRow: { flexDirection: 'row', gap: 10, width: '100%', paddingHorizontal: 4 },
  sumCard: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  sumLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  sumValue: { fontFamily: font.mono, fontSize: 13, fontWeight: '800' },
});
