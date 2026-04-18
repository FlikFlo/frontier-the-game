import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BeetleArt,
  GolemArt,
  HeroArt,
  MageArt,
  MazeHeartArt,
  MinerArt,
  RangerArt,
  RatArt,
  SlabArt,
  SpiderArt,
  StoneGuardArt,
  type CreatureArtProps,
} from '../art/creatures';
import { colors, radii } from '../theme/colors';

type Side = 'ally' | 'enemy';

type Props = {
  sigil: string;
  side: Side;
  size?: number;
  dim?: boolean;
  style?: ViewStyle;
};

type NativeArtSpec = {
  Art: React.FC<CreatureArtProps>;
  gradient: readonly [string, string];
  color: string;
  accent: string;
};

const NATIVE_ART: Record<string, NativeArtSpec> = {
  hero: { Art: HeroArt, gradient: ['#3d2a5e', '#0f0821'], color: '#120923', accent: '#ffd879' },
  companion_tank: { Art: RangerArt, gradient: ['#3b2a1a', '#0f0a05'], color: '#140c05', accent: '#e4bf5a' },
  companion_damage: { Art: RangerArt, gradient: ['#4b1a2a', '#0f0506'], color: '#140505', accent: '#fb7185' },
  companion_support: { Art: MageArt, gradient: ['#1e3a5f', '#06101a'], color: '#0a1020', accent: '#a7d7ff' },
  companion_control: { Art: MageArt, gradient: ['#402a5e', '#0e0622'], color: '#0e0622', accent: '#c4b4ff' },
  mine_rat: { Art: RatArt, gradient: ['#3a2515', '#120904'], color: '#120904', accent: '#c88b4a' },
  stone_beetle: { Art: BeetleArt, gradient: ['#32281a', '#0d0806'], color: '#0d0806', accent: '#d1b383' },
  rogue_miner: { Art: MinerArt, gradient: ['#3c2617', '#110804'], color: '#110804', accent: '#d69940' },
  ore_elemental: { Art: MageArt, gradient: ['#263f1a', '#050f04'], color: '#080f05', accent: '#a7f059' },
  ancient_golem: { Art: GolemArt, gradient: ['#3a2e1a', '#0b0804'], color: '#100a05', accent: '#d69940' },
  stone_guard: { Art: StoneGuardArt, gradient: ['#243018', '#060a04'], color: '#081008', accent: '#a7d88a' },
  crystal_spider: { Art: SpiderArt, gradient: ['#154034', '#04120d'], color: '#04120d', accent: '#5eead4' },
  wandering_slab: { Art: SlabArt, gradient: ['#2a2d24', '#0a0a06'], color: '#0a0a06', accent: '#e0e7ef' },
  maze_heart: { Art: MazeHeartArt, gradient: ['#163a30', '#040f0a'], color: '#040f0a', accent: '#a7f3d0' },
};

const FALLBACK_NATIVE_ALLY: NativeArtSpec = {
  Art: HeroArt, gradient: ['#3d2a5e', '#0f0821'], color: '#120923', accent: '#ffd879',
};
const FALLBACK_NATIVE_ENEMY: NativeArtSpec = {
  Art: BeetleArt, gradient: ['#3a2020', '#100505'], color: '#100505', accent: '#fb7185',
};

export function UnitPortrait({ sigil, side, size = 56, dim, style }: Props) {
  const frameColor = side === 'ally' ? colors.accent : colors.enemy;

  // Try the web-only icon pack first (game-icons.net via react-icons).
  // Falls through to the hand-drawn RN SVG art on native.
  let body: React.ReactNode = null;
  let gradient: readonly [string, string] = ['#111', '#000'];

  if (Platform.OS === 'web') {
    // Load lazily so native Metro bundling never pulls react-icons.
    const { WEB_ART } = require('../art/creatures.web') as typeof import('../art/creatures.web');
    const spec =
      WEB_ART[sigil] ??
      (side === 'ally' ? WEB_ART._ally! : WEB_ART._enemy!);
    const Icon = spec.Icon;
    gradient = spec.gradient;
    body = React.createElement(Icon as any, {
      size: size * 0.8,
      color: spec.color,
    });
  } else {
    const spec = NATIVE_ART[sigil] ?? (side === 'ally' ? FALLBACK_NATIVE_ALLY : FALLBACK_NATIVE_ENEMY);
    gradient = spec.gradient;
    body = <spec.Art size={size * 0.95} color={spec.color} accent={spec.accent} />;
  }

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderColor: frameColor,
          opacity: dim ? 0.35 : 1,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradient as any}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.inner}>{body}</View>
      {Platform.OS === 'web' ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: radii.md - 2, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' } as any,
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
