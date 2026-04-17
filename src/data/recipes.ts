import type { Recipe } from '../types/crafting';

// MVP-1.5 recipe catalog.
// Ingredients reference item template IDs; crystalCost pulls from stockpile.

export const RECIPES: Record<string, Recipe> = {
  ink_essence: {
    id: 'ink_essence',
    name: 'Эссенция чернил',
    station: 'alchemy',
    description:
      'Растирка из каменной муки и лишайника. Основа для большинства зелий и чернил для Зиров.',
    ingredients: [
      { templateId: 'stone_rough', count: 3 },
      { templateId: 'mine_herb', count: 2 },
    ],
    output: { templateId: 'ink_essence', count: 1 },
    unlockedByDefault: true,
  },
  potion_health_minor: {
    id: 'potion_health_minor',
    name: 'Малое зелье здоровья',
    station: 'alchemy',
    description: 'Травяной отвар. Восстанавливает 20 HP в бою.',
    ingredients: [
      { templateId: 'mine_herb', count: 2 },
      { templateId: 'ink_essence', count: 1 },
    ],
    output: { templateId: 'potion_health_minor', count: 1 },
    unlockedByDefault: true,
  },
  potion_energy_minor: {
    id: 'potion_energy_minor',
    name: 'Малое зелье энергии',
    station: 'alchemy',
    description: 'Горький настой. Восстанавливает EP.',
    ingredients: [
      { templateId: 'mine_herb', count: 2 },
      { templateId: 'crude_paper', count: 1 },
    ],
    output: { templateId: 'potion_energy_minor', count: 1 },
    unlockedByDefault: true,
  },
  potion_health_greater: {
    id: 'potion_health_greater',
    name: 'Большое зелье здоровья',
    station: 'alchemy',
    description: 'Концентрат на основе ядра голема. Восстанавливает 45 HP.',
    ingredients: [
      { templateId: 'potion_health_minor', count: 1 },
      { templateId: 'golem_core', count: 1 },
      { templateId: 'ink_essence', count: 1 },
    ],
    output: { templateId: 'potion_health_greater', count: 1 },
    unlockedByDefault: true,
  },
  zir_stone_spike: {
    id: 'zir_stone_spike',
    name: 'Зир: Каменный шип',
    station: 'scribing',
    description: 'Базовый атакующий Зир земли. Удобен против магов.',
    ingredients: [
      { templateId: 'crude_paper', count: 1 },
      { templateId: 'ink_essence', count: 1 },
    ],
    crystalCost: { virdite: 1 },
    output: { templateId: 'zir_stone_spike', count: 1 },
    unlockedByDefault: true,
  },
  zir_heal_minor: {
    id: 'zir_heal_minor',
    name: 'Зир: Малое исцеление',
    station: 'scribing',
    description: 'Восстанавливает HP союзника. Двойное применение за бой.',
    ingredients: [
      { templateId: 'crude_paper', count: 1 },
      { templateId: 'mine_herb', count: 2 },
      { templateId: 'ink_essence', count: 1 },
    ],
    crystalCost: { virdite: 1 },
    output: { templateId: 'zir_heal_minor', count: 1 },
    unlockedByDefault: true,
  },
};

export function listRecipes(): Recipe[] {
  return Object.values(RECIPES);
}

export function getRecipe(id: string): Recipe {
  const r = RECIPES[id];
  if (!r) throw new Error(`Unknown recipe: ${id}`);
  return r;
}
