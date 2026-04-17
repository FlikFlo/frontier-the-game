import type {
  ExpeditionNode,
  ExpeditionEdge,
  ExpeditionRun,
  ExpeditionTemplate,
  NodeType,
} from '../types/domain';
import { createRng, type RNG } from './rng';

// MVP-1: linear path with 6 nodes ending in extraction.
// MVP-2: branching graph, multiple extraction points.

const MINE_POOL = {
  combat: ['mine_rat', 'stone_beetle', 'rogue_miner', 'ore_elemental'] as const,
  boss: 'ancient_golem' as const,
};

function pickCombatGroup(rng: RNG, elite: boolean): string[] {
  const pool = [...MINE_POOL.combat];
  const count = elite ? 3 : rng.int(1, 2);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(rng.pick(pool));
  return out;
}

function makeNode(id: string, type: NodeType, label: string): ExpeditionNode {
  return { id, type, label };
}

export function generateExpedition(
  template: ExpeditionTemplate,
  seed: number,
): ExpeditionRun {
  const rng = createRng(seed);
  const nodes: ExpeditionNode[] = [];
  const edges: ExpeditionEdge[] = [];

  // Linear plan for MVP-1
  const plan: { type: NodeType; label: string }[] = [
    { type: 'start', label: 'Вход в шахту' },
    { type: 'combat', label: 'Стычка' },
    { type: 'event', label: 'Странный символ' },
    { type: 'combat', label: 'Засада' },
    { type: 'treasure', label: 'Заброшенный сундук' },
    { type: 'boss', label: 'Древний голем' },
    { type: 'extraction', label: 'Выход на поверхность' },
  ];

  plan.forEach((p, i) => {
    const id = `n${i}`;
    const node = makeNode(id, p.type, p.label);
    if (p.type === 'combat') {
      node.combat = { enemyTemplateIds: pickCombatGroup(rng.fork(i * 7 + 1), false) };
    } else if (p.type === 'boss') {
      node.combat = { enemyTemplateIds: [MINE_POOL.boss] };
    } else if (p.type === 'treasure') {
      node.treasure = { lootTableId: 'chest_mine' };
    } else if (p.type === 'event') {
      node.event = { eventId: 'mine_carving' };
    } else if (p.type === 'extraction') {
      node.extraction = { difficulty: 1 };
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
