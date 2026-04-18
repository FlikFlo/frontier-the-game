import React from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { colors, glass, radii, spacing, typography } from '../theme/colors';

export type ResourceKind = 'gold' | 'virdite' | 'pack' | 'day';

type Props = {
  kind: ResourceKind;
  value: string | number;
  max?: number;
  emphasised?: boolean;
  style?: ViewStyle;
};

function Icon({ kind }: { kind: ResourceKind }) {
  switch (kind) {
    case 'gold':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={10} fill="#f3ce6b" />
          <Circle cx={12} cy={12} r={7} fill="#c28b1f" />
          <Path
            d="M12 7.5 v9 M9 10 h6 M9 14 h6"
            stroke="#fff8dc"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'virdite':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Polygon points="12,2 20,10 18,22 6,22 4,10" fill="#84cc16" />
          <Polygon points="12,2 20,10 12,10" fill="#a7f059" />
          <Polygon points="12,2 4,10 12,10" fill="#4a7a15" />
        </Svg>
      );
    case 'pack':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d="M6 9h12v11H6z"
            fill="#93c5fd"
            stroke="#1e3a8a"
            strokeWidth={1.2}
          />
          <Path
            d="M9 9V6a3 3 0 0 1 6 0v3"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth={1.6}
          />
        </Svg>
      );
    case 'day':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={4.5} fill="#fde68a" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * Math.PI) / 4;
            const x1 = 12 + Math.cos(a) * 7;
            const y1 = 12 + Math.sin(a) * 7;
            const x2 = 12 + Math.cos(a) * 10;
            const y2 = 12 + Math.sin(a) * 10;
            return (
              <Path
                key={i}
                d={`M${x1} ${y1} L ${x2} ${y2}`}
                stroke="#fde68a"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      );
  }
}

export function ResourceChip({ kind, value, max, emphasised, style }: Props) {
  return (
    <View style={[styles.chip, emphasised ? glass.strong : glass.card, style]}>
      <Icon kind={kind} />
      <Text style={[typography.body, styles.value]}>
        {value}
        {max !== undefined ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}> /{max}</Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 2px 6px rgba(0,0,0,0.2)' } as any)
      : null),
  },
  value: {
    color: colors.text,
    fontWeight: '700',
  },
});
