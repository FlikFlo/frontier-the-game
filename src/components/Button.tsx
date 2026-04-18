import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/colors';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
  subtitle?: string;
};

export function Button({ label, onPress, variant = 'primary', disabled, style, subtitle }: Props) {
  const palette =
    variant === 'primary'
      ? {
          bg: colors.accent,
          bgHighlight: colors.accentBright,
          fg: '#2b1e08',
          border: colors.borderGold,
        }
      : variant === 'danger'
        ? { bg: colors.danger, bgHighlight: '#c2493b', fg: '#1d0606', border: '#6e1f17' }
        : {
            bg: colors.bgCard,
            bgHighlight: colors.bgElevated,
            fg: colors.text,
            border: colors.border,
          };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? palette.bg : palette.bgHighlight,
          borderColor: palette.border,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
          },
        ]}
      >
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

const styles = StyleSheet.create({
  base: {
    // outer rim gives the "cast metal" look — light top, tooled frame
    padding: 2,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  inner: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
});
