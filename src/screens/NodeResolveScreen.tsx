import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { getEvent } from '../data/events';
import { rollLoot } from '../systems/items';
import { createRng } from '../systems/rng';
import type { ItemInstance } from '../types/domain';
import type { ScreenProps } from '../navigation/types';

export function NodeResolveScreen({ navigation, route }: ScreenProps<'NodeResolve'>) {
  const { nodeId } = route.params;
  const run = useGame((s) => s.currentRun);
  const stashRaidLoot = useGame((s) => s.stashRaidLoot);
  const extractRunSucceeded = useGame((s) => s.extractRunSucceeded);

  const node = run?.nodes.find((n) => n.id === nodeId);

  const [resolved, setResolved] = useState(false);
  const [resultMsg, setResultMsg] = useState<string>('');
  const [resultLoot, setResultLoot] = useState<ItemInstance[]>([]);

  const rng = useMemo(
    () => createRng((run?.seed ?? 1) ^ nodeId.charCodeAt(1) ^ 0xcafe),
    [run?.seed, nodeId],
  );

  if (!run || !node) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>Нет узла.</Text>
      </Screen>
    );
  }

  const goBackToMap = () => {
    if (resultLoot.length > 0) stashRaidLoot(resultLoot);
    navigation.replace('ExpeditionMap');
  };

  // ----- Treasure -----
  if (node.type === 'treasure') {
    if (!resolved) {
      return (
        <Screen>
          <Text style={typography.h2}>{node.label}</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
            Старый сундук, покрытый пылью.
          </Text>
          <View style={{ height: spacing.lg }} />
          <Button
            label="Открыть"
            onPress={() => {
              const loot = rollLoot(node.treasure!.lootTableId, rng, 'raid');
              setResultMsg('Вы нашли:');
              setResultLoot(loot);
              setResolved(true);
            }}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <Text style={typography.h2}>{resultMsg || 'Сундук открыт'}</Text>
        <View style={{ height: spacing.md }} />
        {resultLoot.map((inst) => (
          <LootRow key={inst.item.id} inst={inst} />
        ))}
        <View style={{ height: spacing.lg }} />
        <Button label="Продолжить" onPress={goBackToMap} />
      </Screen>
    );
  }

  // ----- Event -----
  if (node.type === 'event' && node.event) {
    const event = getEvent(node.event.eventId);
    if (!resolved) {
      return (
        <Screen>
          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
            <Text style={typography.h2}>{event.title}</Text>
            <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
              {event.description}
            </Text>
            <View style={{ height: spacing.lg }} />
            {event.choices.map((c) => (
              <View key={c.id} style={{ marginBottom: spacing.sm }}>
                <Button
                  label={c.label}
                  variant="secondary"
                  onPress={() => {
                    const r = c.apply(rng);
                    setResultMsg(r.message);
                    setResultLoot(r.loot ?? []);
                    setResolved(true);
                  }}
                />
              </View>
            ))}
          </ScrollView>
        </Screen>
      );
    }
    return (
      <Screen>
        <Text style={typography.h2}>{event.title}</Text>
        <View style={{ height: spacing.md }} />
        <Text style={[typography.body, { color: colors.text }]}>{resultMsg}</Text>
        <View style={{ height: spacing.md }} />
        {resultLoot.map((inst) => (
          <LootRow key={inst.item.id} inst={inst} />
        ))}
        <View style={{ height: spacing.lg }} />
        <Button label="Продолжить" onPress={goBackToMap} />
      </Screen>
    );
  }

  // ----- Extraction -----
  if (node.type === 'extraction') {
    return (
      <Screen>
        <Text style={typography.h2}>Выход на поверхность</Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
          Вы добрались до выхода. Пора уносить добычу в крепость.
        </Text>
        <View style={{ height: spacing.md }} />
        <View style={styles.summary}>
          <Text style={[typography.body, { color: colors.text }]}>
            Собрано: {run.raidLoot.length} предметов
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
            Нестабильность портала: {run.portalInstability}/{run.nodes.length}
          </Text>
        </View>
        <View style={{ height: spacing.lg }} />
        <Button
          label="Извлечься"
          onPress={() => {
            extractRunSucceeded();
            navigation.reset({ index: 0, routes: [{ name: 'Fortress' }] });
          }}
        />
      </Screen>
    );
  }

  // ----- Start / Rest fallback -----
  return (
    <Screen>
      <Text style={typography.h2}>{node.label}</Text>
      <View style={{ height: spacing.md }} />
      <Button label="Продолжить" onPress={goBackToMap} />
    </Screen>
  );
}

function LootRow({ inst }: { inst: ItemInstance }) {
  return (
    <View style={styles.loot}>
      <Text style={[typography.body, { color: colors.text }]}>{inst.item.name}</Text>
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {inst.item.kind} · {inst.item.rarity}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loot: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
});
