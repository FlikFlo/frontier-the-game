import React, { type PropsWithChildren } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, glass, radii, spacing, typography } from '../theme/colors';

type Variant = 'default' | 'gold' | 'primary' | 'danger' | 'success';

type Props = PropsWithChildren<{
  title?: string;
  badge?: string;
  variant?: Variant;
  style?: ViewStyle;
  bodyStyle?: ViewStyle;
  accentStripe?: boolean;
}>;

export function Panel({
  title,
  badge,
  variant = 'default',
  style,
  bodyStyle,
  accentStripe,
  children,
}: Props) {
  const accent = accentFor(variant);
  const glassStyle = variant === 'default' ? glass.card : glass.strong;

  return (
    <View style={[styles.outer, glassStyle, style]}>
      {accentStripe !== false && accent.stripe ? (
        <View
          style={[
            styles.stripe,
            { backgroundColor: accent.stripe, borderColor: accent.stripe },
          ]}
        />
      ) : null}
      <View style={[styles.inner, bodyStyle]}>
        {title || badge ? (
          <View style={styles.headerRow}>
            {title ? (
              <Text style={[typography.h2, { color: colors.text, flex: 1 }]}>{title}</Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {badge ? (
              <Text
                style={[
                  typography.label,
                  { color: accent.badge, backgroundColor: accent.badgeBg },
                  styles.badge,
                ]}
              >
                {badge}
              </Text>
            ) : null}
          </View>
        ) : null}
        {children}
      </View>
    </View>
  );
}

function accentFor(variant: Variant): {
  stripe: string | null;
  badge: string;
  badgeBg: string;
} {
  switch (variant) {
    case 'gold':
      return { stripe: colors.accent, badge: colors.accentBright, badgeBg: colors.accentSoft };
    case 'primary':
      return { stripe: colors.primary, badge: colors.primaryBright, badgeBg: colors.primarySoft };
    case 'danger':
      return { stripe: colors.danger, badge: colors.danger, badgeBg: colors.dangerSoft };
    case 'success':
      return { stripe: colors.success, badge: colors.success, badgeBg: colors.successSoft };
    default:
      return { stripe: null, badge: colors.textMuted, badgeBg: 'rgba(255,255,255,0.05)' };
  }
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 24px rgba(0,0,0,0.35)' } as any)
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6 }),
  },
  stripe: {
    height: 2,
    width: '100%',
  },
  inner: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
});
