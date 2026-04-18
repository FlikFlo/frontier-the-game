import React, { type PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../theme/colors';

type Props = PropsWithChildren<{ style?: ViewStyle; padded?: boolean }>;

export function Screen({ children, style, padded = true }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgGradientA, colors.bgGradientB]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Ambient orbs for depth — pure decoration */}
      <View style={[styles.orb, styles.orbOne]} />
      <View style={[styles.orb, styles.orbTwo]} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.outer}>
          <View style={[styles.inner, padded && { padding: spacing.lg }, style]}>
            {children}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  safe: { flex: 1 },
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
  orb: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 999,
    // On web we can actually blur these; on native they'll read as tinted
    // fills which still give a sense of ambient light.
    ...(Platform.OS === 'web'
      ? { filter: 'blur(80px)' as any, opacity: 0.45 }
      : { opacity: 0.22 }),
  },
  orbOne: {
    backgroundColor: '#5e3ba5',
    top: -120,
    left: -140,
  },
  orbTwo: {
    backgroundColor: '#9a6b1a',
    bottom: -180,
    right: -120,
  },
});
