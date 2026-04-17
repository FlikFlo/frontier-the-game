import type { Hero, StatBlock } from '../types/domain';

// XP curve: quadratic so early levels come fast, late ones slow.
// Level N requires xpToNext(N) total XP to reach level N+1.
export function xpToNext(level: number): number {
  return Math.round(80 + 40 * level + 10 * level * level);
}

export type LevelUp = {
  fromLevel: number;
  toLevel: number;
  hpGained: number;
  epGained: number;
  statsGained: Partial<StatBlock>;
};

// Per-level stat/HP growth. Tuned so a level-5 hero is meaningfully stronger
// than level-1 but not so much it trivializes early zones.
function gainsFor(level: number): {
  hp: number;
  ep: number;
  stats: Partial<StatBlock>;
} {
  // Every level: +8 HP, +2 EP, +1 attack, +1 defense
  // Every 2 levels: +1 speed
  // Every 3 levels: +1 magic
  const stats: Partial<StatBlock> = { attack: 1, defense: 1 };
  if (level % 2 === 0) stats.speed = 1;
  if (level % 3 === 0) stats.magic = 1;
  return { hp: 8, ep: 2, stats };
}

// Applies XP and returns the updated hero plus any level-ups that fired.
export function applyXp(hero: Hero, xpGained: number): { hero: Hero; levelUps: LevelUp[] } {
  let level = hero.level;
  let xp = hero.xp + xpGained;
  let hpMax = hero.hpMax;
  let epMax = hero.epMax;
  let stats: StatBlock = { ...hero.stats };
  const levelUps: LevelUp[] = [];

  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    const fromLevel = level;
    level += 1;
    const gains = gainsFor(level);
    hpMax += gains.hp;
    epMax += gains.ep;
    for (const [k, v] of Object.entries(gains.stats) as [keyof StatBlock, number][]) {
      stats[k] = stats[k] + v;
    }
    levelUps.push({
      fromLevel,
      toLevel: level,
      hpGained: gains.hp,
      epGained: gains.ep,
      statsGained: gains.stats,
    });
  }

  return {
    hero: { ...hero, level, xp, hpMax, epMax, stats },
    levelUps,
  };
}
