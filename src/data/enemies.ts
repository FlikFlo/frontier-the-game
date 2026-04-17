import type { EnemyTemplate } from '../types/domain';

export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = {
  mine_rat: {
    id: 'mine_rat',
    name: 'Шахтная крыса',
    behavior: 'grunt',
    hpMax: 22,
    stats: { attack: 5, magic: 0, defense: 1, speed: 12, critChance: 0.05 },
    weaponDamage: 3,
    damageType: 'physical',
    xpReward: 5,
    lootTableId: 'mine_basic',
  },
  stone_beetle: {
    id: 'stone_beetle',
    name: 'Каменный жук',
    behavior: 'tank',
    hpMax: 38,
    stats: { attack: 6, magic: 0, defense: 4, speed: 7, critChance: 0.03 },
    weaponDamage: 5,
    damageType: 'physical',
    xpReward: 9,
    lootTableId: 'mine_basic',
  },
  rogue_miner: {
    id: 'rogue_miner',
    name: 'Одичавший рудокоп',
    behavior: 'grunt',
    hpMax: 30,
    stats: { attack: 8, magic: 0, defense: 2, speed: 10, critChance: 0.08 },
    weaponDamage: 6,
    damageType: 'physical',
    xpReward: 8,
    lootTableId: 'mine_basic',
  },
  ore_elemental: {
    id: 'ore_elemental',
    name: 'Рудный элементаль',
    behavior: 'mage',
    hpMax: 28,
    stats: { attack: 4, magic: 10, defense: 3, speed: 9, critChance: 0.06 },
    weaponDamage: 8,
    damageType: 'magic',
    school: 'earth',
    xpReward: 12,
    lootTableId: 'mine_crystal',
  },
  ancient_golem: {
    id: 'ancient_golem',
    name: 'Древний Голем Шахты',
    behavior: 'tank',
    hpMax: 95,
    stats: { attack: 12, magic: 0, defense: 6, speed: 6, critChance: 0.05 },
    weaponDamage: 10,
    damageType: 'physical',
    xpReward: 60,
    lootTableId: 'boss_mine',
  },
};

export function getEnemyTemplate(id: string): EnemyTemplate {
  const e = ENEMY_TEMPLATES[id];
  if (!e) throw new Error(`Unknown enemy template: ${id}`);
  return e;
}
