// Loot tables are probability-weighted template references.
// Deterministic: given same seed + table, produces identical result.

export type LootDrop = {
  templateId: string;
  weight: number;
  min: number;
  max: number;
};

export type LootTable = {
  id: string;
  guaranteed?: LootDrop[]; // always roll all of these once
  rolls: number; // number of weighted picks
  entries: LootDrop[];
};

export const LOOT_TABLES: Record<string, LootTable> = {
  mine_basic: {
    id: 'mine_basic',
    rolls: 1,
    entries: [
      { templateId: 'stone_rough', weight: 5, min: 1, max: 3 },
      { templateId: 'ore_iron', weight: 3, min: 1, max: 1 },
      { templateId: 'mine_herb', weight: 4, min: 1, max: 2 },
      { templateId: 'crystal_virdite', weight: 1, min: 1, max: 1 },
    ],
  },
  mine_crystal: {
    id: 'mine_crystal',
    rolls: 2,
    entries: [
      { templateId: 'crystal_virdite', weight: 3, min: 1, max: 2 },
      { templateId: 'ore_iron', weight: 2, min: 1, max: 2 },
      { templateId: 'ink_essence', weight: 2, min: 1, max: 1 },
      { templateId: 'potion_health_minor', weight: 1, min: 1, max: 1 },
    ],
  },
  boss_mine: {
    id: 'boss_mine',
    guaranteed: [
      { templateId: 'crystal_virdite', weight: 1, min: 3, max: 5 },
      { templateId: 'ore_iron', weight: 1, min: 2, max: 3 },
      { templateId: 'golem_core', weight: 1, min: 1, max: 1 },
    ],
    rolls: 1,
    entries: [
      { templateId: 'zir_stone_spike', weight: 2, min: 1, max: 1 },
      { templateId: 'leather_vest', weight: 1, min: 1, max: 1 },
    ],
  },
  chest_mine: {
    id: 'chest_mine',
    rolls: 2,
    entries: [
      { templateId: 'potion_health_minor', weight: 3, min: 1, max: 2 },
      { templateId: 'crude_paper', weight: 4, min: 1, max: 2 },
      { templateId: 'mine_herb', weight: 3, min: 1, max: 3 },
      { templateId: 'crystal_virdite', weight: 2, min: 1, max: 1 },
      { templateId: 'zir_heal_minor', weight: 1, min: 1, max: 1 },
      { templateId: 'ink_essence', weight: 1, min: 1, max: 1 },
    ],
  },

  emerald_basic: {
    id: 'emerald_basic',
    rolls: 1,
    entries: [
      { templateId: 'living_stone', weight: 3, min: 1, max: 2 },
      { templateId: 'crystal_fang', weight: 2, min: 1, max: 1 },
      { templateId: 'crystal_virdite', weight: 2, min: 1, max: 1 },
      { templateId: 'mine_herb', weight: 2, min: 1, max: 2 },
      { templateId: 'ink_essence', weight: 1, min: 1, max: 1 },
    ],
  },
  emerald_boss: {
    id: 'emerald_boss',
    guaranteed: [
      { templateId: 'maze_shard', weight: 1, min: 1, max: 1 },
      { templateId: 'living_stone', weight: 1, min: 3, max: 5 },
      { templateId: 'virdite_greater', weight: 1, min: 1, max: 2 },
    ],
    rolls: 1,
    entries: [
      { templateId: 'crystal_fang', weight: 2, min: 2, max: 3 },
      { templateId: 'golem_core', weight: 1, min: 1, max: 1 },
    ],
  },
  emerald_chest: {
    id: 'emerald_chest',
    rolls: 2,
    entries: [
      { templateId: 'living_stone', weight: 3, min: 1, max: 2 },
      { templateId: 'potion_health_greater', weight: 1, min: 1, max: 1 },
      { templateId: 'zir_stone_spike', weight: 1, min: 1, max: 1 },
      { templateId: 'crude_paper', weight: 2, min: 1, max: 2 },
      { templateId: 'ink_essence', weight: 1, min: 1, max: 1 },
    ],
  },
};

export function getLootTable(id: string): LootTable {
  const t = LOOT_TABLES[id];
  if (!t) throw new Error(`Unknown loot table: ${id}`);
  return t;
}
