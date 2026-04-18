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

EVENTS.shrine_of_stone = {
  id: 'shrine_of_stone',
  title: 'Алтарь Забытой Молельни',
  description:
    'Свеча горит без воска, без дыма. Над ней — выдолбленная чаша. Что-то просит жертвы — или хотя бы внимания.',
  choices: [
    {
      id: 'offer_crystal',
      label: 'Пожертвовать кристалл Вирдита (если есть)',
      apply: (rng) => {
        if (rng.chance(0.75)) {
          return {
            message:
              'Чаша впитывает кристалл бесшумно. Герой чувствует, как усталость отступает.',
            loot: [makeItem('potion_health_greater', 'raid')],
          };
        }
        return {
          message: 'Кристалл гаснет в чаше как уголёк. Ничего не происходит.',
        };
      },
    },
    {
      id: 'offer_blood',
      label: 'Порезать ладонь — кровь за ответ',
      apply: (rng) => {
        if (rng.chance(0.5)) {
          return {
            message:
              'Кровь оседает на камне символом — и исчезает. В руках герой находит свиток бумаги, ещё тёплый.',
            loot: [makeItem('crude_paper', 'raid'), makeItem('crude_paper', 'raid')],
            hpDelta: -6,
          };
        }
        return {
          message: 'Свеча вспыхивает и гаснет. Рука кровоточит. Боги молчат.',
          hpDelta: -10,
        };
      },
    },
    {
      id: 'pass',
      label: 'Поклониться и уйти',
      apply: () => ({ message: 'Иногда молчание — лучший ответ.' }),
    },
  ],
};

EVENTS.overseer_journal = {
  id: 'overseer_journal',
  title: 'Журнал Смотрителя',
  description:
    'Страницы исписаны мелким почерком: отчёты, имена, графики смен. На последней — одно слово, подчёркнутое трижды: «БЕЖАТЬ».',
  choices: [
    {
      id: 'read_carefully',
      label: 'Пролистать внимательно — час-два',
      apply: (rng) => {
        if (rng.chance(0.7)) {
          return {
            message:
              'В записях — карта нетронутой жилы и рецепт: как использовать Вирдит для зарядки бумаги.',
            loot: [makeItem('ink_essence', 'raid'), makeItem('crude_paper', 'raid')],
          };
        }
        return {
          message: 'Слишком много цифр, слишком мало смысла. Ничего полезного.',
        };
      },
    },
    {
      id: 'tear_pages',
      label: 'Вырвать пару страниц — вдруг пригодятся',
      apply: () => ({
        message: 'В карман лёг неплохой источник бумаги для Зиров.',
        loot: [makeItem('crude_paper', 'raid'), makeItem('crude_paper', 'raid'), makeItem('crude_paper', 'raid')],
      }),
    },
    {
      id: 'burn',
      label: 'Сжечь — мало ли кто ещё прочтёт',
      apply: () => ({
        message: 'Огонь лижет страницы, имена исчезают. Никто больше не узнает.',
      }),
    },
  ],
};

export function getEvent(id: string): ExpeditionEvent {
  const e = EVENTS[id];
  if (!e) throw new Error(`Unknown event: ${id}`);
  return e;
}
