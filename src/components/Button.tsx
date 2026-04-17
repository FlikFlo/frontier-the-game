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
      ? { bg: colors.accent, fg: '#1a1a1a', border: colors.accentDark }
      : variant === 'danger'
        ? { bg: colors.danger, fg: '#fff', border: '#7a2a25' }
        : { bg: colors.bgCard, fg: colors.text, border: colors.border };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View>
        <Text style={[typography.button, { color: palette.fg, textAlign: 'center' }]}>{label}</Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: palette.fg, opacity: 0.75, textAlign: 'center', marginTop: 2 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
  },
});
