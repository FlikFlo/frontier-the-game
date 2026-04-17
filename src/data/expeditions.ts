import type { ExpeditionTemplate } from '../types/domain';

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
    nodeLayout: ['start', 'combat', 'event', 'combat', 'treasure', 'boss', 'extraction'],
    nodeLabels: [
      'Вход в шахту',
      'Стычка в штольне',
      'Странный символ',
      'Засада',
      'Заброшенный сундук',
      'Древний голем',
      'Выход на поверхность',
    ],
    combatPool: ['mine_rat', 'stone_beetle', 'rogue_miner', 'ore_elemental'],
    bossTemplateId: 'ancient_golem',
    chestLootTableId: 'chest_mine',
    eventIds: ['mine_carving'],
    portal: false,
  },

  // ----- Portal World 1 -----
  emerald_reach: {
    id: 'emerald_reach',
    name: 'Зелёный Предел',
    school: 'earth',
    travelDays: 2,
    crystalCost: { virdite: 3 },
    recommendedPower: 25,
    description:
      'Портальный мир из живого камня. Бесконечный лабиринт, стены которого медленно дышат. Здесь добывают Живой Камень и Большие Вирдиты.',
    nodeLayout: [
      'start',
      'combat',
      'combat',
      'event',
      'treasure',
      'combat',
      'elite',
      'treasure',
      'boss',
      'extraction',
    ],
    nodeLabels: [
      'Врата портала',
      'Движущиеся стены',
      'Паучье гнездо',
      'Эхо среди камней',
      'Полость с сокровищем',
      'Засада стражей',
      'Чемпион лабиринта',
      'Запертая камера',
      'Сердце Лабиринта',
      'Возврат через портал',
    ],
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
