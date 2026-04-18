// React-icons-based character art. On web we render game-icons.net
// silhouettes (professional, thousands of hand-drawn SVGs). On native
// we fall back to the hand-drawn art in ./creatures.tsx via Platform.

import React from 'react';
import {
  GiAngularSpider,
  GiBeetleShell,
  GiBlackKnightHelm,
  GiCrystalBall,
  GiCrystalCluster,
  GiCrystalShine,
  GiFloatingCrystal,
  GiHoodedFigure,
  GiMaskedSpider,
  GiMiner,
  GiObelisk,
  GiRat,
  GiRockGolem,
  GiRuneStone,
  GiStoneBust,
} from 'react-icons/gi';
import type { IconType } from 'react-icons';

export type WebArtSpec = {
  Icon: IconType;
  // Tint of the silhouette stroke/fill.
  color: string;
  // Two-stop gradient for the background behind the silhouette.
  gradient: readonly [string, string];
};

export const WEB_ART: Record<string, WebArtSpec> = {
  hero: {
    Icon: GiBlackKnightHelm,
    color: '#ffd879',
    gradient: ['#3d2a5e', '#0f0821'],
  },
  companion_tank: {
    Icon: GiHoodedFigure,
    color: '#e4bf5a',
    gradient: ['#3b2a1a', '#0f0a05'],
  },
  companion_damage: {
    Icon: GiHoodedFigure,
    color: '#fb7185',
    gradient: ['#4b1a2a', '#0f0506'],
  },
  companion_support: {
    Icon: GiCrystalBall,
    color: '#a7d7ff',
    gradient: ['#1e3a5f', '#06101a'],
  },
  companion_control: {
    Icon: GiCrystalBall,
    color: '#c4b4ff',
    gradient: ['#402a5e', '#0e0622'],
  },
  mine_rat: {
    Icon: GiRat,
    color: '#e0a360',
    gradient: ['#3a2515', '#120904'],
  },
  stone_beetle: {
    Icon: GiBeetleShell,
    color: '#d1b383',
    gradient: ['#32281a', '#0d0806'],
  },
  rogue_miner: {
    Icon: GiMiner,
    color: '#f5b860',
    gradient: ['#3c2617', '#110804'],
  },
  ore_elemental: {
    Icon: GiCrystalCluster,
    color: '#a7f059',
    gradient: ['#263f1a', '#050f04'],
  },
  ancient_golem: {
    Icon: GiRockGolem,
    color: '#e8b270',
    gradient: ['#3a2e1a', '#0b0804'],
  },
  stone_guard: {
    Icon: GiStoneBust,
    color: '#cfe0b3',
    gradient: ['#243018', '#060a04'],
  },
  crystal_spider: {
    Icon: GiAngularSpider,
    color: '#5eead4',
    gradient: ['#154034', '#04120d'],
  },
  wandering_slab: {
    Icon: GiObelisk,
    color: '#e7edf2',
    gradient: ['#2a2d24', '#0a0a06'],
  },
  maze_heart: {
    Icon: GiCrystalShine,
    color: '#a7f3d0',
    gradient: ['#163a30', '#040f0a'],
  },
  // Fallbacks
  _ally: {
    Icon: GiFloatingCrystal,
    color: '#ffd879',
    gradient: ['#3d2a5e', '#0f0821'],
  },
  _enemy: {
    Icon: GiMaskedSpider,
    color: '#fb7185',
    gradient: ['#3a2020', '#100505'],
  },
  _rune: {
    Icon: GiRuneStone,
    color: '#e5e7eb',
    gradient: ['#2a2d24', '#0a0a06'],
  },
};
