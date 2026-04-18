import type { ExpeditionTemplate, GridConfig } from '../types/domain';

const MINE_GRID: GridConfig = {
  width: 5,
  height: 6,
  combat: 5,
  elite: 1,
  treasure: 2,
  event: 2,
  rest: 1,
  cartographer: 1,
  extractions: 2,
  impassableRatio: 0.1,
};

const EMERALD_GRID: GridConfig = {
  width: 6,
  height: 7,
  combat: 6,
  elite: 2,
  treasure: 3,
  event: 2,
  rest: 1,
  cartographer: 1,
  extractions: 3,
  impassableRatio: 0.15,
};

export const EXPEDITION_TEMPLATES: Record<string, ExpeditionTemplate> = {
  mine_of_virdite: {
    id: 'mine_of_virdite',
    name: 'Шахта Вирдита',
    school: 'earth',
    travelDays: 1,
    crystalCost: {},
    recommendedPower: 10,
    description:
      'Заброшенная шахта у подножия снежной горы. Источник Вирдита и самая близкая цель для молодого героя.',
    grid: MINE_GRID,
    scene: 'mine',
    combatPool: ['mine_rat', 'stone_beetle', 'rogue_miner', 'ore_elemental'],
    bossTemplateId: 'ancient_golem',
    chestLootTableId: 'chest_mine',
    eventIds: ['mine_carving'],
    portal: false,
  },
  emerald_reach: {
    id: 'emerald_reach',
    name: 'Зелёный Предел',
    school: 'earth',
    travelDays: 2,
    crystalCost: { virdite: 3 },
    recommendedPower: 25,
    description:
      'Портальный мир из живого камня. Бесконечный лабиринт, стены которого медленно дышат. Здесь добывают Живой Камень и Большие Вирдиты.',
    grid: EMERALD_GRID,
    scene: 'emerald_reach',
    combatPool: ['stone_guard', 'crystal_spider', 'wandering_slab'],
    bossTemplateId: 'maze_heart',
    chestLootTableId: 'emerald_chest',
    eventIds: ['mine_carving'],
    portal: true,
  },
};

export function getExpeditionTemplate(id: string): ExpeditionTemplate {
  const t = EXPEDITION_TEMPLATES[id];
  if (!t) throw new Error(`Unknown expedition template: ${id}`);
  return t;
}
