// Donut chart — react-native-svg, no extra dependency
// Segments: stacked SVG circles with strokeDasharray trick
// Tap legend item → highlight segment + show amount in center

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { fmtDH } from '../format';
import { colors, font, radius } from '../theme';

export interface DonutSegment {
  label: string;
  color: string;
  total: number;
}

interface Props {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerText?: string; // shown when nothing selected
}

// Small gap (in degrees) between segments for readability
const GAP_DEG = 1.5;

export function DonutChart({ data, size = 220, strokeWidth = 36, centerText }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const segments = data.filter((d) => d.total > 0);
  const total    = segments.reduce((a, d) => a + d.total, 0);

  const cx = size / 2;
  const cy = size / 2;
  const r  = (size - strokeWidth) / 2;
  const C  = 2 * Math.PI * r; // circumference

  if (total === 0 || segments.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.surfaceSubtle} strokeWidth={strokeWidth} />
        </Svg>
        <Text style={styles.emptyText}>Aucune donnée ce mois-ci</Text>
      </View>
    );
  }

  // Build arc params for each segment
  let cursor = -90; // degrees, start from top
  const arcs = segments.map((seg, i) => {
    const frac      = seg.total / total;
    const angleDeg  = frac * 360 - (segments.length > 1 ? GAP_DEG : 0);
    const arcLen    = (angleDeg / 360) * C;
    const start     = cursor;
    cursor         += frac * 360;
    return { ...seg, arcLen, startDeg: start, idx: i };
  });

  const selected = selectedIdx !== null ? segments[selectedIdx] : null;

  return (
    <View style={styles.wrap}>
      {/* SVG Donut */}
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background ring */}
          <Circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={colors.surfaceSubtle}
            strokeWidth={strokeWidth}
          />
          {arcs.map((arc) => {
            const isSelected = selectedIdx === arc.idx;
            const dimmed     = selectedIdx !== null && !isSelected;
            return (
              <Circle
                key={arc.idx}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={isSelected ? strokeWidth + 8 : strokeWidth}
                strokeDasharray={`${arc.arcLen} ${C}`}
                strokeLinecap="butt"
                transform={`rotate(${arc.startDeg} ${cx} ${cy})`}
                opacity={dimmed ? 0.3 : 1}
              />
            );
          })}
        </Svg>

        {/* Center overlay */}
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          {selected ? (
            <>
              <Text style={[styles.centerAmt, { color: selected.color }]}>
                {fmtDH(selected.total)}
              </Text>
              <Text style={styles.centerPct}>
                {((selected.total / total) * 100).toFixed(1)}%
              </Text>
            </>
          ) : centerText ? (
            <Text style={styles.centerTotal}>{centerText}</Text>
          ) : null}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {segments.map((seg, i) => (
          <Pressable
            key={i}
            style={[
              styles.legendItem,
              selectedIdx === i && { backgroundColor: seg.color + '18', borderColor: seg.color },
            ]}
            onPress={() => setSelectedIdx(selectedIdx === i ? null : i)}
          >
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{seg.label}</Text>
            <Text style={[styles.legendAmt, { color: seg.color }]}>
              {fmtDH(seg.total)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { alignItems: 'center', gap: 20 },
  emptyWrap:  { alignItems: 'center', gap: 12 },
  emptyText:  { color: colors.textSecondary, fontSize: 14 },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  centerAmt: {
    fontFamily: font.mono,
    fontSize: 17,
    fontWeight: '800',
  },
  centerPct: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  centerTotal: {
    fontFamily: font.mono,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  legend: {
    width: '100%',
    gap: 6,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceSubtle,
  },
  legendDot:   { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendLabel: { flex: 1, color: colors.text, fontSize: 13 },
  legendAmt:   { fontFamily: font.mono, fontSize: 13, fontWeight: '700' },
});
