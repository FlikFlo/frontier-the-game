import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { Bar } from '../components/Bar';
import { colors, radii, spacing, typography } from '../theme/colors';
import { useGame } from '../state/store';
import { nextNodeOptions } from '../systems/expedition';
import { getExpeditionTemplate } from '../data/expeditions';
import type { ExpeditionNode, NodeType } from '../types/domain';
import type { ScreenProps } from '../navigation/types';

const NODE_ICON: Record<NodeType, string> = {
  start: '●',
  combat: '⚔',
  elite: '☠',
  boss: '♛',
  treasure: '✦',
  event: '?',
  rest: '♨',
  extraction: '⇪',
};

const NODE_COLOR: Record<NodeType, string> = {
  start: colors.textMuted,
  combat: colors.danger,
  elite: colors.warn,
  boss: colors.fire,
  treasure: colors.accent,
  event: colors.air,
  rest: colors.success,
  extraction: colors.hero,
};

function NodeRow({
  node,
  visited,
  current,
  nextAvailable,
  onPress,
}: {
  node: ExpeditionNode;
  visited: boolean;
  current: boolean;
  nextAvailable: boolean;
  onPress?: () => void;
}) {
  const color = NODE_COLOR[node.type];
  const icon = NODE_ICON[node.type];
  const state = current ? 'current' : visited ? 'visited' : nextAvailable ? 'available' : 'future';

  return (
    <View style={[styles.nodeRow, state === 'current' && styles.nodeCurrent]}>
      <View style={[styles.nodeIcon, { borderColor: color, backgroundColor: state === 'future' ? colors.bg : colors.bgCard }]}>
        <Text style={{ color, fontSize: 22, fontWeight: '700' }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.body, { color: state === 'future' ? colors.textDim : colors.text }]}>
          {node.label}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {state === 'current' ? 'Вы здесь' : state === 'visited' ? 'Пройдено' : state === 'available' ? 'Доступно' : 'Дальше'}
        </Text>
      </View>
      {state === 'available' && onPress ? <Button label="Идти" onPress={onPress} /> : null}
    </View>
  );
}

export function ExpeditionMapScreen({ navigation }: ScreenProps<'ExpeditionMap'>) {
  const run = useGame((s) => s.currentRun);
  const advanceToNode = useGame((s) => s.advanceToNode);
  const extractRunFailed = useGame((s) => s.extractRunFailed);

  if (!run) {
    return (
      <Screen>
        <Text style={[typography.body, { color: colors.text }]}>Нет активной вылазки.</Text>
        <View style={{ height: spacing.md }} />
        <Button label="В крепость" onPress={() => navigation.navigate('Fortress')} />
      </Screen>
    );
  }

  const template = getExpeditionTemplate(run.templateId);
  const available = new Set(nextNodeOptions(run).map((n) => n.id));
  const visited = new Set(run.visitedNodeIds);
  const instabilityMax = run.nodes.length; // 1 per visited
  const hasBranching = available.size > 1;

  const goTo = (node: ExpeditionNode) => {
    advanceToNode(node.id);
    if (node.type === 'combat' || node.type === 'boss' || node.type === 'elite') {
      navigation.navigate('Combat', { nodeId: node.id });
    } else {
      navigation.navigate('NodeResolve', { nodeId: node.id });
    }
  };

  const flee = () => {
    extractRunFailed('flee');
    navigation.navigate('Fortress');
  };

  return (
    <Screen>
      <View style={{ marginBottom: spacing.md }}>
        <Text style={typography.h2}>{template.name}</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
          Собрано: {run.raidLoot.length} предм. · Посещено узлов: {run.visitedNodeIds.length}
        </Text>
        <View style={{ height: spacing.sm }} />
        <Bar
          value={run.portalInstability}
          max={instabilityMax}
          color={colors.warn}
          label="Нестабильность портала"
        />
        {hasBranching ? (
          <Text style={[typography.caption, { color: colors.accent, marginTop: spacing.xs }]}>
            Развилка: выбери путь.
          </Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {run.nodes.map((node) => (
          <NodeRow
            key={node.id}
            node={node}
            visited={visited.has(node.id)}
            current={node.id === run.currentNodeId}
            nextAvailable={available.has(node.id)}
            onPress={() => goTo(node)}
          />
        ))}
      </ScrollView>

      <View style={{ marginTop: spacing.md }}>
        <Button label="Отступить (потеря рейдовой добычи)" variant="danger" onPress={flee} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nodeCurrent: {
    borderColor: colors.accent,
    backgroundColor: colors.bgElevated,
  },
  nodeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
