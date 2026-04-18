// Procedural tile-grid generator for expeditions.
// Builds a small grid (e.g. 6×8), scatters content, ensures everything
// is reachable from the portal entry tile via 4-connected movement.

import type {
  ExpeditionRun,
  ExpeditionTemplate,
  GridConfig,
  Tile,
  TileGrid,
  TileType,
} from '../types/domain';
import { poisForTemplate, type Poi } from '../data/pois';
import { createRng, type RNG } from './rng';

type Coord = { x: number; y: number };

function tileId(x: number, y: number): string {
  return `t_${x}_${y}`;
}

function inBounds(x: number, y: number, w: number, h: number): boolean {
  return x >= 0 && y >= 0 && x < w && y < h;
}

function neighbors4(x: number, y: number): Coord[] {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];
}

// BFS reachability from a start coord, treating impassable tiles as walls.
function reachableFrom(
  start: Coord,
  grid: Tile[][],
  w: number,
  h: number,
): Set<string> {
  const visited = new Set<string>();
  const queue: Coord[] = [start];
  while (queue.length > 0) {
    const c = queue.shift()!;
    const key = `${c.x},${c.y}`;
    if (visited.has(key)) continue;
    if (!inBounds(c.x, c.y, w, h)) continue;
    if (grid[c.y]![c.x]!.type === 'impassable') continue;
    visited.add(key);
    for (const n of neighbors4(c.x, c.y)) queue.push(n);
  }
  return visited;
}

// Pick `count` distinct positions from a list of free coords (not start).
function pickPositions(free: Coord[], count: number, rng: RNG): Coord[] {
  const pool = free.slice();
  const out: Coord[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = rng.int(0, pool.length - 1);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

function shuffled<T>(arr: readonly T[], rng: RNG): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function generateTileGrid(config: GridConfig, seed: number): TileGrid {
  const rng = createRng(seed);
  const { width: w, height: h } = config;

  // Init all tiles as empty + unrevealed.
  const matrix: Tile[][] = [];
  for (let y = 0; y < h; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < w; x++) {
      row.push({
        id: tileId(x, y),
        x,
        y,
        type: 'empty',
        revealed: false,
        explored: false,
      });
    }
    matrix.push(row);
  }

  // Start position: top-center.
  const start: Coord = { x: Math.floor(w / 2), y: 0 };
  matrix[start.y]![start.x]!.type = 'portal';
  matrix[start.y]![start.x]!.label = 'Врата портала';
  matrix[start.y]![start.x]!.revealed = true;
  matrix[start.y]![start.x]!.explored = true;

  // Scatter impassable tiles, but keep reachability to all of grid.
  const impassableTarget = Math.floor(w * h * config.impassableRatio);
  let placedImpassable = 0;
  let attempts = 0;
  while (placedImpassable < impassableTarget && attempts < 200) {
    attempts++;
    const x = rng.int(0, w - 1);
    const y = rng.int(0, h - 1);
    if (x === start.x && y === start.y) continue;
    if (matrix[y]![x]!.type !== 'empty') continue;
    matrix[y]![x]!.type = 'impassable';
    // Validate reachability from start to ALL non-impassable tiles.
    const reach = reachableFrom(start, matrix, w, h);
    let ok = true;
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        if (matrix[yy]![xx]!.type === 'impassable') continue;
        if (!reach.has(`${xx},${yy}`)) {
          ok = false;
          break;
        }
      }
      if (!ok) break;
    }
    if (!ok) {
      matrix[y]![x]!.type = 'empty';
    } else {
      placedImpassable++;
    }
  }

  // Collect free (empty, non-start) coordinates.
  const free: Coord[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === start.x && y === start.y) continue;
      if (matrix[y]![x]!.type === 'empty') free.push({ x, y });
    }
  }

  // Ensure boss is far from start — prefer bottom row.
  const farTiles = free.filter((c) => c.y >= Math.floor(h * 0.7));
  const bossPick = farTiles.length > 0 ? rng.pick(farTiles) : rng.pick(free);
  matrix[bossPick.y]![bossPick.x]!.type = 'boss';
  matrix[bossPick.y]![bossPick.x]!.label = 'Логово босса';
  // Remove boss from free pool.
  const freeAfterBoss = free.filter((c) => !(c.x === bossPick.x && c.y === bossPick.y));

  // Place extractions: prefer corners / far walls.
  const extractionsPlaced: Coord[] = [];
  const extractCandidates = freeAfterBoss.filter((c) => c.x === 0 || c.x === w - 1 || c.y === h - 1);
  const ePicks = pickPositions(extractCandidates, config.extractions, rng);
  for (const p of ePicks) {
    matrix[p.y]![p.x]!.type = 'extraction';
    matrix[p.y]![p.x]!.label = 'Точка извлечения';
    extractionsPlaced.push(p);
  }
  // If we ran out of corner candidates, fall back to any far tile.
  while (extractionsPlaced.length < config.extractions && freeAfterBoss.length > 0) {
    const p = rng.pick(freeAfterBoss);
    if (matrix[p.y]![p.x]!.type === 'empty') {
      matrix[p.y]![p.x]!.type = 'extraction';
      matrix[p.y]![p.x]!.label = 'Точка извлечения';
      extractionsPlaced.push(p);
    }
    // avoid infinite loop
    const idx = freeAfterBoss.indexOf(p);
    if (idx >= 0) freeAfterBoss.splice(idx, 1);
  }

  const remaining = freeAfterBoss.filter((c) => matrix[c.y]![c.x]!.type === 'empty');

  const place = (type: TileType, count: number, label?: string) => {
    const picks = pickPositions(remaining, count, rng);
    for (const p of picks) {
      matrix[p.y]![p.x]!.type = type;
      if (label) matrix[p.y]![p.x]!.label = label;
      const idx = remaining.findIndex((c) => c.x === p.x && c.y === p.y);
      if (idx >= 0) remaining.splice(idx, 1);
    }
  };

  place('elite', config.elite, 'Элитный отряд');
  place('combat', config.combat, 'Стычка');
  place('treasure', config.treasure, 'Сокровище');
  place('event', config.event, 'Событие');
  place('rest', config.rest, 'Привал');
  place('cartographer', config.cartographer, 'Картограф');

  // Flatten & return.
  const tiles: Tile[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) tiles.push(matrix[y]![x]!);

  return {
    width: w,
    height: h,
    tiles,
    startId: tileId(start.x, start.y),
  };
}

// ---------- Helpers ----------

export function tileAt(grid: TileGrid, id: string): Tile | undefined {
  return grid.tiles.find((t) => t.id === id);
}

export function tileAtXY(grid: TileGrid, x: number, y: number): Tile | undefined {
  if (!inBounds(x, y, grid.width, grid.height)) return undefined;
  return grid.tiles[y * grid.width + x];
}

// 4-connected neighbors of a tile, excluding impassable.
export function walkableNeighbors(grid: TileGrid, tile: Tile): Tile[] {
  const out: Tile[] = [];
  for (const n of neighbors4(tile.x, tile.y)) {
    const t = tileAtXY(grid, n.x, n.y);
    if (t && t.type !== 'impassable') out.push(t);
  }
  return out;
}

// Reveal LOS: when player enters a tile, mark all 4-neighbors as revealed.
// `scoutDetails` additionally marks them as `scouted` — intel about actual
// contents (enemy types, POI names) rather than just the tile shape.
export function revealAround(
  grid: TileGrid,
  fromTile: Tile,
  radius = 1,
  scoutDetails = false,
): TileGrid {
  const tiles = grid.tiles.map((t) => ({ ...t }));
  const apply = (x: number, y: number) => {
    const t = tiles[y * grid.width + x];
    if (t) {
      t.revealed = true;
      if (scoutDetails) t.scouted = true;
    }
  };
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = fromTile.x + dx;
      const y = fromTile.y + dy;
      if (!inBounds(x, y, grid.width, grid.height)) continue;
      // 4-connected radius (Manhattan distance) so corners stay hidden at r=1.
      if (Math.abs(dx) + Math.abs(dy) > radius) continue;
      apply(x, y);
    }
  }
  return { ...grid, tiles };
}

export function markExplored(grid: TileGrid, tileId: string): TileGrid {
  const tiles = grid.tiles.map((t) => (t.id === tileId ? { ...t, explored: true, revealed: true } : t));
  return { ...grid, tiles };
}

export function setTileType(grid: TileGrid, tileId: string, type: TileType): TileGrid {
  const tiles = grid.tiles.map((t) => (t.id === tileId ? { ...t, type } : t));
  return { ...grid, tiles };
}

export function generateExpeditionRun(
  template: ExpeditionTemplate,
  seed: number,
): ExpeditionRun {
  const grid = generateTileGrid(template.grid!, seed);

  // Resolve tile content templates (enemies / loot / events) deterministically.
  const rng = createRng(seed ^ 0xa5a5);
  const startTile = grid.tiles.find((t) => t.id === grid.startId)!;
  const maxDist = grid.width + grid.height;

  // Scale difficulty: the farther a combat tile is from the portal entry,
  // the stronger the enemy mix. Encourages pushing deeper for real reward.
  const distance = (t: Tile) => Math.abs(t.x - startTile.x) + Math.abs(t.y - startTile.y);
  const poolFor = (t: Tile, elite: boolean): string[] => {
    const d = distance(t);
    const depth = d / maxDist; // 0 near start, ~1 at far corner
    const basePool = template.combatPool;
    // Front of pool = easier enemies (early entries); back = harder.
    // For MVP: simple slice by depth.
    const startIdx = Math.floor(depth * (basePool.length - 1) * 0.5);
    const weighted = basePool.slice(startIdx);
    const count = elite ? 3 : rng.int(1, 2) + (depth > 0.6 ? 1 : 0);
    const ids: string[] = [];
    for (let i = 0; i < count; i++) ids.push(rng.pick(weighted));
    return ids;
  };

  for (const t of grid.tiles) {
    if (t.type === 'combat') {
      t.content = { enemyTemplateIds: poolFor(t, false) };
    } else if (t.type === 'elite') {
      t.content = { enemyTemplateIds: poolFor(t, true) };
    } else if (t.type === 'boss') {
      t.content = { enemyTemplateIds: [template.bossTemplateId] };
    } else if (t.type === 'treasure') {
      t.content = { lootTableId: template.chestLootTableId };
    } else if (t.type === 'event') {
      const pool = template.eventIds ?? ['mine_carving'];
      t.content = { eventId: rng.pick(pool) };
    } else if (t.type === 'cartographer') {
      t.content = { cartographerRadius: 3 };
    }
  }

  // Layer named POIs on top of appropriate tiles.
  // Each POI overrides one tile's label + content, turning a nameless fight
  // into a memorable beat like "Логово Железного Жука".
  const poiPool = poisForTemplate(template.id);
  if (poiPool.length > 0) {
    const picked = shuffled(poiPool, rng).slice(0, Math.min(4, poiPool.length));
    const claimed = new Set<string>();
    for (const poi of picked) {
      // Find the farthest unclaimed tile of the matching type (landmarks
      // tend to be "beyond" something, so they pull the player forward).
      const candidates = grid.tiles
        .filter((t) => t.type === poi.tileType && !claimed.has(t.id))
        .sort((a, b) => distance(b) - distance(a));
      const target = candidates[0];
      if (!target) continue;
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
  }

  // Reveal initial LOS from start.
  const revealed = revealAround(grid, startTile, 1);

  return {
    templateId: template.id,
    seed,
    nodes: [],
    edges: [],
    currentNodeId: '',
    visitedNodeIds: [],
    grid: revealed,
    currentTileId: grid.startId,
    provisions: 5,
    raidLoot: [],
    portalInstability: 0,
    startedAt: 0,
  };
}
