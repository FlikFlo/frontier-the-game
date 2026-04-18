// Hand-drawn SVG silhouettes for each creature/hero in the game.
// Each art is a 100x100 viewBox with a single pure-fill silhouette so it
// works as a portrait over any gradient background. No emoji, no network
// dependencies — the entire asset ships inside this file.

import React from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

export type CreatureArtProps = {
  size?: number;
  color?: string;
  accent?: string;
};

function ArtFrame({
  size = 100,
  children,
}: {
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {children}
    </Svg>
  );
}

// Knight / hero — full-face helm, sword pointing up, cape behind.
export function HeroArt({ size, color = '#1a1226', accent = '#e4bf5a' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Cape */}
      <Path d="M20 95 Q 35 55 50 45 Q 65 55 80 95 Z" fill={color} opacity={0.55} />
      {/* Body */}
      <Path
        d="M35 55 Q 50 45 65 55 L 70 90 Q 50 95 30 90 Z"
        fill={color}
      />
      {/* Helm */}
      <Path
        d="M38 20 Q 50 12 62 20 L 63 42 Q 50 48 37 42 Z"
        fill={color}
        stroke={accent}
        strokeWidth={1.2}
      />
      {/* Helm crest */}
      <Path d="M48 10 L 52 10 L 52 22 L 48 22 Z" fill={accent} />
      {/* Visor slit */}
      <Rect x={41} y={28} width={18} height={2} fill={accent} />
      {/* Shoulder guards */}
      <Path d="M28 52 Q 35 50 38 58 L 32 62 Z" fill={color} />
      <Path d="M72 52 Q 65 50 62 58 L 68 62 Z" fill={color} />
      {/* Sword (over shoulder) */}
      <Rect x={48.5} y={4} width={3} height={48} fill={accent} opacity={0.9} />
      <Rect x={44} y={50} width={12} height={2.5} fill={accent} />
      <Rect x={49} y={52} width={2} height={4} fill={accent} />
    </ArtFrame>
  );
}

// Hooded ranger — the tank companion; cloak, hood shadow, bow silhouette.
export function RangerArt({ size, color = '#1a1226', accent = '#8d6a3a' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Cloak body */}
      <Path d="M22 95 Q 30 55 50 42 Q 70 55 78 95 Z" fill={color} />
      {/* Hood */}
      <Path
        d="M30 40 Q 35 18 50 14 Q 65 18 70 40 Q 68 55 50 55 Q 32 55 30 40 Z"
        fill={color}
      />
      {/* Face shadow — small dark oval hint */}
      <Path d="M42 36 Q 50 40 58 36 Q 58 44 50 46 Q 42 44 42 36 Z" fill="#000" opacity={0.4} />
      {/* Bow across back */}
      <Path
        d="M74 30 Q 82 50 74 70"
        stroke={accent}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M74 30 L 74 70" stroke={accent} strokeWidth={0.8} fill="none" opacity={0.8} />
      {/* Belt */}
      <Rect x={38} y={68} width={24} height={3} fill={accent} opacity={0.7} />
    </ArtFrame>
  );
}

// Mage companion / ore elemental — floating hooded caster, sparks.
export function MageArt({ size, color = '#1a1226', accent = '#a78bfa' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      <Path d="M26 95 Q 36 50 50 36 Q 64 50 74 95 Z" fill={color} />
      <Path d="M34 38 Q 42 12 50 10 Q 58 12 66 38 Q 58 50 50 50 Q 42 50 34 38 Z" fill={color} />
      <Path d="M44 30 Q 50 34 56 30 Q 56 40 50 42 Q 44 40 44 30 Z" fill="#000" opacity={0.45} />
      {/* Staff */}
      <Rect x={23} y={20} width={2.6} height={72} fill={accent} opacity={0.85} />
      <Circle cx={24.3} cy={16} r={5} fill={accent} opacity={0.85} />
      <Circle cx={24.3} cy={16} r={2.4} fill="#fff" opacity={0.7} />
      {/* Sparks */}
      <Circle cx={14} cy={32} r={1.6} fill={accent} />
      <Circle cx={18} cy={12} r={1} fill={accent} />
      <Circle cx={32} cy={22} r={0.9} fill={accent} />
    </ArtFrame>
  );
}

// Cave rat — small low-profile creature.
export function RatArt({ size, color = '#2a1810', accent = '#9b6f3b' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Body */}
      <Path
        d="M15 65 Q 25 48 50 48 Q 70 48 82 60 Q 84 75 70 80 Q 45 86 25 80 Q 14 76 15 65 Z"
        fill={color}
      />
      {/* Head */}
      <Path d="M78 58 Q 92 58 95 66 Q 93 73 84 72 Q 76 68 78 58 Z" fill={color} />
      {/* Ear */}
      <Path d="M82 52 Q 87 48 90 56 Z" fill={color} />
      <Circle cx={84} cy={54} r={1} fill={accent} />
      {/* Eye */}
      <Circle cx={88} cy={64} r={1.5} fill={accent} />
      {/* Tail */}
      <Path
        d="M14 72 Q 4 72 2 64 Q 4 58 10 62"
        stroke={color}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      {/* Legs */}
      <Rect x={28} y={78} width={5} height={10} fill={color} />
      <Rect x={60} y={78} width={5} height={10} fill={color} />
      {/* Teeth hint */}
      <Rect x={88} y={69} width={3} height={1.5} fill="#fff" opacity={0.65} />
    </ArtFrame>
  );
}

// Stone beetle — top-down armored bug.
export function BeetleArt({ size, color = '#23201a', accent = '#c9b181' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Shell */}
      <Path
        d="M20 55 Q 30 20 50 18 Q 70 20 80 55 Q 78 82 50 86 Q 22 82 20 55 Z"
        fill={color}
      />
      {/* Shell ridge */}
      <Path d="M50 22 L 50 80" stroke={accent} strokeWidth={1.5} opacity={0.8} />
      {/* Plates */}
      <Path d="M30 45 Q 50 40 70 45" stroke={accent} strokeWidth={1} opacity={0.7} fill="none" />
      <Path d="M28 60 Q 50 55 72 60" stroke={accent} strokeWidth={1} opacity={0.7} fill="none" />
      <Path d="M26 75 Q 50 70 74 75" stroke={accent} strokeWidth={1} opacity={0.7} fill="none" />
      {/* Head pincers */}
      <Path d="M40 16 L 36 6 L 46 14 Z" fill={color} />
      <Path d="M60 16 L 64 6 L 54 14 Z" fill={color} />
      {/* Legs */}
      {[0, 1, 2].map((i) => (
        <G key={i}>
          <Path
            d={`M20 ${40 + i * 18} L 5 ${38 + i * 20}`}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Path
            d={`M80 ${40 + i * 18} L 95 ${38 + i * 20}`}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </G>
      ))}
    </ArtFrame>
  );
}

// Rogue miner — hooded figure, pickaxe.
export function MinerArt({ size, color = '#1a1410', accent = '#9c6b30' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Body */}
      <Path d="M28 92 Q 32 50 50 42 Q 68 50 72 92 Z" fill={color} />
      {/* Hood */}
      <Path d="M33 44 Q 40 22 50 20 Q 60 22 67 44 Q 60 55 50 55 Q 40 55 33 44 Z" fill={color} />
      {/* Face shadow */}
      <Path d="M43 38 Q 50 43 57 38 Q 56 46 50 47 Q 44 46 43 38 Z" fill="#000" opacity={0.45} />
      {/* Pickaxe handle */}
      <Rect x={22} y={28} width={3} height={54} fill={accent} transform="rotate(-20 23.5 55)" />
      {/* Pickaxe head */}
      <Polygon points="12,24 24,18 30,30 18,36" fill={accent} />
      <Polygon points="12,24 6,30 18,36" fill={accent} opacity={0.8} />
      {/* Belt */}
      <Rect x={34} y={70} width={32} height={3} fill={accent} opacity={0.7} />
    </ArtFrame>
  );
}

// Ancient golem — blocky humanoid rock, gem chest.
export function GolemArt({ size, color = '#211a14', accent = '#84cc16' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Legs */}
      <Rect x={32} y={68} width={14} height={28} fill={color} />
      <Rect x={54} y={68} width={14} height={28} fill={color} />
      {/* Body */}
      <Path d="M24 42 L 76 42 L 72 72 L 28 72 Z" fill={color} />
      {/* Shoulders */}
      <Rect x={16} y={42} width={12} height={22} fill={color} />
      <Rect x={72} y={42} width={12} height={22} fill={color} />
      {/* Arms */}
      <Rect x={10} y={54} width={10} height={30} fill={color} />
      <Rect x={80} y={54} width={10} height={30} fill={color} />
      {/* Head */}
      <Path d="M34 18 L 66 18 L 70 38 L 30 38 Z" fill={color} />
      {/* Eye-gem */}
      <Rect x={44} y={25} width={12} height={5} fill={accent} />
      {/* Chest gem */}
      <Polygon points="50,50 58,58 50,66 42,58" fill={accent} />
      <Polygon points="50,50 58,58 50,58" fill="#fff" opacity={0.35} />
      {/* Cracks */}
      <Path d="M30 45 L 38 50 L 35 58" stroke="#000" strokeWidth={0.8} fill="none" opacity={0.6} />
    </ArtFrame>
  );
}

// Stone guard — standing sentinel with shield and halberd-ish staff.
export function StoneGuardArt({ size, color = '#1c1e18', accent = '#86a06a' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Base */}
      <Rect x={32} y={88} width={36} height={6} fill={color} />
      {/* Legs */}
      <Rect x={40} y={62} width={8} height={28} fill={color} />
      <Rect x={52} y={62} width={8} height={28} fill={color} />
      {/* Body */}
      <Path d="M34 30 L 66 30 L 64 66 L 36 66 Z" fill={color} />
      {/* Head */}
      <Path d="M40 10 L 60 10 L 62 28 L 38 28 Z" fill={color} />
      {/* Eye slit */}
      <Rect x={42} y={17} width={16} height={2} fill={accent} />
      {/* Halberd staff */}
      <Rect x={75} y={6} width={3} height={90} fill={accent} opacity={0.85} />
      {/* Halberd head */}
      <Polygon points="76,6 86,12 76,20" fill={accent} />
      {/* Shield */}
      <Path d="M14 36 L 30 36 L 30 60 Q 22 66 14 60 Z" fill={color} />
      <Path d="M14 36 L 30 36 L 30 60 Q 22 66 14 60 Z" stroke={accent} strokeWidth={1.5} fill="none" />
      <Circle cx={22} cy={48} r={2.4} fill={accent} />
    </ArtFrame>
  );
}

// Crystal spider — spider body with crystal shards on back.
export function SpiderArt({ size, color = '#15221c', accent = '#5eead4' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Legs */}
      {[-60, -40, -20, 0, 20, 40, 60, 80].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const length = 40;
        const side = i < 4 ? -1 : 1;
        const hx = 50 + side * 6;
        const hy = 58;
        const x2 = hx + Math.cos(rad) * length * side;
        const y2 = hy + Math.sin(rad) * length;
        return (
          <Path
            key={i}
            d={`M${hx} ${hy} Q ${hx + (x2 - hx) * 0.5} ${hy - 6} ${x2} ${y2}`}
            stroke={color}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
      {/* Body — abdomen */}
      <Path d="M30 56 Q 50 40 70 56 Q 72 74 50 80 Q 28 74 30 56 Z" fill={color} />
      {/* Head */}
      <Circle cx={50} cy={50} r={10} fill={color} />
      {/* Eyes */}
      <Circle cx={47} cy={49} r={1.6} fill={accent} />
      <Circle cx={53} cy={49} r={1.6} fill={accent} />
      <Circle cx={46} cy={53} r={1} fill={accent} />
      <Circle cx={54} cy={53} r={1} fill={accent} />
      {/* Crystal shards on back */}
      <Polygon points="40,62 44,50 48,62" fill={accent} opacity={0.9} />
      <Polygon points="52,62 56,48 60,62" fill={accent} />
      <Polygon points="46,68 50,58 54,68" fill={accent} opacity={0.9} />
    </ArtFrame>
  );
}

// Wandering slab — floating rune-carved monolith.
export function SlabArt({ size, color = '#1a1c1a', accent = '#cbd5e1' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Slab */}
      <Polygon points="30,20 70,14 78,80 22,86" fill={color} />
      {/* Rune */}
      <Defs>
        <LinearGradient id="rune" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={accent} stopOpacity="1" />
          <Stop offset="1" stopColor={accent} stopOpacity="0.4" />
        </LinearGradient>
      </Defs>
      <Path d="M50 30 L 50 70" stroke="url(#rune)" strokeWidth={3} />
      <Path d="M40 40 L 60 40" stroke="url(#rune)" strokeWidth={3} />
      <Path d="M43 55 L 57 55" stroke="url(#rune)" strokeWidth={2.5} opacity={0.7} />
      <Path d="M36 68 L 64 68" stroke="url(#rune)" strokeWidth={2} opacity={0.5} />
      {/* Glow */}
      <Circle cx={50} cy={50} r={28} fill={accent} opacity={0.08} />
    </ArtFrame>
  );
}

// Maze Heart — big floating crystal core with shards.
export function MazeHeartArt({ size, color = '#132618', accent = '#a7f3d0' }: CreatureArtProps) {
  return (
    <ArtFrame size={size}>
      {/* Outer halo */}
      <Circle cx={50} cy={50} r={36} fill={accent} opacity={0.12} />
      <Circle cx={50} cy={50} r={24} fill={accent} opacity={0.18} />
      {/* Core crystal */}
      <Polygon points="50,18 72,40 60,70 40,70 28,40" fill={color} />
      <Polygon points="50,18 72,40 50,40" fill={accent} opacity={0.55} />
      <Polygon points="50,18 28,40 50,40" fill={accent} opacity={0.25} />
      {/* Inner light */}
      <Polygon points="44,32 52,26 60,32 54,46 46,46" fill={accent} opacity={0.9} />
      {/* Shards */}
      <Polygon points="18,30 24,22 30,32" fill={accent} opacity={0.8} />
      <Polygon points="72,20 78,30 70,34" fill={accent} opacity={0.8} />
      <Polygon points="18,78 24,72 28,82" fill={accent} opacity={0.7} />
      <Polygon points="72,82 80,78 82,86" fill={accent} opacity={0.7} />
    </ArtFrame>
  );
}
