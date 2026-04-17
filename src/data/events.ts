import type { ItemInstance } from '../types/domain';
import { makeItem } from '../systems/items';
import type { RNG } from '../systems/rng';

export type EventChoice = {
  id: string;
  label: string;
  // Returns a description of what happened and any loot granted.
  apply: (rng: RNG) => { message: string; loot?: ItemInstance[]; hpDelta?: number };
};

export type ExpeditionEvent = {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
};

export const EVENTS: Record<string, ExpeditionEvent> = {
  mine_carving: {
    id: 'mine_carving',
    title: 'Странный символ на стене',
    description:
      'На влажной стене вырезан незнакомый Зир. Символ пульсирует слабым зелёным светом, будто ждёт чего-то.',
    choices: [
      {
        id: 'offer_blood',
        label: 'Коснуться, капнув каплю крови',
        apply: (rng) => {
          if (rng.chance(0.6)) {
            return {
              message: 'Символ впитывает кровь. Вы чувствуете прилив сил — маленький Зир материализуется в руке.',
              loot: [makeItem('zir_heal_minor', 'raid')],
              hpDelta: -4,
            };
          }
          return {
            message: 'Символ отталкивает вас разрядом. Рана кровоточит.',
            hpDelta: -10,
          };
        },
      },
      {
        id: 'examine',
        label: 'Осмотреть, не касаясь',
        apply: (rng) => {
          if (rng.chance(0.5)) {
            return {
              message: 'Вы запоминаете форму символа. Пригодится у алхимика.',
              loot: [makeItem('stone_rough', 'raid')],
            };
          }
          return { message: 'Символ хранит свою тайну.' };
        },
      },
      {
        id: 'pass',
        label: 'Пройти мимо',
        apply: () => ({ message: 'Некогда отвлекаться.' }),
      },
    ],
  },
};

export function getEvent(id: string): ExpeditionEvent {
  const e = EVENTS[id];
  if (!e) throw new Error(`Unknown event: ${id}`);
  return e;
}
