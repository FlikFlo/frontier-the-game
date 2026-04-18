import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, layout, radii, spacing, typography } from '../theme/colors';

type Variant = 'primary' | 'gold' | 'secondary' | 'danger' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  subtitle?: string;
  compact?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'gold',
  disabled,
  style,
  subtitle,
  compact,
}: Props) {
  const palette = paletteFor(variant);
  const height = compact ? 36 : layout.minTouchTarget;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          opacity: disabled ? 0.35 : pressed ? 0.85 : 1,
          borderColor: palette.border,
          backgroundColor: palette.solid ?? 'transparent',
        },
        Platform.OS === 'web'
          ? ({ boxShadow: palette.shadow } as any)
          : null,
        style,
      ]}
    >
      {palette.gradient ? (
        <LinearGradient
          colors={palette.gradient as any}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      ) : null}
      <View style={styles.inner}>
        <Text style={[typography.button, { color: palette.fg, textAlign: 'center' }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={[
              typography.caption,
              { color: palette.fg, opacity: 0.75, textAlign: 'center', marginTop: 2 },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function paletteFor(variant: Variant): {
  gradient?: readonly [string, string];
  solid?: string;
  fg: string;
  border: string;
  shadow: string;
} {
  switch (variant) {
    case 'gold':
      return {
        gradient: ['#f3ce6b', '#c28b1f'],
        fg: '#241806',
        border: 'rgba(255,255,255,0.25)',
        shadow: '0 6px 18px rgba(194,139,31,0.35)',
      };
    case 'primary':
      return {
        gradient: ['#c4b4ff', '#7b5cf2'],
        fg: '#130a2e',
        border: 'rgba(255,255,255,0.25)',
        shadow: '0 6px 18px rgba(123,92,242,0.35)',
      };
    case 'danger':
      return {
        gradient: ['#f87171', '#b91c1c'],
        fg: '#1c0505',
        border: 'rgba(255,255,255,0.18)',
        shadow: '0 6px 18px rgba(185,28,28,0.35)',
      };
    case 'secondary':
      return {
        solid: 'rgba(255,255,255,0.06)',
        fg: colors.text,
        border: 'rgba(255,255,255,0.14)',
        shadow: 'none',
      };
    case 'ghost':
      return {
        solid: 'transparent',
        fg: colors.textMuted,
        border: 'rgba(255,255,255,0.05)',
        shadow: 'none',
      };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
