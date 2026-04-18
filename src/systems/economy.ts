import type { ItemInstance, ItemRarity } from '../types/domain';
import { makeItem } from './items';

const RARITY_MULT: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 2.5,
  rare: 6,
  epic: 15,
  legendary: 40,
};

// Gold value for selling to a fortress merchant. Soul items return 0 — they're bound.
export function sellValue(inst: ItemInstance): number {
  if (inst.binding === 'soul') return 0;
  const r = RARITY_MULT[inst.item.rarity];
  switch (inst.item.kind) {
    case 'material':
      return Math.round(4 * inst.item.size * r);
    case 'consumable':
      return Math.round(10 * r);
    case 'weapon':
      return Math.round(25 * r);
    case 'armor':
      return Math.round(25 * r);
    case 'zir':
      return Math.round(30 * r);
    case 'crystal':
      return Math.round(15 * r);
    case 'artifact':
      return Math.round(80 * r);
    default:
      return 0;
  }
}

// Dismantle — break down into base materials. Soul items can't be dismantled.
// Consumables, crystals, materials — no meaningful break-down for MVP.
export function dismantleOutput(inst: ItemInstance): ItemInstance[] {
  if (inst.binding === 'soul') return [];
  switch (inst.item.kind) {
    case 'weapon':
      return [
        makeItem('ore_iron', 'raid'),
        ...(inst.item.rarity === 'common' ? [] : [makeItem('stone_rough', 'raid')]),
      ];
    case 'armor':
      return [makeItem('mine_herb', 'raid'), makeItem('mine_herb', 'raid')];
    case 'zir':
      return [makeItem('crude_paper', 'raid'), makeItem('ink_essence', 'raid')];
    case 'artifact':
      return [makeItem('ink_essence', 'raid'), makeItem('golem_core', 'raid')];
    default:
      return [];
  }
}

export function canDismantle(inst: ItemInstance): boolean {
  return dismantleOutput(inst).length > 0;
}
