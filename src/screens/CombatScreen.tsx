import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Button } from '../components/Button';
import { Bar } from '../components/Bar';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { getEnemyTemplate } from '../data/enemies';
import { buildCombat, stepCombat } from '../systems/combat';
import { createRng } from '../systems/rng';
import { rollLoot } from '../systems/items';
import type { CombatState, Combatant, CombatLogEntry } from '../types/combat';
import type { ScreenProps } from '../navigation/types';

const TICK_MS = 700;

function CombatantCard({ c, isActor }: { c: Combatant; isActor: boolean }) {
  const flash = useSharedValue(0);

  useEffect(() => {
    if (isActor) {
      flash.value = 1;
      flash.value = withTiming(0, { duration: 400 });
    }
  }, [isActor, flash]);

  const style = useAnimatedStyle(() => ({
    borderColor: flash.value > 0 ? colors.accent : c.side === 'ally' ? colors.ally : colors.enemy,
    transform: [{ scale: 1 + flash.value * 0.03 }],
  }));

  const dead = c.hp <= 0;

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: dead ? 0.3 : 1 },
        style,
      ]}
    >
      <Text style={[typography.body, { color: c.side === 'ally' ? colors.ally : colors.enemy }]} numberOfLines={1}>
        {c.name}
      </Text>
      <View style={{ height: 4 }} />
      <Bar value={c.hp} max={c.hpMax} color={colors.hp} compact />
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
        HP {c.hp}/{c.hpMax}
      </Text>
      {c.statuses.length > 0 ? (
        <Text style={[typography.caption, { color: colors.warn, marginTop: 2 }]}>
          {c.statuses.map((s) => s.type).join(', ')}
        </Text>
      ) : null}
    </Animated.View>
  );
}

function formatLog(entry: CombatLogEntry, combatants: Combatant[]): string {
  const nameOf = (id?: string) => (id ? combatants.find((c) => c.id === id)?.name ?? id : '');
  switch (entry.kind) {
    case 'start':
      return 'Бой начинается.';
    case 'action':
      if (entry.verb === 'skip') return `${nameOf(entry.actor)} пропускает ход.`;
      if (entry.verb === 'attack') return `${nameOf(entry.actor)} атакует ${nameOf(entry.target)} (-${entry.amount}).`;
      if (entry.verb === 'crit') return `${nameOf(entry.actor)} КРИТ по ${nameOf(entry.target)} (-${entry.amount})!`;
      if (entry.verb === 'zir_damage')
        return `${nameOf(entry.actor)} активирует Зир по ${nameOf(entry.target)} (-${entry.amount}).`;
      if (entry.verb === 'zir_heal')
        return `${nameOf(entry.actor)} исцеляет ${nameOf(entry.target)} (+${entry.amount}).`;
      if (entry.verb.startsWith('status_'))
        return `${nameOf(entry.actor)} страдает от ${entry.verb.slice(7)} (-${entry.amount}).`;
      return `${nameOf(entry.actor)} действует.`;
    case 'status':
      return `${nameOf(entry.target)} получает ${entry.status}.`;
    case 'downed':
      return `${nameOf(entry.combatant)} падает!`;
    case 'end':
      return entry.outcome === 'victory'
        ? 'Победа.'
        : entry.outcome === 'defeat'
          ? 'Поражение.'
          : 'Отступление.';
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

  const node = run?.nodes.find((n) => n.id === nodeId);

  const { initial, seed } = useMemo(() => {
    if (!node || !node.combat) {
      return { initial: null as CombatState | null, seed: 0 };
    }
    const enemies = node.combat.enemyTemplateIds.map((id) => getEnemyTemplate(id));
    const s = buildCombat({
      hero,
      heroInventory: inventory,
      companion,
      enemies,
      tactic: 'balanced',
    });
    return { initial: s, seed: (run?.seed ?? 1) ^ nodeId.charCodeAt(1) };
  }, [node, hero, inventory, companion, run?.seed, nodeId]);

  const [state, setState] = useState<CombatState | null>(initial);
  const [speed, setSpeed] = useState(1);
  const rngRef = useRef(createRng(seed));

  useEffect(() => {
    if (!state || state.outcome !== 'ongoing') return;
    const t = setTimeout(() => {
      setState((prev) => (prev ? stepCombat(prev, rngRef.current) : prev));
    }, TICK_MS / speed);
    return () => clearTimeout(t);
  }, [state, speed]);

  if (!node || !state) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>Бой недоступен.</Text>
        <Button label="Назад" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const allies = state.combatants.filter((c) => c.side === 'ally');
  const enemies = state.combatants.filter((c) => c.side === 'enemy');
  const actor = state.combatants.reduce(
    (a, b) => (a && a.hp > 0 && a.timelinePosition <= b.timelinePosition ? a : b.hp > 0 ? b : a),
    undefined as Combatant | undefined,
  );

  const onVictory = () => {
    if (!node.combat || !run) return;
    // Total XP + loot roll
    let xp = 0;
    const rng = createRng(run.seed ^ node.id.charCodeAt(1) ^ 0xbeef);
    const loot = node.combat.enemyTemplateIds.flatMap((id) => {
      const tpl = getEnemyTemplate(id);
      xp += tpl.xpReward;
      return tpl.lootTableId ? rollLoot(tpl.lootTableId, rng, 'raid') : [];
    });
    awardXp(xp);
    if (loot.length > 0) stashRaidLoot(loot);
    navigation.replace('ExpeditionMap');
  };

  const onDefeat = () => {
    extractRunFailed('defeat');
    navigation.reset({ index: 0, routes: [{ name: 'Fortress' }] });
  };

  return (
    <Screen>
      <View style={{ marginBottom: spacing.md }}>
        <Text style={typography.h2}>{node.label}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>Ход {state.turn}</Text>
      </View>

      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
        Враги
      </Text>
      <View style={styles.row}>
        {enemies.map((c) => (
          <CombatantCard key={c.id} c={c} isActor={actor?.id === c.id} />
        ))}
      </View>

      <View style={{ height: spacing.md }} />
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
        Наши
      </Text>
      <View style={styles.row}>
        {allies.map((c) => (
          <CombatantCard key={c.id} c={c} isActor={actor?.id === c.id} />
        ))}
      </View>

      <View style={{ height: spacing.md }} />

      <View style={styles.logBox}>
        <ScrollView
          ref={(r) => r?.scrollToEnd({ animated: false })}
          contentContainerStyle={{ paddingVertical: spacing.sm }}
        >
          {state.log.slice(-14).map((entry, i) => (
            <Animated.Text
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              key={`${entry.at}_${i}`}
              style={[typography.caption, { color: colors.textMuted, paddingHorizontal: spacing.sm, marginBottom: 2 }]}
            >
              {formatLog(entry, state.combatants)}
            </Animated.Text>
          ))}
        </ScrollView>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <Button
          label={`×${speed === 1 ? 2 : speed === 2 ? 3 : 1}`}
          variant="secondary"
          onPress={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : 1)}
          style={{ flex: 1 }}
        />
        {state.outcome === 'victory' ? (
          <Button label="Далее" onPress={onVictory} style={{ flex: 2 }} />
        ) : state.outcome === 'defeat' ? (
          <Button label="Вернуться в крепость" variant="danger" onPress={onDefeat} style={{ flex: 2 }} />
        ) : (
          <Button label="Идёт бой..." variant="secondary" disabled onPress={() => {}} style={{ flex: 2 }} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    padding: spacing.sm,
    borderWidth: 2,
    borderRadius: radii.md,
    backgroundColor: colors.bgCard,
  },
  logBox: {
    flex: 1,
    minHeight: 120,
    maxHeight: 200,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
