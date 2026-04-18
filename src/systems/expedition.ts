import type {
  ExpeditionNode,
  ExpeditionEdge,
  ExpeditionRun,
  ExpeditionTemplate,
  NodeType,
} from '../types/domain';
import { createRng, type RNG } from './rng';

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

// Builds the runtime ExpeditionRun from a template's layout graph.
// Preserves node IDs from the layout so edges stay valid.
export function generateExpedition(
  template: ExpeditionTemplate,
  seed: number,
): ExpeditionRun {
  const rng = createRng(seed);
  const nodes: ExpeditionNode[] = [];
  if (!template.layout) {
    throw new Error(
      `Template ${template.id} has no legacy layout — use generateExpeditionRun (tile grid) instead.`,
    );
  }
  const layout = template.layout;
  const edges: ExpeditionEdge[] = layout.edges.map((e) => ({ ...e }));

  layout.nodes.forEach((layoutNode, i) => {
    const type = layoutNode.type;
    const label = layoutNode.label ?? DEFAULT_LABEL[type] ?? 'Узел';
    const node: ExpeditionNode = { id: layoutNode.id, type, label };

    if (type === 'combat') {
      node.combat = {
        enemyTemplateIds: pickCombatGroup(rng.fork(i * 7 + 1), template.combatPool, false),
      };
    } else if (type === 'elite') {
      node.combat = {
        enemyTemplateIds: pickCombatGroup(rng.fork(i * 11 + 3), template.combatPool, true),
      };
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
  });

  return {
    templateId: template.id,
    seed,
    nodes,
    edges,
    currentNodeId: layout.startNodeId,
    visitedNodeIds: [layout.startNodeId],
    provisions: 5,
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

// Orders nodes in topological/reachable order from start. Useful for UI rendering
// so branching paths read in a sensible sequence instead of template definition order.
export function orderedNodeIds(run: ExpeditionRun): string[] {
  const outgoing = new Map<string, string[]>();
  for (const e of run.edges) {
    const arr = outgoing.get(e.from) ?? [];
    arr.push(e.to);
    outgoing.set(e.from, arr);
  }
  const startId = run.nodes[0]?.id;
  if (!startId) return [];
  const order: string[] = [];
  const seen = new Set<string>();
  // Depth-first from start; deterministic ordering matches edge definition.
  const walk = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    order.push(id);
    for (const next of outgoing.get(id) ?? []) walk(next);
  };
  walk(startId);
  // Append any orphans (shouldn't happen but defensive).
  for (const n of run.nodes) if (!seen.has(n.id)) order.push(n.id);
  return order;
}
