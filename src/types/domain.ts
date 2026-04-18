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

// ----- Overworld Map (MVP-4) -----
// Illustrated 2D scene with hand-placed nodes and paths between them.
// Replaces the grid of cells — the map looks like a painted dungeon now.

export type MapNode = {
  id: string;
  x: number;                 // SVG viewBox coord
  y: number;
  type: TileType;
  label?: string;
  content?: TileContent;
  discovered: boolean;       // visible (icon shown)
  visited: boolean;          // player has been here; content resolved
  scouted?: boolean;
};

export type MapEdge = {
  id: string;
  from: string;
  to: string;
  // Encounter chance when travelling this edge (0..1).
  encounterChance?: number;
};

export type SceneKind = 'mine' | 'emerald_reach';

export type OverworldMap = {
  sceneKind: SceneKind;
  viewWidth: number;         // SVG viewBox width
  viewHeight: number;
  nodes: MapNode[];
  edges: MapEdge[];
  startNodeId: string;
};
// Each expedition is a small grid you reveal one step at a time.
// Replaces the linear node DAG; the old layout type stays for templates
// that haven't been migrated yet.

export type TileType =
  | 'empty'
  | 'combat'
  | 'elite'
  | 'boss'
  | 'treasure'
  | 'event'
  | 'rest'
  | 'extraction'
  | 'cartographer'
  | 'portal'        // entry tile, always start
  | 'impassable';

export type TileContent = {
  enemyTemplateIds?: string[];
  lootTableId?: string;
  eventId?: string;
  // Cartographer reveals tiles within `radius` of the cartographer's tile.
  cartographerRadius?: number;
  // If the tile is a POI, these are populated by the generator.
  poiId?: string;
  poiName?: string;
  poiFlavor?: string;
  poiIcon?: string;                 // single-char glyph, e.g. ☗
  poiLandmark?: boolean;            // visible through fog as silhouette
  uniqueRewardTemplateId?: string;  // guaranteed drop on defeat / opening
};

export type Tile = {
  id: string;
  x: number;
  y: number;
  type: TileType;
  label?: string;
  content?: TileContent;
  // Player has line-of-sight: knows the tile type but hasn't entered.
  revealed: boolean;
  // Player has been on this tile and resolved its content (if any).
  explored: boolean;
  // Player has scouted this tile — knows exact contents, not just the type.
  scouted?: boolean;
};

export type TileGrid = {
  width: number;
  height: number;
  tiles: Tile[];
  startId: string;
};

export type GridConfig = {
  width: number;
  height: number;
  // Approximate counts — generator scatters them across the grid.
  combat: number;
  elite: number;
  treasure: number;
  event: number;
  rest: number;
  cartographer: number;
  extractions: number; // multiple exit tiles
  impassableRatio: number; // 0..1
};

export type ExpeditionTemplate = {
  id: string;
  name: string;
  school?: MagicSchool;
  travelDays: number;
  crystalCost: Partial<Record<CrystalKind, number>>;
  recommendedPower: number;
  description?: string;
  // Legacy linear/branch layout — kept for backwards compat during migration.
  layout?: ExpeditionLayout;
  // New tile-based config.
  grid?: GridConfig;
  // MVP-4: scene kind drives which illustrated backdrop renders behind the
  // overworld map. The node layout is generated procedurally but seeded
  // from scene + seed so it stays stable within a run.
  scene?: SceneKind;
  combatPool: string[];
  bossTemplateId: string;
  chestLootTableId: string;
  eventIds?: string[];
  portal: boolean;
};

export type ExpeditionRun = {
  templateId: string;
  seed: number;
  // Legacy: linear/branching node graph. Empty when grid is used.
  nodes: ExpeditionNode[];
  edges: ExpeditionEdge[];
  currentNodeId: string;
  visitedNodeIds: string[];
  // New: tile-based exploration grid (preferred path).
  grid?: TileGrid;
  currentTileId?: string;
  // MVP-4: illustrated overworld map.
  map?: OverworldMap;
  currentMapNodeId?: string;
  // Provisions: spent to scout. Refilled before each expedition.
  provisions: number;
  raidLoot: ItemInstance[];
  // heat/instability — rises with each visited tile, drives extraction pressure.
  portalInstability: number;
  startedAt: number;
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
  rooms: Partial<Record<string, number>>; // FortressRoomId → level
};
