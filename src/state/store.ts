import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Companion,
  CrystalKind,
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
import { applyXp, type LevelUp } from '../systems/leveling';
import { canDismantle, dismantleOutput, sellValue } from '../systems/economy';
import { FORTRESS_ROOMS } from '../data/fortressRooms';
import { countByTemplate } from '../systems/crafting';
import {
  generateExpeditionRun,
  markExplored,
  revealAround,
  setTileType,
  tileAt,
  walkableNeighbors,
} from '../systems/tileExpedition';

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
  gold: number;
  fortress: FortressProgress;
  currentRun: ExpeditionRun | null;
  lastResult: { outcome: 'victory' | 'defeat' | 'flee'; collectedCount: number } | null;
  pendingLevelUps: LevelUp[];
};

export type GameActions = {
  resetNewGame: () => void;
  equipZir: (instanceId: string) => void;
  unequipZir: (instanceId: string) => void;
  startExpedition: (templateId: string) => { ok: boolean; message: string };
  checkExpeditionCost: (
    templateId: string,
  ) => { ok: true } | { ok: false; missing: Partial<Record<CrystalKind, number>> };
  advanceToNode: (nodeId: string) => void;
  // Tile-grid actions
  moveToTile: (tileId: string) => { ok: boolean; message: string };
  scoutFromCurrent: () => { ok: boolean; message: string };
  triggerCartographer: (tileId: string) => void;
  clearTileContent: (tileId: string) => void;
  stashRaidLoot: (items: ItemInstance[]) => void;
  extractRunSucceeded: () => void;
  extractRunFailed: (outcome: 'defeat' | 'flee') => void;
  awardXp: (amount: number) => void;
  clearLevelUps: () => void;
  checkCraft: (recipeId: string) => CraftCheck;
  craftItem: (recipeId: string) => { ok: boolean; message: string };
  sellItem: (instanceId: string) => { ok: boolean; message: string };
  dismantleItem: (instanceId: string) => { ok: boolean; message: string };
  upgradeRoom: (roomId: string) => { ok: boolean; message: string };
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
      gold: 0,
      fortress: {
        rooms: {
          portal_hall: 1,
          infirmary: 1,
          workshop: 1,
          storage: 1,
          forge: 0,
          library: 0,
        },
      },
      currentRun: null,
      lastResult: null,
      pendingLevelUps: [],

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
          gold: 20,
          fortress: {
            rooms: {
              portal_hall: 1,
              infirmary: 1,
              workshop: 1,
              storage: 1,
              forge: 0,
              library: 0,
            },
          },
          currentRun: null,
          lastResult: null,
          pendingLevelUps: [],
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

      checkExpeditionCost: (templateId) => {
        const s = get();
        const tpl = getExpeditionTemplate(templateId);
        const missing: Partial<Record<CrystalKind, number>> = {};
        for (const [kindStr, need] of Object.entries(tpl.crystalCost)) {
          const kind = kindStr as CrystalKind;
          if (!need) continue;
          const have = s.crystals[kind] ?? 0;
          if (have < need) missing[kind] = need - have;
        }
        if (Object.keys(missing).length === 0) return { ok: true };
        return { ok: false, missing };
      },

      startExpedition: (templateId) => {
        const s = get();
        const tpl = getExpeditionTemplate(templateId);

        // Enforce crystal cost upfront — portal consumes them even on failure.
        const crystals: CrystalStockpile = { ...s.crystals };
        for (const [kindStr, need] of Object.entries(tpl.crystalCost)) {
          const kind = kindStr as CrystalKind;
          if (!need) continue;
          const have = crystals[kind] ?? 0;
          if (have < need) {
            return {
              ok: false,
              message: `Не хватает кристаллов для портала.`,
            };
          }
          crystals[kind] = have - need;
        }

        const run = tpl.grid
          ? generateExpeditionRun(tpl, randomSeed())
          : generateExpedition(tpl, randomSeed());
        set({ currentRun: run, lastResult: null, crystals });
        return { ok: true, message: tpl.portal ? 'Портал стабилизирован.' : 'В путь.' };
      },

      moveToTile: (tileId) => {
        const s = get();
        if (!s.currentRun || !s.currentRun.grid || !s.currentRun.currentTileId) {
          return { ok: false, message: 'Нет активной вылазки.' };
        }
        const grid = s.currentRun.grid;
        const current = tileAt(grid, s.currentRun.currentTileId);
        if (!current) return { ok: false, message: 'Текущая клетка не найдена.' };
        const target = tileAt(grid, tileId);
        if (!target) return { ok: false, message: 'Клетка не найдена.' };
        if (target.type === 'impassable') {
          return { ok: false, message: 'Сюда не пройти.' };
        }
        const isAdjacent = walkableNeighbors(grid, current).some((n) => n.id === tileId);
        if (!isAdjacent) return { ok: false, message: 'Слишком далеко — только в соседнюю.' };
        if (!target.revealed) return { ok: false, message: 'Клетка ещё в тумане.' };

        // Move: mark explored, reveal LOS, bump instability.
        let nextGrid = markExplored(grid, target.id);
        nextGrid = revealAround(nextGrid, target, 1);
        set({
          currentRun: {
            ...s.currentRun,
            grid: nextGrid,
            currentTileId: target.id,
            portalInstability: s.currentRun.portalInstability + 1,
          },
        });
        return { ok: true, message: '' };
      },

      scoutFromCurrent: () => {
        const s = get();
        if (!s.currentRun || !s.currentRun.grid || !s.currentRun.currentTileId) {
          return { ok: false, message: 'Нет активной вылазки.' };
        }
        if (s.currentRun.provisions <= 0) {
          return { ok: false, message: 'Не хватает провизии для разведки.' };
        }
        const grid = s.currentRun.grid;
        const current = tileAt(grid, s.currentRun.currentTileId);
        if (!current) return { ok: false, message: 'Клетка не найдена.' };
        // Reveal radius 2 from current — see two steps in any direction.
        const nextGrid = revealAround(grid, current, 2);
        set({
          currentRun: {
            ...s.currentRun,
            grid: nextGrid,
            provisions: s.currentRun.provisions - 1,
          },
        });
        return { ok: true, message: 'Разведано. Провизия −1.' };
      },

      triggerCartographer: (tileId) => {
        const s = get();
        if (!s.currentRun || !s.currentRun.grid) return;
        const tile = tileAt(s.currentRun.grid, tileId);
        if (!tile) return;
        const radius = tile.content?.cartographerRadius ?? 3;
        const nextGrid = revealAround(s.currentRun.grid, tile, radius);
        set({
          currentRun: {
            ...s.currentRun,
            grid: nextGrid,
          },
        });
      },

      clearTileContent: (tileId) => {
        const s = get();
        if (!s.currentRun || !s.currentRun.grid) return;
        const nextGrid = setTileType(s.currentRun.grid, tileId, 'empty');
        set({
          currentRun: { ...s.currentRun, grid: nextGrid },
        });
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
        const { hero, levelUps } = applyXp(s.hero, amount);
        set({
          hero,
          pendingLevelUps: [...s.pendingLevelUps, ...levelUps],
        });
      },

      clearLevelUps: () => set({ pendingLevelUps: [] }),

      sellItem: (instanceId) => {
        const s = get();
        const inst = s.inventory.find((i) => i.item.id === instanceId);
        if (!inst) return { ok: false, message: 'Предмет не найден.' };
        if (inst.binding === 'soul')
          return { ok: false, message: 'Душевное не продаётся.' };
        // equipped check
        if (
          s.hero.equippedWeaponId === instanceId ||
          s.hero.equippedArmorId === instanceId ||
          s.hero.equippedZirIds.includes(instanceId)
        ) {
          return { ok: false, message: 'Снимите экипировку перед продажей.' };
        }
        const gold = sellValue(inst);
        if (gold <= 0) return { ok: false, message: 'Этот предмет не покупают.' };
        set({
          inventory: s.inventory.filter((i) => i.item.id !== instanceId),
          gold: s.gold + gold,
        });
        return { ok: true, message: `Продано: ${inst.item.name} за ${gold} золота.` };
      },

      upgradeRoom: (roomId) => {
        const s = get();
        const tpl = FORTRESS_ROOMS[roomId as keyof typeof FORTRESS_ROOMS];
        if (!tpl) return { ok: false, message: 'Комната не найдена.' };
        const rooms = s.fortress?.rooms ?? {};
        const currentLevel = rooms[roomId] ?? 0;
        if (currentLevel >= tpl.maxLevel) {
          return { ok: false, message: 'Максимальный уровень.' };
        }
        const cost = tpl.costForLevel(currentLevel);
        if (s.gold < cost.gold) {
          return { ok: false, message: `Не хватает золота (надо ${cost.gold}).` };
        }
        // Check materials (from non-equipped, non-soul? For simplicity: any instance of that template counts)
        const counts = countByTemplate(s.inventory);
        if (cost.materials) {
          for (const [tplId, need] of Object.entries(cost.materials)) {
            if ((counts[tplId] ?? 0) < need) {
              return { ok: false, message: `Не хватает: ${tplId} (${counts[tplId] ?? 0}/${need}).` };
            }
          }
        }
        // Consume materials
        let inv = [...s.inventory];
        if (cost.materials) {
          for (const [tplId, need] of Object.entries(cost.materials)) {
            let remaining = need;
            inv = inv.filter((inst) => {
              if (remaining <= 0) return true;
              if (inst.item.templateId === tplId) {
                remaining -= 1;
                return false;
              }
              return true;
            });
          }
        }
        const newRooms = { ...rooms, [roomId]: currentLevel + 1 };
        const patch: Partial<GameState> = {
          gold: s.gold - cost.gold,
          inventory: inv,
          fortress: { ...s.fortress, rooms: newRooms },
        };
        // Apply derived effects
        if (roomId === 'storage') {
          patch.inventoryCapacity = 12 + currentLevel * 4; // level 1 → 12, 2 → 16, ...
        }
        if (roomId === 'infirmary' && s.companion) {
          // Small max-HP bump for companion at each level
          const hpBonus = Math.round(s.companion.hpMax * 0.08);
          patch.companion = { ...s.companion, hpMax: s.companion.hpMax + hpBonus };
        }
        set(patch);
        return { ok: true, message: `${tpl.name} улучшен до уровня ${currentLevel + 1}.` };
      },

      dismantleItem: (instanceId) => {
        const s = get();
        const inst = s.inventory.find((i) => i.item.id === instanceId);
        if (!inst) return { ok: false, message: 'Предмет не найден.' };
        if (inst.binding === 'soul')
          return { ok: false, message: 'Душевное не разбирается.' };
        if (
          s.hero.equippedWeaponId === instanceId ||
          s.hero.equippedArmorId === instanceId ||
          s.hero.equippedZirIds.includes(instanceId)
        ) {
          return { ok: false, message: 'Снимите экипировку перед разбором.' };
        }
        if (!canDismantle(inst))
          return { ok: false, message: 'Нечего из него извлечь.' };
        const parts = dismantleOutput(inst);
        const partsSize = parts.reduce((sum, p) => sum + p.item.size, 0);
        const invWithout = s.inventory.filter((i) => i.item.id !== instanceId);
        const currentSize = invWithout.reduce((sum, p) => sum + p.item.size, 0);
        if (currentSize + partsSize > s.inventoryCapacity) {
          return {
            ok: false,
            message: `Склад не примет ${partsSize} размера, освободите место.`,
          };
        }
        set({ inventory: [...invWithout, ...parts] });
        const names = parts.map((p) => p.item.name).join(', ');
        return { ok: true, message: `Разобрано: ${inst.item.name} → ${names}.` };
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
      version: 2,
      // Back-fill fields added after the initial save format so existing
      // players from earlier builds don't crash on entry.
      migrate: (persisted: unknown, _fromVersion: number) => {
        const s: Record<string, unknown> = { ...(persisted as Record<string, unknown> ?? {}) };
        const fortress = (s.fortress as { rooms?: Record<string, number> } | undefined) ?? {};
        if (!fortress.rooms) {
          s.fortress = {
            rooms: {
              portal_hall: 1,
              infirmary: 1,
              workshop: 1,
              storage: 1,
              forge: 0,
              library: 0,
            },
          };
        }
        if (typeof s.gold !== 'number') s.gold = 0;
        if (!Array.isArray(s.pendingLevelUps)) s.pendingLevelUps = [];
        if (typeof s.inventoryCapacity !== 'number') s.inventoryCapacity = 12;
        if (!s.crystals || typeof s.crystals !== 'object') s.crystals = { virdite: 0 };
        return s as typeof s;
      },
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
