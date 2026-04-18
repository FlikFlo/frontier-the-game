import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { UnitPortrait } from '../components/UnitPortrait';
import { colors, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { getEnemyTemplate } from '../data/enemies';
import { buildCombat, stepCombat } from '../systems/combat';
import { createRng } from '../systems/rng';
import { makeItem, rollLoot } from '../systems/items';
import type { CombatState, Combatant, CombatLogEntry, FormationRow } from '../types/combat';
import type { ScreenProps } from '../navigation/types';

// Combat pacing: each tick is one in-fiction action.  Slowed compared to the
// MVP-1 number so blows actually land — fights should feel weighty, not like
// a number-tickertape.  Pauses scale up on crits and on death so the camera
// can "land" on the moment.
const TICK_MS = 1500;
const PAUSE_ON_DEATH_MS = 900;
const PAUSE_ON_CRIT_MS = 500;

// Grid definition: each side has two rows (front/back) × 2 columns.
const ROW_ORDER_ENEMY: FormationRow[] = ['back', 'front']; // far → near battle line
const ROW_ORDER_ALLY: FormationRow[] = ['front', 'back']; // near → far

function sigilFor(c: Combatant): string {
  if (c.kind === 'hero') return 'hero';
  if (c.kind === 'companion') {
    // Heuristic: tank/damage stay front, support/control go back — match to tag.
    return c.row === 'back' ? 'companion_support' : 'companion_tank';
  }
  return c.sourceTemplateId ?? 'hero';
}

function FormationGrid({
  combatants,
  rowOrder,
  activeId,
  lastHitId,
  hitFx,
  sideLabel,
}: {
  combatants: Combatant[];
  rowOrder: FormationRow[];
  activeId: string | undefined;
  lastHitId: string | undefined;
  hitFx: HitFx | undefined;
  sideLabel: string;
}) {
  const slotAt = (row: FormationRow, col: number) =>
    combatants.find((c) => c.row === row && c.col === col);

  return (
    <View style={styles.formation}>
      <Text style={styles.sideLabel}>{sideLabel}</Text>
      {rowOrder.map((row) => (
        <View key={row} style={styles.formationRow}>
          {[0, 1].map((col) => {
            const c = slotAt(row, col);
            return c ? (
              <CombatSlot
                key={`${row}-${col}`}
                combatant={c}
                isActor={activeId === c.id}
                wasHit={lastHitId === c.id}
                hitFx={lastHitId === c.id ? hitFx : undefined}
              />
            ) : (
              <View key={`${row}-${col}`} style={[styles.slot, styles.slotEmpty]} />
            );
          })}
        </View>
      ))}
    </View>
  );
}

type HitFx = { amount: number; verb: 'attack' | 'crit' | 'zir_damage' | 'zir_heal' | string };

function CombatSlot({
  combatant,
  isActor,
  wasHit,
  hitFx,
}: {
  combatant: Combatant;
  isActor: boolean;
  wasHit: boolean;
  hitFx?: HitFx;
}) {
  const flash = useSharedValue(0);
  const hitShake = useSharedValue(0);
  const damageY = useSharedValue(0);
  const damageOpacity = useSharedValue(0);
  const damageScale = useSharedValue(1);

  useEffect(() => {
    if (isActor) {
      flash.value = withTiming(1, { duration: 120 });
      setTimeout(() => {
        flash.value = withTiming(0, { duration: 600 });
      }, 120);
    }
  }, [isActor, flash]);

  useEffect(() => {
    if (wasHit) {
      hitShake.value = withSequence(
        withTiming(-4, { duration: 60 }),
        withTiming(4, { duration: 60 }),
        withTiming(-3, { duration: 60 }),
        withTiming(0, { duration: 100 }),
      );
      // Floating number rises and fades.
      damageY.value = 0;
      damageOpacity.value = 1;
      damageScale.value = hitFx?.verb === 'crit' ? 1.5 : 1;
      damageY.value = withTiming(-50, { duration: 1100 });
      damageOpacity.value = withTiming(0, { duration: 1100 });
    }
  }, [wasHit, damageY, damageOpacity, damageScale, hitShake, hitFx?.verb]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: hitShake.value }, { scale: 1 + flash.value * 0.04 }],
    borderColor: flash.value > 0.3 ? colors.accentBright : colors.border,
  }));

  const damageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: damageY.value }, { scale: damageScale.value }],
    opacity: damageOpacity.value,
  }));

  const dead = combatant.hp <= 0;
  const hpPct = combatant.hpMax > 0 ? combatant.hp / combatant.hpMax : 0;
  const isHeal = hitFx?.verb === 'zir_heal';
  const isCrit = hitFx?.verb === 'crit';
  const damageColor = isHeal ? colors.success : isCrit ? colors.accentBright : colors.danger;
  const damagePrefix = isHeal ? '+' : '−';

  return (
    <Animated.View
      style={[
        styles.slot,
        { backgroundColor: combatant.side === 'ally' ? '#24200f' : '#231812' },
        animStyle,
      ]}
    >
      <UnitPortrait
        sigil={sigilFor(combatant)}
        side={combatant.side}
        size={38}
        dim={dead}
      />
      <View style={{ flex: 1, marginLeft: spacing.sm, opacity: dead ? 0.4 : 1 }}>
        <Text numberOfLines={1} style={styles.slotName}>
          {combatant.name}
        </Text>
        <View style={styles.hpTrack}>
          <View
            style={[
              styles.hpFill,
              {
                width: `${hpPct * 100}%`,
                backgroundColor: hpPct > 0.5 ? colors.hp : hpPct > 0.25 ? colors.warn : colors.danger,
              },
            ]}
          />
        </View>
        <View style={styles.slotMetaRow}>
          <Text style={styles.hpText}>
            {combatant.hp}/{combatant.hpMax}
          </Text>
          {combatant.attackRange === 'ranged' ? (
            <Text style={styles.rangeTag}>⇫</Text>
          ) : (
            <Text style={styles.rangeTagMelee}>⚔</Text>
          )}
        </View>
        {combatant.statuses.length > 0 ? (
          <Text style={styles.statuses}>
            {combatant.statuses.map((s) => s.type[0]).join('')}
          </Text>
        ) : null}
      </View>
      {hitFx && hitFx.amount ? (
        <Animated.Text
          pointerEvents="none"
          style={[styles.damageNumber, { color: damageColor }, damageStyle]}
        >
          {damagePrefix}
          {hitFx.amount}
          {isCrit ? '!' : ''}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
}

function formatLog(entry: CombatLogEntry, combatants: Combatant[]): string {
  const nameOf = (id?: string) => (id ? combatants.find((c) => c.id === id)?.name ?? id : '');
  switch (entry.kind) {
    case 'start':
      return '⚔ Бой начинается.';
    case 'action':
      if (entry.verb === 'skip') return `· ${nameOf(entry.actor)} пропускает ход.`;
      if (entry.verb === 'attack')
        return `${nameOf(entry.actor)} → ${nameOf(entry.target)}  −${entry.amount}`;
      if (entry.verb === 'crit')
        return `★ ${nameOf(entry.actor)} → ${nameOf(entry.target)}  −${entry.amount}`;
      if (entry.verb === 'zir_damage')
        return `✧ Зир · ${nameOf(entry.actor)} → ${nameOf(entry.target)}  −${entry.amount}`;
      if (entry.verb === 'zir_heal')
        return `✚ Зир · ${nameOf(entry.actor)} лечит ${nameOf(entry.target)}  +${entry.amount}`;
      if (entry.verb.startsWith('status_'))
        return `· ${nameOf(entry.actor)}: ${entry.verb.slice(7)} −${entry.amount}`;
      return `${nameOf(entry.actor)} действует.`;
    case 'status':
      return `${nameOf(entry.target)} — ${entry.status}.`;
    case 'downed':
      return `☠ ${nameOf(entry.combatant)} пал.`;
    case 'end':
      return entry.outcome === 'victory'
        ? '✦ Победа.'
        : entry.outcome === 'defeat'
          ? '✖ Поражение.'
          : '⇥ Отступление.';
  }
}

export function CombatScreen({ navigation, route }: ScreenProps<'Combat'>) {
  const { nodeId } = route.params;

  const hero = useGame((s) => s.hero);
  const companion = useGame((s) => s.companion);
  const inventory = useGame((s) => s.inventory);
  const run = useGame((s) => s.currentRun);
  const stashRaidLoot = useGame((s) => s.stashRaidLoot);
  const extractRunFailed = useGame((s) => s.extractRunFailed);
  const awardXp = useGame((s) => s.awardXp);
  const clearTileContent = useGame((s) => s.clearTileContent);
  const clearMapNodeContent = useGame((s) => s.clearMapNodeContent);

  // Resolve combat content: prefer overworld map node, then tile, then legacy node.
  const mapNode = run?.map?.nodes.find((n) => n.id === nodeId);
  const tile = run?.grid?.tiles.find((t) => t.id === nodeId);
  const node = run?.nodes.find((n) => n.id === nodeId);

  const enemyIds: string[] | undefined =
    mapNode?.content?.enemyTemplateIds ??
    tile?.content?.enemyTemplateIds ??
    node?.combat?.enemyTemplateIds;
  const tileLabel =
    mapNode?.content?.poiName ?? mapNode?.label ?? tile?.content?.poiName ?? tile?.label;
  const tileFlavor = mapNode?.content?.poiFlavor ?? tile?.content?.poiFlavor;
  const uniqueRewardId =
    mapNode?.content?.uniqueRewardTemplateId ?? tile?.content?.uniqueRewardTemplateId;

  const { initial, seed } = useMemo(() => {
    if (!enemyIds || enemyIds.length === 0) {
      return { initial: null as CombatState | null, seed: 0 };
    }
    const enemies = enemyIds.map((id) => getEnemyTemplate(id));
    const s = buildCombat({
      hero,
      heroInventory: inventory,
      companion,
      enemies,
      tactic: 'balanced',
    });
    return {
      initial: s,
      seed: (run?.seed ?? 1) ^ nodeId.charCodeAt(Math.max(nodeId.length - 1, 0)),
    };
  }, [enemyIds, hero, inventory, companion, run?.seed, nodeId]);

  const [state, setState] = useState<CombatState | null>(initial);
  const [speed, setSpeed] = useState(1);
  const rngRef = useRef(createRng(seed));
  const [lastHitId, setLastHitId] = useState<string | undefined>(undefined);
  const [hitFx, setHitFx] = useState<HitFx | undefined>(undefined);

  useEffect(() => {
    if (!state || state.outcome !== 'ongoing') return;
    // Compute extra pause based on the *previous* tick's events so the
    // camera lingers after a crit or a kill.
    const recent = state.log.slice(-4);
    const wasCrit = recent.some((e) => e.kind === 'action' && e.verb === 'crit');
    const wasDeath = recent.some((e) => e.kind === 'downed');
    const extra = wasDeath ? PAUSE_ON_DEATH_MS : wasCrit ? PAUSE_ON_CRIT_MS : 0;

    const t = setTimeout(() => {
      setState((prev) => {
        if (!prev) return prev;
        const next = stepCombat(prev, rngRef.current);
        for (let i = next.log.length - 1; i >= 0 && i >= next.log.length - 3; i--) {
          const entry = next.log[i];
          if (entry && entry.kind === 'action' && entry.target && entry.amount) {
            setLastHitId(entry.target);
            setHitFx({ amount: entry.amount, verb: entry.verb });
            break;
          }
        }
        return next;
      });
    }, (TICK_MS + extra) / speed);
    return () => clearTimeout(t);
  }, [state, speed]);

  if (!enemyIds || !state) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>Бой недоступен.</Text>
        <Button label="Назад" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const allies = state.combatants.filter((c) => c.side === 'ally');
  const enemies = state.combatants.filter((c) => c.side === 'enemy');
  const alivePriority = state.combatants
    .filter((c) => c.hp > 0)
    .sort((a, b) => a.timelinePosition - b.timelinePosition);
  const activeId = alivePriority[0]?.id;

  const onVictory = () => {
    if (!enemyIds || !run) return;
    let xp = 0;
    const rng = createRng(run.seed ^ nodeId.charCodeAt(0) ^ 0xbeef);
    const loot = enemyIds.flatMap((id) => {
      const tpl = getEnemyTemplate(id);
      xp += tpl.xpReward;
      return tpl.lootTableId ? rollLoot(tpl.lootTableId, rng, 'raid') : [];
    });
    // Named POIs drop a guaranteed unique reward so landmarks feel worth it.
    if (uniqueRewardId) {
      loot.push(makeItem(uniqueRewardId, 'raid'));
    }
    awardXp(xp);
    if (loot.length > 0) stashRaidLoot(loot);
    if (run.map) clearMapNodeContent(nodeId);
    else if (run.grid) clearTileContent(nodeId);
    navigation.replace('ExpeditionMap');
  };

  const onDefeat = () => {
    extractRunFailed('defeat');
    navigation.reset({ index: 0, routes: [{ name: 'Fortress' }] });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3} numberOfLines={1}>
            {tileLabel ?? node?.label ?? 'Бой'}
          </Text>
          {tileFlavor && state.turn < 2 ? (
            <Text
              style={[typography.caption, { color: colors.textMuted, fontStyle: 'italic', marginTop: 2 }]}
              numberOfLines={2}
            >
              {tileFlavor}
            </Text>
          ) : null}
        </View>
        <Text style={[typography.caption, { color: colors.textMuted }]}>Ход {state.turn}</Text>
      </View>

      {/* Battlefield: two formations on a themed stage. */}
      <View style={styles.battlefield}>
        <FormationGrid
          combatants={enemies}
          rowOrder={ROW_ORDER_ENEMY}
          activeId={activeId}
          lastHitId={lastHitId}
          hitFx={hitFx}
          sideLabel="ПРОТИВНИК"
        />

        <View style={styles.battleLine}>
          <View style={styles.battleBar} />
          <Text style={styles.battleLabel}>⚔</Text>
          <View style={styles.battleBar} />
        </View>

        <FormationGrid
          combatants={allies}
          rowOrder={ROW_ORDER_ALLY}
          activeId={activeId}
          lastHitId={lastHitId}
          hitFx={hitFx}
          sideLabel="ВАШ ОТРЯД"
        />
      </View>

      <View style={styles.logBox}>
        <ScrollView
          ref={(r) => r?.scrollToEnd({ animated: false })}
          contentContainerStyle={{ paddingVertical: spacing.sm }}
        >
          {state.log.slice(-10).map((entry, i) => (
            <Animated.Text
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              key={`${entry.at}_${i}`}
              style={styles.logLine}
            >
              {formatLog(entry, state.combatants)}
            </Animated.Text>
          ))}
        </ScrollView>
      </View>

      <View style={styles.controls}>
        <Button
          label={`×${speed === 1 ? 2 : speed === 2 ? 3 : 1}`}
          variant="secondary"
          onPress={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : 1)}
          style={{ flex: 1 }}
        />
        {state.outcome === 'victory' ? (
          <Button label="Далее" onPress={onVictory} style={{ flex: 2 }} />
        ) : state.outcome === 'defeat' ? (
          <Button label="В крепость" variant="danger" onPress={onDefeat} style={{ flex: 2 }} />
        ) : (
          <Button label="Бой..." variant="secondary" disabled onPress={() => {}} style={{ flex: 2 }} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  battlefield: {
    backgroundColor: colors.bgDeep,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  formation: {
    marginVertical: spacing.xs,
  },
  sideLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 3,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  formationRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  slot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
  },
  slotEmpty: {
    borderStyle: 'dashed',
    borderColor: colors.borderLight,
    opacity: 0.35,
    backgroundColor: 'transparent',
  },
  slotName: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  slotMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hpTrack: {
    height: 6,
    marginTop: 3,
    backgroundColor: colors.bgDeep,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  hpFill: { height: 4 },
  hpText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  rangeTag: {
    color: colors.light,
    fontSize: 10,
  },
  rangeTagMelee: {
    color: colors.accentDark,
    fontSize: 10,
  },
  statuses: {
    color: colors.warn,
    fontSize: 10,
    marginTop: 1,
  },
  battleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  battleBar: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderGold,
  },
  battleLabel: {
    color: colors.accentBright,
    fontSize: 20,
    fontFamily: typography.h3.fontFamily,
  },
  logBox: {
    flex: 1,
    minHeight: 90,
    maxHeight: 160,
    backgroundColor: colors.bgDeep,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logLine: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
    marginBottom: 2,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  damageNumber: {
    position: 'absolute',
    top: 4,
    right: 8,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: typography.h1.fontFamily,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 2 },
    pointerEvents: 'none',
  },
});
