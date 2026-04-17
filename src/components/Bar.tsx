import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme/colors';

type Props = {
  value: number;
  max: number;
  color: string;
  label?: string;
  compact?: boolean;
};

export function Bar({ value, max, color, label, compact }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const height = compact ? 6 : 10;
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>
          {label} {value}/{max}
        </Text>
      ) : null}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color, height }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  track: {
    width: '100%',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radii.sm,
  },
});
