// Small, deterministic PRNG (mulberry32). Seedable, fast, good enough for gameplay.

export type RNG = {
  next(): number; // [0, 1)
  int(min: number, max: number): number; // inclusive
  pick<T>(arr: readonly T[]): T;
  weighted<T>(entries: readonly { item: T; weight: number }[]): T;
  chance(p: number): boolean;
  fork(salt: number): RNG;
  readonly seed: number;
};

export function createRng(seed: number): RNG {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: RNG = {
    seed,
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(next() * arr.length)]!,
    weighted: (entries) => {
      const total = entries.reduce((s, e) => s + e.weight, 0);
      let r = next() * total;
      for (const e of entries) {
        r -= e.weight;
        if (r <= 0) return e.item;
      }
      return entries[entries.length - 1]!.item;
    },
    chance: (p) => next() < p,
    fork: (salt) => createRng((seed ^ (salt * 0x9e3779b1)) >>> 0),
  };
  return rng;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}
