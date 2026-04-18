import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { colors, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { getEvent } from '../data/events';
import { makeItem, rollLoot } from '../systems/items';
import { createRng } from '../systems/rng';
import type { ItemInstance } from '../types/domain';
import type { ScreenProps } from '../navigation/types';

export function NodeResolveScreen({ navigation, route }: ScreenProps<'NodeResolve'>) {
  const { nodeId } = route.params;
  const run = useGame((s) => s.currentRun);
  const stashRaidLoot = useGame((s) => s.stashRaidLoot);
  const extractRunSucceeded = useGame((s) => s.extractRunSucceeded);
  const clearTileContent = useGame((s) => s.clearTileContent);

  // Resolve to either a legacy node or a grid tile.
  const tile = run?.grid?.tiles.find((t) => t.id === nodeId);
  const legacyNode = run?.nodes.find((n) => n.id === nodeId);

  type ResolvedNode = {
    type: 'treasure' | 'event' | 'extraction' | 'rest' | 'cartographer' | 'start';
    label: string;
    treasure?: { lootTableId: string };
    event?: { eventId: string };
  };

  const node: ResolvedNode | undefined = tile
    ? {
        type:
          tile.type === 'treasure' ||
          tile.type === 'event' ||
          tile.type === 'extraction' ||
          tile.type === 'rest' ||
          tile.type === 'cartographer'
            ? tile.type
            : 'start',
        label: tile.label ?? tile.type,
        treasure:
          tile.type === 'treasure' && tile.content?.lootTableId
            ? { lootTableId: tile.content.lootTableId }
            : undefined,
        event:
          tile.type === 'event' && tile.content?.eventId
            ? { eventId: tile.content.eventId }
            : undefined,
      }
    : legacyNode
      ? ({
          type: legacyNode.type as ResolvedNode['type'],
          label: legacyNode.label,
          treasure: legacyNode.treasure,
          event: legacyNode.event,
        } as ResolvedNode)
      : undefined;

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
    if (tile) clearTileContent(nodeId);
    navigation.replace('ExpeditionMap');
  };

  // ----- Treasure -----
  if (node.type === 'treasure') {
    const poiName = tile?.content?.poiName;
    const poiFlavor = tile?.content?.poiFlavor;
    const uniqueReward = tile?.content?.uniqueRewardTemplateId;
    if (!resolved) {
      return (
        <Screen>
          <Text style={typography.h2}>{poiName ?? node.label}</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, fontStyle: poiFlavor ? 'italic' : 'normal' }]}>
            {poiFlavor ?? 'Старый сундук, покрытый пылью.'}
          </Text>
          <View style={{ height: spacing.lg }} />
          <Button
            label="Осмотреть"
            onPress={() => {
              const loot = rollLoot(node.treasure!.lootTableId, rng, 'raid');
              if (uniqueReward) loot.push(makeItem(uniqueReward, 'raid'));
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
        <Text style={typography.h2}>{poiName ?? (resultMsg || 'Сундук открыт')}</Text>
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
