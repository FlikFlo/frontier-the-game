import type { CraftCheck, CraftMissing, Recipe } from '../types/crafting';
import type { CrystalKind, CrystalStockpile, ItemInstance } from '../types/domain';
import { makeItem } from './items';

// Count how many instances of each template are present in the stash.
// Equipped soul-gear still counts, but crafting won't destroy equipped items — we filter at consume time.
export function countByTemplate(inventory: ItemInstance[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const inst of inventory) {
    out[inst.item.templateId] = (out[inst.item.templateId] ?? 0) + 1;
  }
  return out;
}

export function checkRecipe(
  recipe: Recipe,
  inventory: ItemInstance[],
  crystals: CrystalStockpile,
  lockedInstanceIds: Set<string> = new Set(),
): CraftCheck {
  const missing: CraftMissing[] = [];
  const available = inventory.filter((i) => !lockedInstanceIds.has(i.item.id));
  const counts = countByTemplate(available);

  for (const ing of recipe.ingredients) {
    const have = counts[ing.templateId] ?? 0;
    if (have < ing.count) {
      missing.push({ kind: 'item', templateId: ing.templateId, have, need: ing.count });
    }
  }

  if (recipe.crystalCost) {
    const entries = Object.entries(recipe.crystalCost) as [CrystalKind, number][];
    for (const [crystal, need] of entries) {
      if (!need) continue;
      const have = crystals[crystal] ?? 0;
      if (have < need) missing.push({ kind: 'crystal', crystal, have, need });
    }
  }

  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}

// Returns a new inventory/crystals pair with ingredients consumed and output added.
// Throws if check fails — caller should check first.
export function applyCraft(
  recipe: Recipe,
  inventory: ItemInstance[],
  crystals: CrystalStockpile,
  lockedInstanceIds: Set<string> = new Set(),
): { inventory: ItemInstance[]; crystals: CrystalStockpile; produced: ItemInstance[] } {
  const check = checkRecipe(recipe, inventory, crystals, lockedInstanceIds);
  if (!check.ok) {
    throw new Error(`Cannot craft ${recipe.id}: ingredients missing`);
  }

  // Consume ingredient instances in order (prefer non-locked).
  const toRemove = new Set<string>();
  for (const ing of recipe.ingredients) {
    let remaining = ing.count;
    for (const inst of inventory) {
      if (remaining <= 0) break;
      if (lockedInstanceIds.has(inst.item.id)) continue;
      if (toRemove.has(inst.item.id)) continue;
      if (inst.item.templateId === ing.templateId) {
        toRemove.add(inst.item.id);
        remaining -= 1;
      }
    }
  }

  const newInventory = inventory.filter((i) => !toRemove.has(i.item.id));

  // Deduct crystals.
  const newCrystals: CrystalStockpile = { ...crystals };
  if (recipe.crystalCost) {
    const entries = Object.entries(recipe.crystalCost) as [CrystalKind, number][];
    for (const [crystal, need] of entries) {
      if (!need) continue;
      newCrystals[crystal] = (newCrystals[crystal] ?? 0) - need;
    }
  }

  // Produce output instances.
  const produced: ItemInstance[] = [];
  for (let i = 0; i < recipe.output.count; i++) {
    produced.push(makeItem(recipe.output.templateId, recipe.output.binding ?? 'raid'));
  }

  return { inventory: [...newInventory, ...produced], crystals: newCrystals, produced };
}
