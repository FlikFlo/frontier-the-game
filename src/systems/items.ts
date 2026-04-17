import { getItemTemplate } from '../data/items';
import { getLootTable } from '../data/lootTables';
import type { ItemBinding, ItemInstance, Zir } from '../types/domain';
import type { RNG } from './rng';

let idCounter = 1;
export function makeInstanceId(): string {
  return `it_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

export function makeItem(templateId: string, binding: ItemBinding = 'raid'): ItemInstance {
  const tpl = getItemTemplate(templateId);
  const instance: ItemInstance = {
    item: { ...tpl, id: makeInstanceId() },
    binding,
  };
  if (tpl.kind === 'zir') {
    instance.charges = (tpl as Zir).chargesMax;
  }
  return instance;
}

export function rollLoot(tableId: string, rng: RNG, binding: ItemBinding = 'raid'): ItemInstance[] {
  const table = getLootTable(tableId);
  const out: ItemInstance[] = [];
  const emit = (templateId: string, min: number, max: number) => {
    const count = rng.int(min, max);
    for (let i = 0; i < count; i++) out.push(makeItem(templateId, binding));
  };
  if (table.guaranteed) {
    for (const g of table.guaranteed) emit(g.templateId, g.min, g.max);
  }
  for (let i = 0; i < table.rolls; i++) {
    const entry = rng.weighted(table.entries.map((e) => ({ item: e, weight: e.weight })));
    emit(entry.templateId, entry.min, entry.max);
  }
  return out;
}

export function totalSize(items: ItemInstance[]): number {
  return items.reduce((s, x) => s + x.item.size, 0);
}
