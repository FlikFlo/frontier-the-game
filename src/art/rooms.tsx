// Minimal SVG illustrations for fortress rooms.

import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

type Props = { size?: number };

function Frame({ size = 120, children }: { size?: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {children}
    </Svg>
  );
}

export function PortalHallArt({ size }: Props) {
  return (
    <Frame size={size}>
      <Defs>
        <LinearGradient id="pha" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#c4b4ff" stopOpacity={1} />
          <Stop offset="1" stopColor="#4c2a8a" stopOpacity={1} />
        </LinearGradient>
      </Defs>
      {/* Archway */}
      <Path d="M30 100 L 30 50 Q 60 20 90 50 L 90 100 Z" fill="#1b1423" />
      <Path d="M38 100 L 38 55 Q 60 30 82 55 L 82 100 Z" fill="url(#pha)" opacity={0.9} />
      {/* Portal swirl */}
      <Circle cx={60} cy={62} r={14} fill="#f4ecff" opacity={0.25} />
      <Circle cx={60} cy={62} r={8} fill="#fff" opacity={0.55} />
      {/* Floor */}
      <Rect x={20} y={100} width={80} height={6} fill="#352948" />
      {/* Pillars */}
      <Rect x={24} y={50} width={6} height={52} fill="#2d2237" />
      <Rect x={90} y={50} width={6} height={52} fill="#2d2237" />
    </Frame>
  );
}

export function InfirmaryArt({ size }: Props) {
  return (
    <Frame size={size}>
      {/* Wall */}
      <Rect x={10} y={20} width={100} height={80} fill="#1a1418" />
      {/* Bed */}
      <Rect x={24} y={70} width={54} height={8} fill="#6a3a4a" />
      <Rect x={24} y={78} width={54} height={18} fill="#3a2328" />
      <Rect x={24} y={60} width={18} height={14} fill="#e4d4c4" />
      {/* Cross banner */}
      <Rect x={82} y={30} width={24} height={40} fill="#2a1014" />
      <Rect x={91} y={34} width={6} height={32} fill="#f87171" />
      <Rect x={82} y={46} width={24} height={6} fill="#f87171" />
      {/* Flask */}
      <Rect x={86} y={78} width={8} height={18} fill="#38bdf8" opacity={0.8} />
      <Rect x={84} y={74} width={12} height={4} fill="#9ca3af" />
    </Frame>
  );
}

export function WorkshopArt({ size }: Props) {
  return (
    <Frame size={size}>
      <Rect x={10} y={20} width={100} height={80} fill="#1b1612" />
      {/* Workbench */}
      <Rect x={18} y={76} width={84} height={8} fill="#5a3d20" />
      <Rect x={22} y={84} width={6} height={16} fill="#3a2518" />
      <Rect x={92} y={84} width={6} height={16} fill="#3a2518" />
      {/* Flask bubbling */}
      <Path d="M46 60 L 46 50 L 54 50 L 54 60 Q 58 68 50 76 Q 42 68 46 60 Z" fill="#5eead4" />
      <Circle cx={50} cy={54} r={1.5} fill="#fff" />
      {/* Mortar */}
      <Path d="M64 60 Q 70 60 76 60 L 78 72 Q 70 76 62 72 Z" fill="#9ca3af" />
      <Rect x={72} y={46} width={3} height={18} fill="#6b4e2a" />
      {/* Scroll */}
      <Rect x={22} y={58} width={18} height={14} fill="#e4d4a4" />
      <Rect x={22} y={58} width={18} height={3} fill="#c4a47c" />
    </Frame>
  );
}

export function StorageArt({ size }: Props) {
  return (
    <Frame size={size}>
      <Rect x={10} y={20} width={100} height={80} fill="#171310" />
      {/* Crates */}
      <Rect x={22} y={64} width={26} height={24} fill="#6b4e2a" />
      <Polygon points="22,64 26,60 52,60 48,64" fill="#8d6a3a" />
      <Polygon points="48,64 52,60 52,84 48,88" fill="#4a3418" />
      <Rect x={54} y={70} width={22} height={20} fill="#5a3f1f" />
      <Rect x={82} y={60} width={22} height={30} fill="#6b4e2a" />
      <Polygon points="82,60 86,56 104,56 100,60" fill="#8d6a3a" />
      {/* Barrel */}
      <Path
        d="M24 40 Q 34 36 44 40 L 42 60 Q 34 64 26 60 Z"
        fill="#5a3f1f"
        stroke="#8d6a3a"
        strokeWidth={1}
      />
      <Path d="M26 48 L 42 48" stroke="#8d6a3a" strokeWidth={1.5} />
    </Frame>
  );
}

export function ForgeArt({ size }: Props) {
  return (
    <Frame size={size}>
      <Rect x={10} y={20} width={100} height={80} fill="#120806" />
      {/* Anvil */}
      <Path d="M36 80 L 84 80 L 78 86 L 42 86 Z" fill="#4b5563" />
      <Path d="M40 68 L 80 68 L 86 80 L 34 80 Z" fill="#6b7280" />
      <Rect x={48} y={86} width={24} height={12} fill="#1f2937" />
      {/* Flames */}
      <Path
        d="M20 60 Q 24 40 32 50 Q 34 60 28 72 Q 20 66 20 60 Z"
        fill="#f59e0b"
      />
      <Path d="M22 60 Q 26 48 30 56 Q 30 64 26 70 Z" fill="#fbbf24" />
      {/* Hammer */}
      <Rect x={72} y={46} width={20} height={8} fill="#4b5563" />
      <Rect x={86} y={54} width={4} height={16} fill="#6b4e2a" />
    </Frame>
  );
}

export function LibraryArt({ size }: Props) {
  return (
    <Frame size={size}>
      <Rect x={10} y={20} width={100} height={80} fill="#0f0b14" />
      {/* Shelves */}
      <Rect x={16} y={28} width={88} height={4} fill="#5a3f1f" />
      <Rect x={16} y={58} width={88} height={4} fill="#5a3f1f" />
      <Rect x={16} y={88} width={88} height={4} fill="#5a3f1f" />
      {/* Books (top shelf) */}
      {[22, 30, 36, 46, 54, 62, 72, 84, 92].map((x, i) => (
        <Rect
          key={`top-${i}`}
          x={x}
          y={32}
          width={5}
          height={24}
          fill={['#6d28d9', '#ca8a04', '#0f766e', '#9f1239', '#1d4ed8'][i % 5]}
          opacity={0.85}
        />
      ))}
      {/* Books (middle shelf) */}
      {[20, 28, 40, 50, 62, 72, 82, 94].map((x, i) => (
        <Rect
          key={`mid-${i}`}
          x={x}
          y={62}
          width={6}
          height={24}
          fill={['#be185d', '#0ea5e9', '#b45309', '#6d28d9', '#14532d'][i % 5]}
          opacity={0.85}
        />
      ))}
      {/* Candle */}
      <Rect x={92} y={94} width={4} height={6} fill="#fde68a" />
    </Frame>
  );
}
