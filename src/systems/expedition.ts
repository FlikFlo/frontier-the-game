import type {
  ExpeditionNode,
  ExpeditionEdge,
  ExpeditionRun,
  ExpeditionTemplate,
  NodeType,
} from '../types/domain';
import { createRng, type RNG } from './rng';

// MVP-1.5: linear path driven by the template's nodeLayout.
// Branching graphs land in MVP-2.

const DEFAULT_LABEL: Record<NodeType, string> = {
  start: 'Вход',
  combat: 'Стычка',
  elite: 'Чемпион',
  boss: 'Босс',
  treasure: 'Сундук',
  event: 'Событие',
  rest: 'Привал',
  extraction: 'Извлечение',
};

function pickCombatGroup(rng: RNG, pool: readonly string[], elite: boolean): string[] {
  const count = elite ? 3 : rng.int(1, 2);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(rng.pick(pool));
  return out;
}

export function generateExpedition(
  template: ExpeditionTemplate,
  seed: number,
): ExpeditionRun {
  const rng = createRng(seed);
  const nodes: ExpeditionNode[] = [];
  const edges: ExpeditionEdge[] = [];

  template.nodeLayout.forEach((type, i) => {
    const id = `n${i}`;
    const label =
      template.nodeLabels?.[i] ?? DEFAULT_LABEL[type] ?? 'Узел';
    const node: ExpeditionNode = { id, type, label };

    if (type === 'combat') {
      node.combat = { enemyTemplateIds: pickCombatGroup(rng.fork(i * 7 + 1), template.combatPool, false) };
    } else if (type === 'elite') {
      node.combat = { enemyTemplateIds: pickCombatGroup(rng.fork(i * 11 + 3), template.combatPool, true) };
    } else if (type === 'boss') {
      node.combat = { enemyTemplateIds: [template.bossTemplateId] };
    } else if (type === 'treasure') {
      node.treasure = { lootTableId: template.chestLootTableId };
    } else if (type === 'event') {
      const pool = template.eventIds ?? ['mine_carving'];
      node.event = { eventId: rng.pick(pool) };
    } else if (type === 'extraction') {
      node.extraction = { difficulty: template.portal ? 2 : 1 };
    }

    nodes.push(node);
    if (i > 0) edges.push({ from: `n${i - 1}`, to: id });
  });

  return {
    templateId: template.id,
    seed,
    nodes,
    edges,
    currentNodeId: nodes[0]!.id,
    visitedNodeIds: [nodes[0]!.id],
    raidLoot: [],
    portalInstability: 0,
    startedAt: 0,
  };
}

export function nextNodeOptions(run: ExpeditionRun): ExpeditionNode[] {
  const out: ExpeditionNode[] = [];
  for (const edge of run.edges) {
    if (edge.from === run.currentNodeId) {
      const node = run.nodes.find((n) => n.id === edge.to);
      if (node) out.push(node);
    }
  }
  return out;
}

export function advanceTo(run: ExpeditionRun, nodeId: string): ExpeditionRun {
  return {
    ...run,
    currentNodeId: nodeId,
    visitedNodeIds: [...run.visitedNodeIds, nodeId],
    portalInstability: run.portalInstability + 1,
  };
}

export function isExtractionNode(run: ExpeditionRun): boolean {
  const node = run.nodes.find((n) => n.id === run.currentNodeId);
  return node?.type === 'extraction';
}
