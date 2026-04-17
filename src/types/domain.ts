// Core domain types for Frontier.
// Keep this file free of React/RN imports — pure data shapes.

export type MagicSchool =
  | 'earth'
  | 'water'
  | 'fire'
  | 'air'
  | 'light'
  | 'dark'
  | 'blood';

export type CrystalKind = 'virdite' | 'aquirin' | 'pyrite' | 'zephyrite' | 'lucerite' | 'nocrite' | 'sanguit';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Tags that drive crafting/alchemy (MVP-2) and combat effects.
export type ItemTag =
  | 'metal'
  | 'wood'
  | 'herb'
  | 'stone'
  | 'crystal'
  | 'organic'
  | 'paper'
  | 'reagent';

// Soul items are bound to the hero and cannot be lost on death.
// Raid items are carried into the expedition and lost if extraction fails.
export type ItemBinding = 'soul' | 'raid';

export type StatBlock = {
  attack: number;
  magic: number;
  defense: number;
  speed: number;
  critChance: number; // 0..1
};

export type DamageType = 'physical' | 'magic';

export type ItemKind =
  | 'weapon'
  | 'armor'
  | 'zir'
  | 'consumable'
  | 'material'
  | 'crystal'
  | 'artifact';

export type BaseItem = {
  id: string;
  templateId: string;
  name: string;
  kind: ItemKind;
  rarity: ItemRarity;
  size: number; // inventory slot cost
  tags: ItemTag[];
  description?: string;
};

export type Weapon = BaseItem & {
  kind: 'weapon';
  damage: number;
  damageType: DamageType;
  speed: number; // modifier to owner speed
};

export type Armor = BaseItem & {
  kind: 'armor';
  defense: number;
};

export type Zir = BaseItem & {
  kind: 'zir';
  school: MagicSchool;
  power: number;
  cooldownTurns: number;
  chargesMax: number;
  effect: ZirEffect;
};

export type ZirEffect =
  | { type: 'damage'; amount: number; school: MagicSchool }
  | { type: 'heal'; amount: number }
  | { type: 'buff'; stat: keyof StatBlock; amount: number; durationTurns: number }
  | { type: 'dot'; amount: number; durationTurns: number; school: MagicSchool };

export type Consumable = BaseItem & {
  kind: 'consumable';
  effect:
    | { type: 'heal'; amount: number }
    | { type: 'restoreEnergy'; amount: number }
    | { type: 'cureStatus' };
  triggerHpPct?: number; // used by autobattle AI to decide when to fire
};

export type Material = BaseItem & { kind: 'material' };

export type Crystal = BaseItem & {
  kind: 'crystal';
  crystal: CrystalKind;
  school: MagicSchool;
};

export type Artifact = BaseItem & { kind: 'artifact' };

export type Item = Weapon | Armor | Zir | Consumable | Material | Crystal | Artifact;

// Instance of an item with binding and optional charges.
export type ItemInstance = {
  item: Item;
  binding: ItemBinding;
  charges?: number; // for Zirs
};

// ---------- Hero, Companion ----------

export type Hero = {
  id: string;
  name: string;
  level: number;
  xp: number;
  hpMax: number;
  epMax: number;
  stats: StatBlock;
  equippedWeaponId: string | null; // instance id in inventory
  equippedArmorId: string | null;
  equippedZirIds: string[]; // up to 2 in MVP
};

export type Companion = {
  id: string;
  templateId: string;
  name: string;
  role: 'tank' | 'damage' | 'support' | 'control';
  level: number;
  hpMax: number;
  epMax: number;
  stats: StatBlock;
  weaponDamage: number;
  downed: boolean; // falls in combat, heals at Infirmary
};

// ---------- Expedition / Node Map ----------

export type NodeType =
  | 'start'
  | 'combat'
  | 'elite'
  | 'boss'
  | 'treasure'
  | 'event'
  | 'rest'
  | 'extraction';

export type ExpeditionNode = {
  id: string;
  type: NodeType;
  label: string;
  // payload populated per type
  combat?: { enemyTemplateIds: string[] };
  treasure?: { lootTableId: string };
  event?: { eventId: string };
  extraction?: { difficulty: number }; // future: hold X turns vs waves
};

export type ExpeditionEdge = { from: string; to: string };

export type LayoutNode = {
  id: string;
  type: NodeType;
  label?: string;
};

export type LayoutEdge = {
  from: string;
  to: string;
};

export type ExpeditionLayout = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  startNodeId: string;
};

export type ExpeditionTemplate = {
  id: string;
  name: string;
  school?: MagicSchool;
  travelDays: number;
  crystalCost: Partial<Record<CrystalKind, number>>;
  recommendedPower: number;
  description?: string;
  // Explicit graph of the expedition. Supports branching and multiple
  // extraction points — the core of the extraction loop.
  layout: ExpeditionLayout;
  // Enemy template IDs for combat nodes; boss is separate.
  combatPool: string[];
  bossTemplateId: string;
  // Loot tables by node type.
  chestLootTableId: string;
  // Event IDs to choose from for event nodes.
  eventIds?: string[];
  // If true, this expedition is a portal world (uses portal room and crystals).
  portal: boolean;
};

export type ExpeditionRun = {
  templateId: string;
  seed: number;
  nodes: ExpeditionNode[];
  edges: ExpeditionEdge[];
  currentNodeId: string;
  visitedNodeIds: string[];
  // loot picked up during the run (raid-bound) — lost on failure.
  raidLoot: ItemInstance[];
  // heat/instability — rises with each visited node, drives extraction pressure.
  portalInstability: number;
  startedAt: number; // game-day timestamp
};

// ---------- Enemies ----------

export type EnemyTemplate = {
  id: string;
  name: string;
  behavior: 'grunt' | 'tank' | 'sniper' | 'mage' | 'healer' | 'berserker';
  hpMax: number;
  stats: StatBlock;
  weaponDamage: number;
  damageType: DamageType;
  school?: MagicSchool;
  xpReward: number;
  lootTableId?: string;
  // Formation — which row the enemy spawns in and whether it can hit across the line.
  preferredRow: 'front' | 'back';
  attackRange: 'melee' | 'ranged';
};

// ---------- Persistent game state ----------

export type CrystalStockpile = Partial<Record<CrystalKind, number>>;

export type GameDay = number; // simple counter

export type FortressProgress = {
  // simple placeholders for MVP; real fortress management in MVP-2
  portalRoomLevel: number;
  infirmaryLevel: number;
};
