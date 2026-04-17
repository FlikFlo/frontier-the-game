// Smoke test for the combat engine. Run with:
//   npx tsx src/systems/combat.smoke.ts
// or compile+node. Validates that combat reaches a decisive outcome.

import { runCombatToCompletion } from './combat';
import { getEnemyTemplate } from '../data/enemies';
import { makeItem } from './items';
import type { Companion, Hero, ItemInstance } from '../types/domain';

function makeHero(): Hero {
  const weapon = makeItem('ranger_sword', 'soul');
  const armor = makeItem('leather_vest', 'soul');
  return {
    id: 'h',
    name: 'Ролан',
    level: 1,
    xp: 0,
    hpMax: 80,
    epMax: 30,
    stats: { attack: 10, magic: 4, defense: 3, speed: 10, critChance: 0.05 },
    equippedWeaponId: weapon.item.id,
    equippedArmorId: armor.item.id,
    equippedZirIds: [],
  };
}

function makeCompanion(): Companion {
  return {
    id: 'c',
    templateId: 't',
    name: 'Керн',
    role: 'tank',
    level: 1,
    hpMax: 60,
    epMax: 20,
    stats: { attack: 7, magic: 0, defense: 4, speed: 8, critChance: 0.05 },
    weaponDamage: 6,
    downed: false,
  };
}

const hero = makeHero();
const inv: ItemInstance[] = [
  makeItem('ranger_sword', 'soul'),
  makeItem('leather_vest', 'soul'),
];
inv[0]!.item.id = hero.equippedWeaponId!;
inv[1]!.item.id = hero.equippedArmorId!;

function runCase(label: string, enemyIds: string[], seed: number) {
  const enemies = enemyIds.map(getEnemyTemplate);
  const r = runCombatToCompletion(
    { hero, heroInventory: inv, companion: makeCompanion(), enemies, tactic: 'balanced' },
    seed,
  );
  console.log(`[${label}] ${r.outcome} after ${r.turn} turns`);
  for (const c of r.combatants) console.log(`   ${c.name} [${c.side}] ${c.hp}/${c.hpMax}`);
  if (r.outcome === 'ongoing' || r.outcome === 'flee') {
    console.error(`[${label}] did not terminate`);
    process.exit(1);
  }
}

runCase('basic pair', ['mine_rat', 'stone_beetle'], 1337);
runCase('trio ambush', ['rogue_miner', 'rogue_miner', 'ore_elemental'], 42);
runCase('boss fight', ['ancient_golem'], 7);
