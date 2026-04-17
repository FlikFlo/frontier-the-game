import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Companion,
  CrystalStockpile,
  ExpeditionRun,
  FortressProgress,
  GameDay,
  Hero,
  ItemInstance,
} from '../types/domain';
import { makeItem } from '../systems/items';
import { generateExpedition } from '../systems/expedition';
import { getExpeditionTemplate } from '../data/expeditions';
import { randomSeed } from '../systems/rng';
import { applyCraft, checkRecipe } from '../systems/crafting';
import { getRecipe } from '../data/recipes';
import type { CraftCheck } from '../types/crafting';

// --------- Initial state helpers ---------

function initialHero(): Hero {
  const weapon = makeItem('ranger_sword', 'soul');
  const armor = makeItem('leather_vest', 'soul');
  return {
    id: 'hero_main',
    name: 'Ролан',
    level: 1,
    xp: 0,
    hpMax: 80,
    epMax: 30,
    stats: { attack: 10, magic: 4, defense: 3, speed: 10, critChance: 0.05 },
    equippedWeaponId: weapon.item.id,
    equippedArmorId: armor.item.id,
    equippedZirIds: [],
  };
}

function initialCompanion(): Companion {
  return {
    id: 'companion_ranger',
    templateId: 'old_ranger',
    name: 'Керн Седой',
    role: 'tank',
    level: 1,
    hpMax: 60,
    epMax: 20,
    stats: { attack: 7, magic: 0, defense: 4, speed: 8, critChance: 0.05 },
    weaponDamage: 6,
    downed: false,
  };
}

function initialInventory(heroWeaponId: string, heroArmorId: string): {
  items: ItemInstance[];
  startingZirId: string;
} {
  // Keep hero's equipped soul-gear in inventory list for lookup.
  const weapon = makeItem('ranger_sword', 'soul');
  weapon.item.id = heroWeaponId; // align id with hero equipment
  const armor = makeItem('leather_vest', 'soul');
  armor.item.id = heroArmorId;
  const zir1 = makeItem('zir_stone_spike', 'soul');
  const potion = makeItem('potion_health_minor', 'raid');
  return { items: [weapon, armor, zir1, potion], startingZirId: zir1.item.id };
}

// --------- State shape ---------

export type GameState = {
  version: number;
  day: GameDay;
  hero: Hero;
  companion: Companion | null;
  inventory: ItemInstance[]; // fortress stash + equipped
  inventoryCapacity: number; // total size allowed
  crystals: CrystalStockpile;
  fortress: FortressProgress;
  currentRun: ExpeditionRun | null;
  lastResult: { outcome: 'victory' | 'defeat' | 'flee'; collectedCount: number } | null;
};

export type GameActions = {
  resetNewGame: () => void;
  equipZir: (instanceId: string) => void;
  unequipZir: (instanceId: string) => void;
  startExpedition: (templateId: string) => void;
  advanceToNode: (nodeId: string) => void;
  stashRaidLoot: (items: ItemInstance[]) => void; // add to current run's pouch
  extractRunSucceeded: () => void;
  extractRunFailed: (outcome: 'defeat' | 'flee') => void;
  awardXp: (amount: number) => void;
  checkCraft: (recipeId: string) => CraftCheck;
  craftItem: (recipeId: string) => { ok: boolean; message: string };
};

// --------- Store ---------

export const useGame = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      version: 1,
      day: 1,
      hero: initialHero(),
      companion: initialCompanion(),
      inventory: [],
      inventoryCapacity: 12,
      crystals: { virdite: 0 },
      fortress: { portalRoomLevel: 1, infirmaryLevel: 1 },
      currentRun: null,
      lastResult: null,

      resetNewGame: () => {
        const hero = initialHero();
        const { items, startingZirId } = initialInventory(
          hero.equippedWeaponId!,
          hero.equippedArmorId!,
        );
        set({
          version: 1,
          day: 1,
          hero: { ...hero, equippedZirIds: [startingZirId] },
          companion: initialCompanion(),
          inventory: items,
          inventoryCapacity: 12,
          crystals: { virdite: 0 },
          fortress: { portalRoomLevel: 1, infirmaryLevel: 1 },
          currentRun: null,
          lastResult: null,
        });
      },

      equipZir: (instanceId) => {
        const s = get();
        const inv = s.inventory.find((i) => i.item.id === instanceId);
        if (!inv || inv.item.kind !== 'zir') return;
        const equipped = s.hero.equippedZirIds;
        if (equipped.includes(instanceId)) return;
        if (equipped.length >= 2) return;
        set({ hero: { ...s.hero, equippedZirIds: [...equipped, instanceId] } });
      },

      unequipZir: (instanceId) => {
        const s = get();
        set({
          hero: {
            ...s.hero,
            equippedZirIds: s.hero.equippedZirIds.filter((id) => id !== instanceId),
          },
        });
      },

      startExpedition: (templateId) => {
        const tpl = getExpeditionTemplate(templateId);
        const run = generateExpedition(tpl, randomSeed());
        set({ currentRun: run, lastResult: null });
      },

      advanceToNode: (nodeId) => {
        const s = get();
        if (!s.currentRun) return;
        const run = s.currentRun;
        set({
          currentRun: {
            ...run,
            currentNodeId: nodeId,
            visitedNodeIds: [...run.visitedNodeIds, nodeId],
            portalInstability: run.portalInstability + 1,
          },
        });
      },

      stashRaidLoot: (items) => {
        const s = get();
        if (!s.currentRun) return;
        set({
          currentRun: { ...s.currentRun, raidLoot: [...s.currentRun.raidLoot, ...items] },
        });
      },

      extractRunSucceeded: () => {
        const s = get();
        if (!s.currentRun) return;
        // Move raidLoot → fortress inventory (respecting capacity).
        const incoming = s.currentRun.raidLoot;
        const merged = [...s.inventory, ...incoming];
        // Count crystals separately into stockpile, keep other items in inventory
        const crystals: CrystalStockpile = { ...s.crystals };
        const kept: ItemInstance[] = [];
        for (const inst of merged) {
          if (inst.item.kind === 'crystal') {
            const k = inst.item.crystal;
            crystals[k] = (crystals[k] ?? 0) + 1;
          } else {
            kept.push(inst);
          }
        }
        set({
          inventory: kept,
          crystals,
          currentRun: null,
          day: s.day + 1,
          lastResult: { outcome: 'victory', collectedCount: incoming.length },
        });
      },

      extractRunFailed: (outcome) => {
        const s = get();
        if (!s.currentRun) return;
        // Raid loot lost. Soul gear retained.
        set({
          currentRun: null,
          day: s.day + 1,
          lastResult: { outcome, collectedCount: 0 },
        });
      },

      awardXp: (amount) => {
        const s = get();
        set({ hero: { ...s.hero, xp: s.hero.xp + amount } });
      },

      checkCraft: (recipeId) => {
        const s = get();
        const recipe = getRecipe(recipeId);
        const locked = new Set<string>(
          [s.hero.equippedWeaponId, s.hero.equippedArmorId, ...s.hero.equippedZirIds].filter(
            (x): x is string => !!x,
          ),
        );
        return checkRecipe(recipe, s.inventory, s.crystals, locked);
      },

      craftItem: (recipeId) => {
        const s = get();
        const recipe = getRecipe(recipeId);
        const locked = new Set<string>(
          [s.hero.equippedWeaponId, s.hero.equippedArmorId, ...s.hero.equippedZirIds].filter(
            (x): x is string => !!x,
          ),
        );
        const check = checkRecipe(recipe, s.inventory, s.crystals, locked);
        if (!check.ok) {
          return { ok: false, message: 'Не хватает ингредиентов.' };
        }
        const { inventory: nextInv, crystals: nextCrystals, produced } = applyCraft(
          recipe,
          s.inventory,
          s.crystals,
          locked,
        );
        const nextFill = nextInv.reduce((sum, x) => sum + x.item.size, 0);
        if (nextFill > s.inventoryCapacity) {
          return {
            ok: false,
            message: `Склад переполнен (нужно ${nextFill}/${s.inventoryCapacity}).`,
          };
        }
        set({ inventory: nextInv, crystals: nextCrystals });
        const name = produced[0]?.item.name ?? recipe.output.templateId;
        return {
          ok: true,
          message: `Создано: ${name}${produced.length > 1 ? ` ×${produced.length}` : ''}`,
        };
      },
    }),
    {
      name: 'frontier-save-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // Strip ephemeral fields from persistence if any are added later.
    },
  ),
);

// Convenience selectors
export const selectHero = (s: GameState) => s.hero;
export const selectCompanion = (s: GameState) => s.companion;
export const selectInventory = (s: GameState) => s.inventory;
export const selectCrystals = (s: GameState) => s.crystals;
export const selectRun = (s: GameState) => s.currentRun;

// Ensure default inventory exists after hydration on first install.
// Must run after AsyncStorage hydration to avoid overwriting a saved game.
export function bootstrapIfEmpty(): void {
  const run = () => {
    const s = useGame.getState();
    if (s.inventory.length === 0) {
      s.resetNewGame();
    }
  };
  if (useGame.persist.hasHydrated()) {
    run();
  } else {
    const unsub = useGame.persist.onFinishHydration(() => {
      run();
      unsub();
    });
  }
}
