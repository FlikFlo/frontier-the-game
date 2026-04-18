import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii } from '../theme/colors';

type Side = 'ally' | 'enemy';

type Props = {
  // A template id (hero_main, mine_rat, ...) or a role tag; drives icon + tint.
  sigil: string;
  side: Side;
  size?: number;
  dim?: boolean;
  style?: ViewStyle;
};

// Simple unicode sigils by template/role. Kept in one place so we can swap
// for real portraits later without touching layout.
const SIGIL: Record<string, string> = {
  // heroes / allies
  hero: '♞',
  companion_tank: '♜',
  companion_damage: '♘',
  companion_support: '☥',
  companion_control: '☽',
  // mine
  mine_rat: '☠',
  stone_beetle: '⚙',
  rogue_miner: '⚒',
  ore_elemental: '✦',
  ancient_golem: '☗',
  // emerald reach
  stone_guard: '♜',
  crystal_spider: '✷',
  wandering_slab: '▣',
  maze_heart: '❖',
};

// Background tint per unit family — gives each enemy a flavorful frame without art.
const TINT: Record<string, string> = {
  hero: '#3a2b18',
  companion_tank: '#2a2816',
  mine_rat: '#2b1d14',
  stone_beetle: '#222019',
  rogue_miner: '#2a1e10',
  ore_elemental: '#1e2514',
  ancient_golem: '#221914',
  stone_guard: '#1e2414',
  crystal_spider: '#18241c',
  wandering_slab: '#1f2218',
  maze_heart: '#201a2a',
};

export function UnitPortrait({ sigil, side, size = 44, dim, style }: Props) {
  const symbol = SIGIL[sigil] ?? (side === 'ally' ? '♟' : '♦');
  const tint = TINT[sigil] ?? (side === 'ally' ? '#2a2114' : '#2a1912');
  const frameColor = side === 'ally' ? colors.borderGold : '#6e3a30';
  const innerBorder = side === 'ally' ? colors.accent : colors.enemy;
  const glyphColor = side === 'ally' ? colors.accentBright : '#e0a398';

  return (
    <View
      style={[
        styles.outer,
        { width: size, height: size, borderColor: frameColor, opacity: dim ? 0.3 : 1 },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: tint,
            borderColor: innerBorder,
          },
        ]}
      >
        <Text style={[styles.glyph, { color: glyphColor, fontSize: size * 0.55 }]}>{symbol}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    padding: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  inner: {
    flex: 1,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
