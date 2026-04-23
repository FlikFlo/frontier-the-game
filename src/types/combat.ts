import type {
  Companion,
  DamageType,
  EnemyTemplate,
  Hero,
  ItemInstance,
  MagicSchool,
  StatBlock,
  Zir,
} from './domain';

// ----- Combat participant (runtime-only) -----

export type Side = 'ally' | 'enemy';

export type StatusEffect =
  | { type: 'burn'; amount: number; turnsLeft: number }
  | { type: 'freeze'; turnsLeft: number }
  | { type: 'stun'; turnsLeft: number }
  | { type: 'haste'; turnsLeft: number }
  | { type: 'bleed'; amount: number; turnsLeft: number }
  | { type: 'poison'; amount: number; turnsLeft: number }
  | { type: 'bless'; amount: number; turnsLeft: number }
  | { type: 'curse'; turnsLeft: number }
  | { type: 'defend'; turnsLeft: number };

export type PlayerAction =
  | { kind: 'attack'; actorId: string; targetId: string }
  | { kind: 'zir'; actorId: string; zirId: string; targetId: string }
  | { kind: 'defend'; actorId: string }
  | { kind: 'skip'; actorId: string };

export type CombatantKind = 'hero' | 'companion' | 'enemy';

// Formation position. Front row shields back row from melee attacks.
export type FormationRow = 'front' | 'back';
export type AttackRange = 'melee' | 'ranged';

export type ZirRuntime = {
  instanceId: string;
  zir: Zir;
  charges: number;
  cooldownLeft: number; // 0 = ready
};

export type Combatant = {
  id: string;
  kind: CombatantKind;
  name: string;
  side: Side;
  hp: number;
  hpMax: number;
  ep: number;
  epMax: number;
  stats: StatBlock;
  weaponDamage: number;
  damageType: DamageType;
  school?: MagicSchool;
  statuses: StatusEffect[];
  // Timeline: lower value = acts sooner. After acting, value increases by actionCost.
  timelinePosition: number;
  // Refs to runtime zirs (heroes + companions may have them; enemies typically none in MVP)
  zirs: ZirRuntime[];
  // For AI behavior
  behavior: 'hero' | 'companion' | 'grunt' | 'tank' | 'sniper' | 'mage' | 'healer' | 'berserker';
  // Link to source data for loot on death (enemies only)
  sourceTemplateId?: string;
  xpReward?: number;
  // Formation
  row: FormationRow;
  col: number; // 0 or 1 for MVP 2x2 grid
  attackRange: AttackRange;
};

export type CombatTactic = 'aggressive' | 'cautious' | 'balanced' | 'focus_boss' | 'defensive';

export type CombatLogEntry =
  | { kind: 'start'; at: number }
  | { kind: 'action'; actor: string; verb: string; target?: string; amount?: number; at: number }
  | { kind: 'status'; target: string; status: string; gained: boolean; at: number }
  | { kind: 'downed'; combatant: string; at: number }
  | { kind: 'end'; outcome: 'victory' | 'defeat' | 'flee'; at: number };

export type CombatState = {
  turn: number;
  combatants: Combatant[];
  log: CombatLogEntry[];
  outcome: 'ongoing' | 'victory' | 'defeat' | 'flee';
  tactic: CombatTactic;
};

// Setup inputs passed to combat engine
export type CombatSetup = {
  hero: Hero;
  heroInventory: ItemInstance[]; // to resolve equipped Zirs
  companion: Companion | null;
  enemies: EnemyTemplate[];
  tactic: CombatTactic;
};
