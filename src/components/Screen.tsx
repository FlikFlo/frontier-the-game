import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../theme/colors';

type Props = PropsWithChildren<{ style?: ViewStyle; padded?: boolean }>;

export function Screen({ children, style, padded = true }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.outer}>
        <View style={[styles.inner, padded && { padding: spacing.lg }, style]}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    backgroundColor: colors.bg,
  },
});
