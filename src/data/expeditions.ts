import type { ExpeditionLayout, ExpeditionTemplate, LayoutNode, NodeType } from '../types/domain';

// Helper: build a linear layout from an ordered list of node plans.
function linear(plan: { type: NodeType; label?: string }[]): ExpeditionLayout {
  const nodes: LayoutNode[] = plan.map((p, i) => ({
    id: `n${i}`,
    type: p.type,
    label: p.label,
  }));
  const edges = plan.slice(1).map((_, i) => ({ from: `n${i}`, to: `n${i + 1}` }));
  return { nodes, edges, startNodeId: 'n0' };
}

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
    layout: linear([
      { type: 'start', label: 'Вход в шахту' },
      { type: 'combat', label: 'Стычка в штольне' },
      { type: 'event', label: 'Странный символ' },
      { type: 'combat', label: 'Засада' },
      { type: 'treasure', label: 'Заброшенный сундук' },
      { type: 'boss', label: 'Древний голем' },
      { type: 'extraction', label: 'Выход на поверхность' },
    ]),
    combatPool: ['mine_rat', 'stone_beetle', 'rogue_miner', 'ore_elemental'],
    bossTemplateId: 'ancient_golem',
    chestLootTableId: 'chest_mine',
    eventIds: ['mine_carving'],
    portal: false,
  },

  // ----- Portal World 1: Emerald Reach -----
  // Features a branching extraction choice: after the mid-run
  // treasure+event you can bail to an early portal home with what
  // you've got, or press on for the Maze Heart boss and its
  // legendary drop.
  emerald_reach: {
    id: 'emerald_reach',
    name: 'Зелёный Предел',
    school: 'earth',
    travelDays: 2,
    crystalCost: { virdite: 3 },
    recommendedPower: 25,
    description:
      'Портальный мир из живого камня. Бесконечный лабиринт, стены которого медленно дышат. Здесь добывают Живой Камень и Большие Вирдиты.',
    layout: {
      startNodeId: 'start',
      nodes: [
        { id: 'start', type: 'start', label: 'Врата портала' },
        { id: 'c1', type: 'combat', label: 'Движущиеся стены' },
        { id: 'c2', type: 'combat', label: 'Паучье гнездо' },
        { id: 'ev', type: 'event', label: 'Эхо среди камней' },
        { id: 't1', type: 'treasure', label: 'Полость с сокровищем' },
        // Branch point: safe exit or push on
        { id: 'early', type: 'extraction', label: 'Ранний портал домой' },
        { id: 'c3', type: 'combat', label: 'Засада стражей' },
        { id: 'elite', type: 'elite', label: 'Чемпион лабиринта' },
        { id: 't2', type: 'treasure', label: 'Запертая камера' },
        { id: 'boss', type: 'boss', label: 'Сердце Лабиринта' },
        { id: 'late', type: 'extraction', label: 'Главный портал' },
      ],
      edges: [
        { from: 'start', to: 'c1' },
        { from: 'c1', to: 'c2' },
        { from: 'c2', to: 'ev' },
        { from: 'ev', to: 't1' },
        // From treasure: either early exit or continue deeper
        { from: 't1', to: 'early' },
        { from: 't1', to: 'c3' },
        { from: 'c3', to: 'elite' },
        { from: 'elite', to: 't2' },
        { from: 't2', to: 'boss' },
        { from: 'boss', to: 'late' },
      ],
    },
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
