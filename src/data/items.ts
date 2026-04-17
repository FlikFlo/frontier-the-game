import type { Item } from '../types/domain';

// Template catalog. Runtime ItemInstances are created from these via makeItem().
// Keep definitions data-only; no functions attached.

export const ITEM_TEMPLATES: Record<string, Item> = {
  // ----- Weapons -----
  ranger_sword: {
    id: 'tpl:ranger_sword',
    templateId: 'ranger_sword',
    name: 'Меч рейнджера',
    kind: 'weapon',
    rarity: 'common',
    size: 2,
    tags: ['metal'],
    damage: 8,
    damageType: 'physical',
    speed: 0,
  },
  rusty_dagger: {
    id: 'tpl:rusty_dagger',
    templateId: 'rusty_dagger',
    name: 'Ржавый кинжал',
    kind: 'weapon',
    rarity: 'common',
    size: 1,
    tags: ['metal'],
    damage: 5,
    damageType: 'physical',
    speed: 2,
  },

  // ----- Armor -----
  leather_vest: {
    id: 'tpl:leather_vest',
    templateId: 'leather_vest',
    name: 'Кожаный жилет',
    kind: 'armor',
    rarity: 'common',
    size: 2,
    tags: ['organic'],
    defense: 3,
  },

  // ----- Zirs (magical papers) -----
  zir_stone_spike: {
    id: 'tpl:zir_stone_spike',
    templateId: 'zir_stone_spike',
    name: 'Зир: Каменный шип',
    kind: 'zir',
    rarity: 'common',
    size: 1,
    tags: ['paper'],
    school: 'earth',
    power: 14,
    cooldownTurns: 2,
    chargesMax: 3,
    effect: { type: 'damage', amount: 14, school: 'earth' },
  },
  zir_heal_minor: {
    id: 'tpl:zir_heal_minor',
    templateId: 'zir_heal_minor',
    name: 'Зир: Малое исцеление',
    kind: 'zir',
    rarity: 'common',
    size: 1,
    tags: ['paper'],
    school: 'light',
    power: 18,
    cooldownTurns: 3,
    chargesMax: 2,
    effect: { type: 'heal', amount: 18 },
  },

  // ----- Consumables -----
  potion_health_minor: {
    id: 'tpl:potion_health_minor',
    templateId: 'potion_health_minor',
    name: 'Малое зелье здоровья',
    kind: 'consumable',
    rarity: 'common',
    size: 1,
    tags: ['reagent'],
    effect: { type: 'heal', amount: 20 },
    triggerHpPct: 0.3,
  },

  // ----- Crystals -----
  crystal_virdite: {
    id: 'tpl:crystal_virdite',
    templateId: 'crystal_virdite',
    name: 'Вирдит',
    kind: 'crystal',
    rarity: 'uncommon',
    size: 1,
    tags: ['crystal'],
    crystal: 'virdite',
    school: 'earth',
  },

  // ----- Materials -----
  stone_rough: {
    id: 'tpl:stone_rough',
    templateId: 'stone_rough',
    name: 'Необработанный камень',
    kind: 'material',
    rarity: 'common',
    size: 1,
    tags: ['stone'],
  },
  ore_iron: {
    id: 'tpl:ore_iron',
    templateId: 'ore_iron',
    name: 'Железная руда',
    kind: 'material',
    rarity: 'common',
    size: 2,
    tags: ['metal', 'stone'],
  },
};

export function getItemTemplate(templateId: string): Item {
  const t = ITEM_TEMPLATES[templateId];
  if (!t) throw new Error(`Unknown item template: ${templateId}`);
  return t;
}
