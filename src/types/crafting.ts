import type { CrystalKind, ItemBinding } from './domain';

export type CraftStation = 'alchemy' | 'scribing' | 'smithy';

export type RecipeIngredient = {
  templateId: string;
  count: number;
};

export type Recipe = {
  id: string;
  name: string;
  station: CraftStation;
  description: string;
  ingredients: RecipeIngredient[];
  crystalCost?: Partial<Record<CrystalKind, number>>;
  output: {
    templateId: string;
    count: number;
    binding?: ItemBinding;
  };
  // MVP: all start true; later gated by lore/progression.
  unlockedByDefault: boolean;
};

export type CraftMissing =
  | { kind: 'item'; templateId: string; have: number; need: number }
  | { kind: 'crystal'; crystal: CrystalKind; have: number; need: number };

export type CraftCheck =
  | { ok: true }
  | { ok: false; missing: CraftMissing[] };
