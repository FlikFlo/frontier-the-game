import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, typography } from '../theme/colors';

type Props = {
  value: number;
  max: number;
  color: string;
  label?: string;
  compact?: boolean;
  showNumbers?: boolean;
};

function lighten(hex: string): string {
  // Return a pre-chosen lighter variant per known base, otherwise the same color.
  switch (hex) {
    case colors.hp:
      return '#fda4af';
    case colors.ep:
      return '#7dd3fc';
    case colors.xp:
      return '#fde68a';
    case colors.warn:
      return '#fcd34d';
    default:
      return hex;
  }
}

export function Bar({ value, max, color, label, compact, showNumbers = true }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const height = compact ? 6 : 8;
  return (
    <View style={styles.wrap}>
      {label || showNumbers ? (
        <View style={styles.headerRow}>
          {label ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
          ) : null}
          {showNumbers ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {value}/{max}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, height }]}>
          <LinearGradient
            colors={[lighten(color), color] as any}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  track: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fill: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
});
