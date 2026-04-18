// Painted background for the mine — cross-section through an abandoned
// shaft.  Rendered as layered SVG shapes; node positions assume this
// 1000×700 viewBox.

import React from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type Props = { width?: number | string; height?: number | string };

export function MineScene({ width = '100%', height = '100%' }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="mineSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1b1526" />
          <Stop offset="0.4" stopColor="#120b1d" />
          <Stop offset="1" stopColor="#0a0613" />
        </LinearGradient>
        <LinearGradient id="mineRock" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3a2a1c" />
          <Stop offset="1" stopColor="#1a1108" />
        </LinearGradient>
        <LinearGradient id="caveWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#241a12" />
          <Stop offset="1" stopColor="#0a0605" />
        </LinearGradient>
        <LinearGradient id="shaftGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(132,204,22,0.18)" />
          <Stop offset="1" stopColor="rgba(132,204,22,0)" />
        </LinearGradient>
      </Defs>

      {/* Sky at top — moonless night above ground */}
      <Rect x="0" y="0" width="1000" height="180" fill="url(#mineSky)" />

      {/* Distant mountain silhouette */}
      <Path
        d="M0,180 L 90,90 L 180,150 L 270,60 L 380,140 L 490,80 L 600,150 L 720,70 L 830,140 L 1000,110 L 1000,180 Z"
        fill="#0e0a18"
      />
      <Path
        d="M0,180 L 120,130 L 230,160 L 340,115 L 460,165 L 580,135 L 700,170 L 820,125 L 1000,165 L 1000,180 Z"
        fill="#13091e"
        opacity={0.85}
      />

      {/* Surface ground / mine entrance ridge */}
      <Path d="M0,200 L 1000,190 L 1000,260 L 0,260 Z" fill="#2a1f15" />
      {/* The cave opening */}
      <Path
        d="M440,200 Q 480,170 520,200 L 560,260 L 420,260 Z"
        fill="#0a0605"
      />

      {/* The mine body — three horizontal galleries carved out of the rock */}
      <Rect x="0" y="260" width="1000" height="440" fill="url(#mineRock)" />

      {/* Gallery 1 — upper tunnels */}
      <Path
        d="M120,290 Q 350,270 650,300 Q 820,320 900,290 L 900,370 Q 820,400 650,380 Q 350,350 120,370 Z"
        fill="url(#caveWall)"
      />
      {/* Gallery 2 — middle chamber */}
      <Ellipse cx="500" cy="440" rx="360" ry="60" fill="url(#caveWall)" />
      {/* Gallery 3 — deep chamber, boss area */}
      <Path
        d="M200,540 Q 500,510 800,540 L 820,640 Q 500,670 180,640 Z"
        fill="url(#caveWall)"
      />
      {/* Connecting shafts — vertical */}
      <Path d="M260,340 L 270,450 L 240,540 L 250,630" stroke="#0a0605" strokeWidth={18} fill="none" opacity={0.85} />
      <Path d="M470,340 L 480,440 L 460,540" stroke="#0a0605" strokeWidth={22} fill="none" opacity={0.85} />
      <Path d="M700,340 L 720,460 L 690,560" stroke="#0a0605" strokeWidth={18} fill="none" opacity={0.85} />

      {/* Shaft of daylight down from entrance */}
      <Path d="M460,260 L 520,260 L 560,420 L 440,420 Z" fill="url(#shaftGlow)" opacity={0.7} />

      {/* Crystal clusters peeking from walls */}
      <Path d="M160,330 l 6,-14 l 8,12 l -4,10 Z" fill="#84cc16" opacity={0.7} />
      <Path d="M820,360 l 5,-12 l 7,10 l -3,9 Z" fill="#84cc16" opacity={0.6} />
      <Path d="M360,450 l 6,-14 l 8,12 l -4,10 Z" fill="#84cc16" opacity={0.5} />
      <Path d="M630,440 l 5,-12 l 7,10 l -3,9 Z" fill="#84cc16" opacity={0.5} />
      <Path d="M240,600 l 7,-16 l 10,14 l -4,12 Z" fill="#84cc16" opacity={0.7} />
      <Path d="M760,610 l 7,-16 l 10,14 l -4,12 Z" fill="#84cc16" opacity={0.7} />

      {/* Deep water pool in lower-left */}
      <Ellipse cx="130" cy="655" rx="90" ry="12" fill="#1f2d3a" opacity={0.9} />
      <Path d="M60,655 Q 130,645 200,655" stroke="#4a7a9a" strokeWidth={1} opacity={0.6} fill="none" />

      {/* Faint dust particles to add depth */}
      {Array.from({ length: 18 }).map((_, i) => (
        <Circle
          key={i}
          cx={40 + ((i * 97) % 920)}
          cy={280 + ((i * 53) % 380)}
          r={1.2}
          fill="#d4b383"
          opacity={0.18}
        />
      ))}
    </Svg>
  );
}

export function EmeraldReachScene({ width = '100%', height = '100%' }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="voidSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a0a2a" />
          <Stop offset="1" stopColor="#050408" />
        </LinearGradient>
        <LinearGradient id="labWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a3020" />
          <Stop offset="1" stopColor="#060d08" />
        </LinearGradient>
        <LinearGradient id="lab2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0e2318" />
          <Stop offset="1" stopColor="#030704" />
        </LinearGradient>
      </Defs>
      {/* Void backdrop */}
      <Rect x="0" y="0" width="1000" height="700" fill="url(#voidSky)" />
      {/* Floating plates / labyrinth slabs */}
      <Path d="M50,120 L 420,100 L 460,230 L 80,260 Z" fill="url(#labWall)" opacity={0.95} />
      <Path d="M520,140 L 940,130 L 900,270 L 540,250 Z" fill="url(#labWall)" opacity={0.9} />
      <Path d="M160,320 L 480,300 L 520,460 L 140,480 Z" fill="url(#lab2)" opacity={0.95} />
      <Path d="M560,340 L 900,330 L 880,500 L 580,490 Z" fill="url(#lab2)" opacity={0.9} />
      <Path d="M340,560 L 720,540 L 760,680 L 360,690 Z" fill="url(#labWall)" />

      {/* Rune veins */}
      <Path d="M100,180 L 360,170 L 340,240 L 140,250 Z" fill="none" stroke="#84cc16" strokeWidth={1} opacity={0.5} />
      <Path d="M580,180 L 880,170 L 860,240 L 620,250 Z" fill="none" stroke="#84cc16" strokeWidth={1} opacity={0.45} />
      <Path d="M200,370 L 460,360 L 470,440 L 220,450 Z" fill="none" stroke="#5eead4" strokeWidth={1} opacity={0.5} />
      <Path d="M600,380 L 860,370 L 850,460 L 630,470 Z" fill="none" stroke="#5eead4" strokeWidth={1} opacity={0.45} />

      {/* Crystal clusters */}
      {[
        [120, 150],
        [380, 140],
        [620, 150],
        [880, 150],
        [200, 340],
        [460, 330],
        [680, 340],
        [840, 330],
        [380, 580],
        [660, 580],
      ].map(([x, y], i) => (
        <Path
          key={i}
          d={`M${x - 8},${y + 8} L ${x},${y - 10} L ${x + 8},${y + 8} Z`}
          fill="#a7f3d0"
          opacity={0.9}
        />
      ))}
      {/* Glow halo behind center (boss area) */}
      <Ellipse cx="500" cy="620" rx="220" ry="40" fill="#a7f3d0" opacity={0.08} />
      <Ellipse cx="500" cy="620" rx="100" ry="20" fill="#a7f3d0" opacity={0.15} />
      {/* Far stars */}
      {Array.from({ length: 24 }).map((_, i) => (
        <Circle
          key={i}
          cx={30 + ((i * 83) % 960)}
          cy={20 + ((i * 47) % 90)}
          r={1}
          fill="#ffffff"
          opacity={0.4}
        />
      ))}
    </Svg>
  );
}
