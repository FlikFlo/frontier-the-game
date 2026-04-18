// Generates a hand-shaped overworld map per expedition: nodes at fixed
// "sockets" positioned over an illustrated backdrop, connected by edges.
// The *layout* is fixed per expedition template (so players learn the
// geography); node *content* (which sockets become combat / treasure /
// POI) is rerolled each run.

import type {
  ExpeditionRun,
  ExpeditionTemplate,
  MapEdge,
  MapNode,
  OverworldMap,
  SceneKind,
  TileType,
} from '../types/domain';
import { poisForTemplate, type Poi } from '../data/pois';
import { createRng, type RNG } from './rng';

type Socket = {
  id: string;
  x: number;
  y: number;
  // What kinds of content may be assigned to this socket.
  role: 'start' | 'boss' | 'extract' | 'combat' | 'elite' | 'treasure' | 'event' | 'rest' | 'cartographer' | 'flex';
};

type MapTemplate = {
  scene: SceneKind;
  viewWidth: number;
  viewHeight: number;
  sockets: Socket[];
  edges: { from: string; to: string }[];
  startId: string;
};

// ---------- Hand-authored templates ----------

const MINE_TEMPLATE: MapTemplate = {
  scene: 'mine',
  viewWidth: 1000,
  viewHeight: 700,
  // 10 sockets over the 1000x700 cave art
  sockets: [
    { id: 's0', x: 490, y: 230, role: 'start' },         // entrance
    { id: 's1', x: 270, y: 330, role: 'combat' },         // upper-left gallery
    { id: 's2', x: 490, y: 310, role: 'flex' },           // central upper
    { id: 's3', x: 720, y: 330, role: 'combat' },         // upper-right gallery
    { id: 's4', x: 360, y: 440, role: 'treasure' },       // mid-left chamber
    { id: 's5', x: 640, y: 440, role: 'flex' },           // mid-right chamber
    { id: 's6', x: 250, y: 610, role: 'extract' },        // lower-left exit
    { id: 's7', x: 500, y: 600, role: 'boss' },           // deep center — boss
    { id: 's8', x: 760, y: 615, role: 'extract' },        // lower-right exit
    { id: 's9', x: 830, y: 460, role: 'cartographer' },   // hidden alcove
  ],
  edges: [
    { from: 's0', to: 's1' },
    { from: 's0', to: 's2' },
    { from: 's0', to: 's3' },
    { from: 's1', to: 's4' },
    { from: 's2', to: 's4' },
    { from: 's2', to: 's5' },
    { from: 's3', to: 's5' },
    { from: 's3', to: 's9' },
    { from: 's4', to: 's6' },
    { from: 's4', to: 's7' },
    { from: 's5', to: 's7' },
    { from: 's5', to: 's9' },
    { from: 's9', to: 's8' },
    { from: 's7', to: 's8' },
    { from: 's7', to: 's6' },
  ],
  startId: 's0',
};

const EMERALD_TEMPLATE: MapTemplate = {
  scene: 'emerald_reach',
  viewWidth: 1000,
  viewHeight: 700,
  sockets: [
    { id: 's0', x: 500, y: 180, role: 'start' },
    { id: 's1', x: 240, y: 210, role: 'combat' },
    { id: 's2', x: 760, y: 210, role: 'combat' },
    { id: 's3', x: 330, y: 390, role: 'treasure' },
    { id: 's4', x: 500, y: 360, role: 'flex' },
    { id: 's5', x: 670, y: 390, role: 'combat' },
    { id: 's6', x: 180, y: 500, role: 'elite' },
    { id: 's7', x: 820, y: 500, role: 'elite' },
    { id: 's8', x: 320, y: 610, role: 'extract' },
    { id: 's9', x: 500, y: 620, role: 'boss' },
    { id: 's10', x: 680, y: 610, role: 'extract' },
    { id: 's11', x: 900, y: 370, role: 'cartographer' },
    { id: 's12', x: 100, y: 380, role: 'event' },
  ],
  edges: [
    { from: 's0', to: 's1' },
    { from: 's0', to: 's2' },
    { from: 's0', to: 's4' },
    { from: 's1', to: 's3' },
    { from: 's1', to: 's12' },
    { from: 's2', to: 's5' },
    { from: 's2', to: 's11' },
    { from: 's3', to: 's4' },
    { from: 's4', to: 's5' },
    { from: 's3', to: 's6' },
    { from: 's5', to: 's7' },
    { from: 's6', to: 's8' },
    { from: 's6', to: 's9' },
    { from: 's7', to: 's9' },
    { from: 's7', to: 's10' },
    { from: 's11', to: 's7' },
    { from: 's12', to: 's6' },
    { from: 's9', to: 's8' },
    { from: 's9', to: 's10' },
  ],
  startId: 's0',
};

const TEMPLATES: Record<string, MapTemplate> = {
  mine_of_virdite: MINE_TEMPLATE,
  emerald_reach: EMERALD_TEMPLATE,
};

// ---------- Content assignment ----------

// How a socket's declared role gets turned into a TileType for content
// scattering. 'flex' sockets can become almost anything.
function assignType(role: Socket['role'], rng: RNG): TileType {
  switch (role) {
    case 'start':
      return 'portal';
    case 'boss':
      return 'boss';
    case 'extract':
      return 'extraction';
    case 'combat':
      return 'combat';
    case 'elite':
      return rng.chance(0.6) ? 'elite' : 'combat';
    case 'treasure':
      return 'treasure';
    case 'event':
      return 'event';
    case 'rest':
      return 'rest';
    case 'cartographer':
      return 'cartographer';
    case 'flex': {
      const r = rng.next();
      if (r < 0.25) return 'treasure';
      if (r < 0.5) return 'event';
      if (r < 0.75) return 'combat';
      return 'rest';
    }
  }
}

function shuffled<T>(arr: readonly T[], rng: RNG): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function generateOverworldRun(
  template: ExpeditionTemplate,
  seed: number,
): ExpeditionRun {
  const mapTpl = TEMPLATES[template.id];
  if (!mapTpl) {
    throw new Error(`No overworld template for expedition ${template.id}`);
  }
  const rng = createRng(seed);

  // Build nodes from sockets.
  const startTile = mapTpl.sockets.find((s) => s.id === mapTpl.startId)!;
  const distance = (s: Socket) =>
    Math.hypot(s.x - startTile.x, s.y - startTile.y);
  const maxDist = Math.max(...mapTpl.sockets.map((s) => distance(s)));

  const nodes: MapNode[] = mapTpl.sockets.map((s) => {
    const type = assignType(s.role, rng.fork(parseInt(s.id.slice(1), 10) * 31 + 7));
    return {
      id: s.id,
      x: s.x,
      y: s.y,
      type,
      discovered: s.role === 'start',
      visited: s.role === 'start',
    };
  });

  // Difficulty-scaled combat scattering (similar to tile version).
  const poolFor = (n: MapNode, elite: boolean): string[] => {
    const d = Math.hypot(n.x - startTile.x, n.y - startTile.y);
    const depth = maxDist === 0 ? 0 : d / maxDist;
    const basePool = template.combatPool;
    const startIdx = Math.floor(depth * (basePool.length - 1) * 0.5);
    const weighted = basePool.slice(startIdx);
    const count = elite ? 3 : rng.int(1, 2) + (depth > 0.6 ? 1 : 0);
    const ids: string[] = [];
    for (let i = 0; i < count; i++) ids.push(rng.pick(weighted));
    return ids;
  };

  // Populate content.
  for (const n of nodes) {
    if (n.type === 'combat') {
      n.content = { enemyTemplateIds: poolFor(n, false) };
      n.label = 'Стычка';
    } else if (n.type === 'elite') {
      n.content = { enemyTemplateIds: poolFor(n, true) };
      n.label = 'Элитный отряд';
    } else if (n.type === 'boss') {
      n.content = { enemyTemplateIds: [template.bossTemplateId] };
      n.label = 'Логово босса';
    } else if (n.type === 'treasure') {
      n.content = { lootTableId: template.chestLootTableId };
      n.label = 'Сокровище';
    } else if (n.type === 'event') {
      const pool = template.eventIds ?? ['mine_carving'];
      n.content = { eventId: rng.pick(pool) };
      n.label = 'Событие';
    } else if (n.type === 'rest') {
      n.label = 'Привал';
    } else if (n.type === 'cartographer') {
      n.content = { cartographerRadius: 2 };
      n.label = 'Картограф';
    } else if (n.type === 'extraction') {
      n.label = 'Точка извлечения';
    } else if (n.type === 'portal') {
      n.label = 'Врата портала';
    }
  }

  // Layer named POIs onto appropriate nodes (overwrite content/label).
  const poiPool = poisForTemplate(template.id);
  const eligibleTypes: Record<Poi['tileType'], MapNode[]> = {
    combat: [],
    elite: [],
    treasure: [],
    event: [],
  };
  for (const n of nodes) {
    if (n.type in eligibleTypes) {
      (eligibleTypes as any)[n.type].push(n);
    }
  }
  const claimed = new Set<string>();
  for (const poi of shuffled(poiPool, rng).slice(0, 4)) {
    const candidates = (eligibleTypes[poi.tileType] ?? []).filter(
      (n) => !claimed.has(n.id),
    );
    if (!candidates.length) continue;
    // Prefer the candidate farthest from start.
    candidates.sort((a, b) => {
      const da = Math.hypot(b.x - startTile.x, b.y - startTile.y);
      const db = Math.hypot(a.x - startTile.x, a.y - startTile.y);
      return da - db;
    });
    const target = candidates[0]!;
    claimed.add(target.id);
    target.label = poi.name;
    target.content = {
      ...(target.content ?? {}),
      enemyTemplateIds: poi.enemyTemplateIds ?? target.content?.enemyTemplateIds,
      lootTableId: poi.lootTableId ?? target.content?.lootTableId,
      eventId: poi.eventId ?? target.content?.eventId,
      uniqueRewardTemplateId: poi.uniqueRewardTemplateId,
      poiId: poi.id,
      poiName: poi.name,
      poiFlavor: poi.flavor,
      poiIcon: poi.icon,
      poiLandmark: poi.landmark,
    };
  }

  // Discover the start node's direct neighbors.
  const edges: MapEdge[] = mapTpl.edges.map((e, i) => ({
    id: `e${i}`,
    from: e.from,
    to: e.to,
    encounterChance: 0,
  }));
  for (const e of edges) {
    if (e.from === mapTpl.startId) {
      const other = nodes.find((n) => n.id === e.to);
      if (other) other.discovered = true;
    } else if (e.to === mapTpl.startId) {
      const other = nodes.find((n) => n.id === e.from);
      if (other) other.discovered = true;
    }
  }

  const map: OverworldMap = {
    sceneKind: mapTpl.scene,
    viewWidth: mapTpl.viewWidth,
    viewHeight: mapTpl.viewHeight,
    nodes,
    edges,
    startNodeId: mapTpl.startId,
  };

  return {
    templateId: template.id,
    seed,
    nodes: [],
    edges: [],
    currentNodeId: '',
    visitedNodeIds: [],
    map,
    currentMapNodeId: mapTpl.startId,
    provisions: 5,
    raidLoot: [],
    portalInstability: 0,
    startedAt: 0,
  };
}

export function mapNodeAt(map: OverworldMap, id: string): MapNode | undefined {
  return map.nodes.find((n) => n.id === id);
}

export function adjacentNodes(map: OverworldMap, id: string): MapNode[] {
  const out: MapNode[] = [];
  for (const e of map.edges) {
    if (e.from === id) {
      const n = mapNodeAt(map, e.to);
      if (n) out.push(n);
    } else if (e.to === id) {
      const n = mapNodeAt(map, e.from);
      if (n) out.push(n);
    }
  }
  return out;
}

export function markNodeVisited(map: OverworldMap, id: string): OverworldMap {
  return {
    ...map,
    nodes: map.nodes.map((n) =>
      n.id === id ? { ...n, visited: true, discovered: true } : n,
    ),
  };
}

export function discoverFromNode(map: OverworldMap, id: string): OverworldMap {
  const newly = new Set<string>();
  for (const e of map.edges) {
    if (e.from === id) newly.add(e.to);
    else if (e.to === id) newly.add(e.from);
  }
  return {
    ...map,
    nodes: map.nodes.map((n) => (newly.has(n.id) ? { ...n, discovered: true } : n)),
  };
}

export function scoutRadius(map: OverworldMap, id: string, hops: number): OverworldMap {
  // Breadth-first reveal up to `hops` edges away.
  const visited = new Set<string>([id]);
  let frontier = [id];
  for (let i = 0; i < hops; i++) {
    const next: string[] = [];
    for (const cur of frontier) {
      for (const e of map.edges) {
        const other = e.from === cur ? e.to : e.to === cur ? e.from : null;
        if (other && !visited.has(other)) {
          visited.add(other);
          next.push(other);
        }
      }
    }
    frontier = next;
  }
  return {
    ...map,
    nodes: map.nodes.map((n) =>
      visited.has(n.id) ? { ...n, discovered: true, scouted: true } : n,
    ),
  };
}

export function setNodeContent(
  map: OverworldMap,
  id: string,
  patch: Partial<MapNode>,
): OverworldMap {
  return {
    ...map,
    nodes: map.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
  };
}
