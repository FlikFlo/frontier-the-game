import React, { type PropsWithChildren } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme/colors';

type Variant = 'default' | 'gold' | 'danger' | 'success';

type Props = PropsWithChildren<{
  title?: string;
  badge?: string;
  variant?: Variant;
  style?: ViewStyle;
  bodyStyle?: ViewStyle;
}>;

// Double-framed panel — outer carved-oak rim, inner parchment with a thin
// gold rule. The outline carries most of the medieval feel without needing
// textures or images.
export function Panel({ title, badge, variant = 'default', style, bodyStyle, children }: Props) {
  const palette = paletteFor(variant);
  return (
    <View style={[styles.outer, { borderColor: palette.outer }, style]}>
      <View style={[styles.inner, { borderColor: palette.inner, backgroundColor: palette.bg }, bodyStyle]}>
        {(title || badge) && (
          <View style={styles.headerRow}>
            {title ? (
              <Text style={[typography.h3, { color: palette.title, flex: 1 }]}>{title}</Text>
            ) : <View style={{ flex: 1 }} />}
            {badge ? (
              <Text style={[typography.caption, { color: palette.title, letterSpacing: 1 }]}>
                {badge}
              </Text>
            ) : null}
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

function paletteFor(variant: Variant): {
  outer: string;
  inner: string;
  bg: string;
  title: string;
} {
  switch (variant) {
    case 'gold':
      return { outer: colors.accentDark, inner: colors.accent, bg: '#2a2114', title: colors.accentBright };
    case 'danger':
      return { outer: '#4a1a12', inner: colors.danger, bg: '#24110c', title: '#e0a398' };
    case 'success':
      return { outer: '#2a4520', inner: colors.success, bg: '#182214', title: '#bcd89c' };
    default:
      return { outer: colors.border, inner: colors.borderLight, bg: colors.bgCard, title: colors.text };
  }
}

const styles = StyleSheet.create({
  outer: {
    padding: 2,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  inner: {
    padding: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
