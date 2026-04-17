// Autobattle engine. Pure functions — no RN/React imports.
// The UI drives simulation by calling stepCombat() with delays for animation.

import type {
  AttackRange,
  Combatant,
  CombatLogEntry,
  CombatSetup,
  CombatState,
  FormationRow,
  StatusEffect,
  ZirRuntime,
} from '../types/combat';
import type { DamageType, Item, MagicSchool, Zir } from '../types/domain';
import type { RNG } from './rng';
import { createRng } from './rng';

const CRIT_MULT = 1.5;
const BASE_ACTION_COST = 100;

// School effectiveness table. Attack vs defender school.
// Values: 1.5 strong, 0.75 weak, 1 neutral.
const SCHOOL_MATRIX: Record<MagicSchool, Partial<Record<MagicSchool, number>>> = {
  fire: { earth: 1.5, water: 0.75 },
  water: { fire: 1.5, earth: 0.75, air: 0.75 },
  earth: { air: 1.5, water: 1.5, fire: 0.75 },
  air: { earth: 1.5, fire: 0.75 },
  light: { dark: 1.5 },
  dark: { light: 1.5 },
  blood: {},
};

function schoolMod(attack: MagicSchool | undefined, defender: MagicSchool | undefined): number {
  if (!attack || !defender) return 1;
  return SCHOOL_MATRIX[attack]?.[defender] ?? 1;
}

// ---------- Setup ----------

function makeZirRuntime(item: Item): ZirRuntime | null {
  if (item.kind !== 'zir') return null;
  const zir = item as Zir;
  return {
    instanceId: item.id,
    zir,
    charges: zir.chargesMax,
    cooldownLeft: 0,
  };
}

// Place units into a 2x2 grid per side, honoring preferredRow.
// Fills front row first across columns, then back row.
function assignFormation<T extends { row: FormationRow; col: number }>(
  units: { unit: T; preferredRow: FormationRow }[],
): void {
  const taken: Record<FormationRow, Set<number>> = { front: new Set(), back: new Set() };
  // Prefer declared row, cascade to the other if full.
  for (const { unit, preferredRow } of units) {
    const tryRows: FormationRow[] = preferredRow === 'front' ? ['front', 'back'] : ['back', 'front'];
    let placed = false;
    for (const row of tryRows) {
      for (let col = 0; col < 2; col++) {
        if (!taken[row].has(col)) {
          unit.row = row;
          unit.col = col;
          taken[row].add(col);
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
    if (!placed) {
      // Overflow: stack on back row col 0.
      unit.row = 'back';
      unit.col = 0;
    }
  }
}

export function buildCombat(setup: CombatSetup): CombatState {
  const combatants: Combatant[] = [];

  // Hero: front row by default (MVP has sword = melee)
  const heroZirs: ZirRuntime[] = [];
  for (const zirId of setup.hero.equippedZirIds) {
    const inv = setup.heroInventory.find((i) => i.item.id === zirId);
    if (inv) {
      const rt = makeZirRuntime(inv.item);
      if (rt) heroZirs.push(rt);
    }
  }
  const weaponInst = setup.heroInventory.find((i) => i.item.id === setup.hero.equippedWeaponId);
  const weaponDamage = weaponInst && weaponInst.item.kind === 'weapon' ? weaponInst.item.damage : 4;
  const weaponType: DamageType =
    weaponInst && weaponInst.item.kind === 'weapon' ? weaponInst.item.damageType : 'physical';
  // For MVP: melee weapons = melee, magic weapons = ranged.
  const heroRange: AttackRange = weaponType === 'magic' ? 'ranged' : 'melee';

  combatants.push({
    id: 'hero',
    kind: 'hero',
    name: setup.hero.name,
    side: 'ally',
    hp: setup.hero.hpMax,
    hpMax: setup.hero.hpMax,
    ep: setup.hero.epMax,
    epMax: setup.hero.epMax,
    stats: setup.hero.stats,
    weaponDamage,
    damageType: weaponType,
    statuses: [],
    timelinePosition: 0,
    zirs: heroZirs,
    behavior: 'hero',
    row: 'front',
    col: 0,
    attackRange: heroRange,
  });

  // Companion: role → row/range mapping
  if (setup.companion) {
    const c = setup.companion;
    const compRow: FormationRow =
      c.role === 'support' || c.role === 'control' ? 'back' : 'front';
    const compRange: AttackRange = c.role === 'control' ? 'ranged' : 'melee';
    combatants.push({
      id: 'companion',
      kind: 'companion',
      name: c.name,
      side: 'ally',
      hp: c.hpMax,
      hpMax: c.hpMax,
      ep: c.epMax,
      epMax: c.epMax,
      stats: c.stats,
      weaponDamage: c.weaponDamage,
      damageType: 'physical',
      statuses: [],
      timelinePosition: 5,
      zirs: [],
      behavior: 'companion',
      row: compRow,
      col: 0,
      attackRange: compRange,
    });
  }

  // Lay out ally formation (hero + companion) respecting preferredRow.
  assignFormation(
    combatants
      .filter((c) => c.side === 'ally')
      .map((c) => ({ unit: c, preferredRow: c.row })),
  );

  // Enemies
  setup.enemies.forEach((e, i) => {
    combatants.push({
      id: `enemy_${i}`,
      kind: 'enemy',
      name: e.name,
      side: 'enemy',
      hp: e.hpMax,
      hpMax: e.hpMax,
      ep: 0,
      epMax: 0,
      stats: e.stats,
      weaponDamage: e.weaponDamage,
      damageType: e.damageType,
      school: e.school,
      statuses: [],
      timelinePosition: 10 + i * 2,
      zirs: [],
      behavior: e.behavior,
      sourceTemplateId: e.id,
      xpReward: e.xpReward,
      row: e.preferredRow,
      col: 0,
      attackRange: e.attackRange,
    });
  });

  assignFormation(
    combatants
      .filter((c) => c.side === 'enemy')
      .map((c) => ({ unit: c, preferredRow: c.row })),
  );

  return {
    turn: 0,
    combatants,
    log: [{ kind: 'start', at: 0 }],
    outcome: 'ongoing',
    tactic: setup.tactic,
  };
}

// ---------- Helpers ----------

function alive(c: Combatant): boolean {
  return c.hp > 0;
}

function enemiesOf(state: CombatState, side: 'ally' | 'enemy'): Combatant[] {
  return state.combatants.filter((c) => c.side !== side && alive(c));
}

function alliesOf(state: CombatState, side: 'ally' | 'enemy'): Combatant[] {
  return state.combatants.filter((c) => c.side === side && alive(c));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function hasStatus(c: Combatant, type: StatusEffect['type']): boolean {
  return c.statuses.some((s) => s.type === type);
}

// ---------- Action selection (AI) ----------

type Action =
  | { kind: 'attack'; actorId: string; targetId: string }
  | { kind: 'zir'; actorId: string; zirId: string; targetId: string }
  | { kind: 'skip'; actorId: string; reason: string };

// Formation rule: melee attackers must target the enemy front row if anyone
// on it is still alive. Ranged attackers can target either row freely.
function eligibleTargets(
  state: CombatState,
  actor: Combatant,
  rangeOverride?: AttackRange,
): Combatant[] {
  const all = enemiesOf(state, actor.side);
  if (all.length === 0) return [];
  const range = rangeOverride ?? actor.attackRange;
  if (range === 'ranged') return all;
  const front = all.filter((c) => c.row === 'front');
  return front.length > 0 ? front : all;
}

function pickTarget(
  state: CombatState,
  actor: Combatant,
  rangeOverride?: AttackRange,
): Combatant | null {
  const pool = eligibleTargets(state, actor, rangeOverride);
  if (pool.length === 0) return null;
  // focus_boss: prefer highest-HP-max target
  if (state.tactic === 'focus_boss') {
    return pool.reduce((a, b) => (b.hpMax > a.hpMax ? b : a));
  }
  // aggressive + default: pick lowest HP (finisher)
  return pool.reduce((a, b) => (b.hp < a.hp ? b : a));
}

function chooseAction(state: CombatState, actor: Combatant, rng: RNG): Action {
  // Stun/freeze skip
  if (hasStatus(actor, 'stun') || hasStatus(actor, 'freeze')) {
    return { kind: 'skip', actorId: actor.id, reason: 'Оглушён' };
  }
  // Low HP — prioritize heal Zir if available (allies only)
  if (actor.side === 'ally') {
    const healThresh =
      state.tactic === 'aggressive' ? 0.15 : state.tactic === 'cautious' ? 0.4 : 0.25;
    if (actor.hp / actor.hpMax < healThresh) {
      const healZir = actor.zirs.find(
        (z) => z.cooldownLeft === 0 && z.charges > 0 && z.zir.effect.type === 'heal',
      );
      if (healZir) {
        return { kind: 'zir', actorId: actor.id, zirId: healZir.instanceId, targetId: actor.id };
      }
    }
  }
  // Offensive Zir if ready — treat as ranged, bypassing the melee-must-front rule.
  const offZir = actor.zirs.find(
    (z) =>
      z.cooldownLeft === 0 &&
      z.charges > 0 &&
      (z.zir.effect.type === 'damage' || z.zir.effect.type === 'dot'),
  );
  if (offZir) {
    const tgt = pickTarget(state, actor, 'ranged');
    if (tgt) {
      return { kind: 'zir', actorId: actor.id, zirId: offZir.instanceId, targetId: tgt.id };
    }
  }
  // Default: weapon attack
  const tgt = pickTarget(state, actor);
  if (!tgt) return { kind: 'skip', actorId: actor.id, reason: 'Нет цели' };
  return { kind: 'attack', actorId: actor.id, targetId: tgt.id };
}

// ---------- Application ----------

function applyPhysDamage(target: Combatant, raw: number, rng: RNG): { amount: number; crit: boolean } {
  const mitigated = Math.max(1, raw - target.stats.defense);
  const variance = 0.9 + rng.next() * 0.2; // 0.9..1.1
  const crit = rng.chance(0.05);
  const amount = Math.round(mitigated * variance * (crit ? CRIT_MULT : 1));
  target.hp = clamp(target.hp - amount, 0, target.hpMax);
  return { amount, crit };
}

function applyMagicDamage(
  target: Combatant,
  raw: number,
  school: MagicSchool | undefined,
  rng: RNG,
): { amount: number; crit: boolean } {
  const mod = schoolMod(school, target.school);
  const mitigated = Math.max(1, raw - Math.floor(target.stats.defense / 2));
  const variance = 0.9 + rng.next() * 0.2;
  const crit = rng.chance(0.05);
  const amount = Math.round(mitigated * variance * mod * (crit ? CRIT_MULT : 1));
  target.hp = clamp(target.hp - amount, 0, target.hpMax);
  return { amount, crit };
}

function applyAction(state: CombatState, action: Action, rng: RNG): CombatLogEntry[] {
  const log: CombatLogEntry[] = [];
  const actor = state.combatants.find((c) => c.id === action.actorId);
  if (!actor) return log;

  if (action.kind === 'skip') {
    log.push({ kind: 'action', actor: actor.id, verb: 'skip', at: state.turn });
    return log;
  }
  if (action.kind === 'attack') {
    const target = state.combatants.find((c) => c.id === action.targetId);
    if (!target || !alive(target)) return log;
    const raw = actor.weaponDamage + Math.floor(actor.stats.attack * 0.5);
    const res =
      actor.damageType === 'physical'
        ? applyPhysDamage(target, raw, rng)
        : applyMagicDamage(target, raw, actor.school, rng);
    log.push({
      kind: 'action',
      actor: actor.id,
      verb: res.crit ? 'crit' : 'attack',
      target: target.id,
      amount: res.amount,
      at: state.turn,
    });
    if (!alive(target)) log.push({ kind: 'downed', combatant: target.id, at: state.turn });
    return log;
  }
  if (action.kind === 'zir') {
    const rt = actor.zirs.find((z) => z.instanceId === action.zirId);
    if (!rt || rt.cooldownLeft > 0 || rt.charges <= 0) return log;
    const target = state.combatants.find((c) => c.id === action.targetId);
    if (!target) return log;
    const effect = rt.zir.effect;
    if (effect.type === 'damage') {
      const raw = effect.amount + Math.floor(actor.stats.magic * 0.5);
      const res = applyMagicDamage(target, raw, effect.school, rng);
      log.push({
        kind: 'action',
        actor: actor.id,
        verb: 'zir_damage',
        target: target.id,
        amount: res.amount,
        at: state.turn,
      });
    } else if (effect.type === 'heal') {
      const amount = effect.amount + Math.floor(actor.stats.magic * 0.3);
      target.hp = clamp(target.hp + amount, 0, target.hpMax);
      log.push({
        kind: 'action',
        actor: actor.id,
        verb: 'zir_heal',
        target: target.id,
        amount,
        at: state.turn,
      });
    } else if (effect.type === 'dot') {
      target.statuses.push({
        type: effect.school === 'fire' ? 'burn' : 'bleed',
        amount: effect.amount,
        turnsLeft: effect.durationTurns,
      });
      log.push({
        kind: 'status',
        target: target.id,
        status: effect.school === 'fire' ? 'burn' : 'bleed',
        gained: true,
        at: state.turn,
      });
    } else if (effect.type === 'buff') {
      target.statuses.push({
        type: 'bless',
        amount: effect.amount,
        turnsLeft: effect.durationTurns,
      });
      log.push({ kind: 'status', target: target.id, status: 'bless', gained: true, at: state.turn });
    }
    rt.charges -= 1;
    rt.cooldownLeft = rt.zir.cooldownTurns;
    if (!alive(target) && target.side !== actor.side)
      log.push({ kind: 'downed', combatant: target.id, at: state.turn });
    return log;
  }
  return log;
}

function tickStatuses(combatants: Combatant[], state: CombatState): CombatLogEntry[] {
  const log: CombatLogEntry[] = [];
  for (const c of combatants) {
    if (!alive(c)) continue;
    const nextStatuses: StatusEffect[] = [];
    for (const s of c.statuses) {
      if (s.type === 'burn' || s.type === 'poison' || s.type === 'bleed') {
        c.hp = clamp(c.hp - s.amount, 0, c.hpMax);
        log.push({
          kind: 'action',
          actor: c.id,
          verb: `status_${s.type}`,
          amount: s.amount,
          at: state.turn,
        });
      }
      const remain = s.turnsLeft - 1;
      if (remain > 0) nextStatuses.push({ ...s, turnsLeft: remain });
    }
    c.statuses = nextStatuses;
    if (!alive(c)) log.push({ kind: 'downed', combatant: c.id, at: state.turn });
  }
  return log;
}

// ---------- Stepping ----------

function pickNextActor(state: CombatState): Combatant | null {
  const alive = state.combatants.filter((c) => c.hp > 0);
  if (alive.length === 0) return null;
  return alive.reduce((a, b) => (b.timelinePosition < a.timelinePosition ? b : a));
}

function actionCost(actor: Combatant): number {
  const speed = Math.max(1, actor.stats.speed);
  return Math.round(BASE_ACTION_COST / (speed / 10));
}

export function stepCombat(state: CombatState, rng: RNG): CombatState {
  if (state.outcome !== 'ongoing') return state;
  const next: CombatState = {
    ...state,
    combatants: state.combatants.map((c) => ({
      ...c,
      statuses: c.statuses.map((s) => ({ ...s })),
      zirs: c.zirs.map((z) => ({ ...z })),
    })),
    log: [...state.log],
  };

  const actor = pickNextActor(next);
  if (!actor) return next;

  // Tick status effects at the top of the actor's turn.
  const statusLog = tickStatuses([actor], next);
  next.log.push(...statusLog);

  // Tick zir cooldowns
  for (const z of actor.zirs) {
    if (z.cooldownLeft > 0) z.cooldownLeft -= 1;
  }

  if (alive(actor)) {
    const action = chooseAction(next, actor, rng);
    const log = applyAction(next, action, rng);
    next.log.push(...log);
  }

  actor.timelinePosition += actionCost(actor);
  next.turn += 1;

  // Outcome check
  if (enemiesOf(next, 'ally').length === 0) next.outcome = 'victory';
  else if (alliesOf(next, 'ally').length === 0) next.outcome = 'defeat';
  if (next.outcome !== 'ongoing') next.log.push({ kind: 'end', outcome: next.outcome, at: next.turn });

  return next;
}

export function runCombatToCompletion(
  setup: CombatSetup,
  seed: number,
  maxTurns = 400,
): CombatState {
  const rng = createRng(seed);
  let state = buildCombat(setup);
  let i = 0;
  while (state.outcome === 'ongoing' && i < maxTurns) {
    state = stepCombat(state, rng);
    i++;
  }
  if (state.outcome === 'ongoing') {
    state = { ...state, outcome: 'flee' };
    state.log.push({ kind: 'end', outcome: 'flee', at: state.turn });
  }
  return state;
}
