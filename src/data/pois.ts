// Named Points of Interest — hand-authored landmarks sprinkled into each
// expedition. Each run picks a subset; they replace generic combat/treasure
// tiles with flavored encounters and unique rewards.

export type PoiTileType = 'combat' | 'elite' | 'event' | 'treasure';

export type Poi = {
  id: string;
  name: string;
  icon: string;            // single-char glyph on the grid
  // Kept in the tile — shown before content fires.
  flavor: string;
  tileType: PoiTileType;
  // Overrides for content
  enemyTemplateIds?: string[];
  lootTableId?: string;
  uniqueRewardTemplateId?: string;
  eventId?: string;
  // Visible through fog as a silhouette (draws the player toward it).
  landmark: boolean;
};

export const MINE_POIS: Poi[] = [
  {
    id: 'iron_beetle_lair',
    name: 'Логово Железного Жука',
    icon: '☗',
    tileType: 'elite',
    enemyTemplateIds: ['stone_beetle', 'stone_beetle', 'stone_beetle'],
    uniqueRewardTemplateId: 'ore_iron',
    flavor:
      'Шурф расширяется в просторный зал. На полу — россыпи иссохших панцирей. Один, самый крупный, ещё теплый и влажный изнутри.',
    landmark: true,
  },
  {
    id: 'drowned_chamber',
    name: 'Затопленная камера',
    icon: '✦',
    tileType: 'treasure',
    lootTableId: 'chest_mine',
    uniqueRewardTemplateId: 'crystal_virdite',
    flavor:
      'Вода стоит по колено, от холода немеет икры. На уступе — обитый железом сундук, запечатанный восковой печатью с гербом рудничной гильдии.',
    landmark: false,
  },
  {
    id: 'forgotten_shrine',
    name: 'Забытая молельня',
    icon: '☥',
    tileType: 'event',
    eventId: 'shrine_of_stone',
    flavor:
      'Маленькая ниша, высеченная рудокопами задолго до их ухода. В центре — обугленный алтарь и свеча, почему-то ещё горящая.',
    landmark: true,
  },
  {
    id: 'rogues_hideout',
    name: 'Логово бандитов',
    icon: '☠',
    tileType: 'elite',
    enemyTemplateIds: ['rogue_miner', 'rogue_miner', 'ore_elemental'],
    uniqueRewardTemplateId: 'leather_vest',
    flavor:
      'Среди бочек и гниющей провизии — двое одичавших рудокопов. С ними жужжит рудный элементаль, призванный кем-то из них.',
    landmark: false,
  },
  {
    id: 'ratqueen_den',
    name: 'Нора Крысиной Королевы',
    icon: '⚒',
    tileType: 'elite',
    enemyTemplateIds: ['mine_rat', 'mine_rat', 'mine_rat', 'mine_rat'],
    uniqueRewardTemplateId: 'mine_herb',
    flavor:
      'Вонь аммиака режет ноздри. В темноте шевелится клубок из десятков шахтных крыс — и одна, вдвое крупнее, с лентами на шее.',
    landmark: false,
  },
  {
    id: 'overseers_journal',
    name: 'Стол смотрителя',
    icon: '?',
    tileType: 'event',
    eventId: 'overseer_journal',
    flavor:
      'Перевёрнутый стол, чернильница, и под ним — кожаный журнал с именами и числами. Смотритель не успел его спрятать.',
    landmark: false,
  },
];

export const EMERALD_POIS: Poi[] = [
  {
    id: 'stone_shepherd',
    name: 'Пастух камней',
    icon: '♛',
    tileType: 'elite',
    enemyTemplateIds: ['stone_guard', 'stone_guard'],
    uniqueRewardTemplateId: 'living_stone',
    flavor:
      'На коленях стоит огромный каменный страж, подняв ладонь. Его жест — не боевой, он будто призывает кого-то. И этот кто-то уже встает рядом.',
    landmark: true,
  },
  {
    id: 'spider_spires',
    name: 'Шпили пауков',
    icon: '✷',
    tileType: 'elite',
    enemyTemplateIds: ['crystal_spider', 'crystal_spider', 'crystal_spider'],
    uniqueRewardTemplateId: 'crystal_fang',
    flavor:
      'Сталагмиты тут острее обычных — их отточили десятки кристальных лапок. Паутина из света мерцает между ними.',
    landmark: true,
  },
  {
    id: 'silent_choir',
    name: 'Безмолвный хор',
    icon: '▣',
    tileType: 'elite',
    enemyTemplateIds: ['wandering_slab', 'wandering_slab', 'wandering_slab'],
    uniqueRewardTemplateId: 'maze_shard',
    flavor:
      'Три плиты парят в идеальном треугольнике. Когда твой шаг нарушает тишину, руны на их гранях вспыхивают одновременно.',
    landmark: true,
  },
  {
    id: 'cartographers_shrine',
    name: 'Алтарь Картографа',
    icon: '◈',
    tileType: 'treasure',
    lootTableId: 'emerald_chest',
    uniqueRewardTemplateId: 'virdite_greater',
    flavor:
      'Каменная тумба, усеянная выгравированными линиями — будто карта лабиринта, но для существ с шестью руками. Что-то тускло светится под ней.',
    landmark: true,
  },
  {
    id: 'crystal_well',
    name: 'Колодец кристаллов',
    icon: '✦',
    tileType: 'treasure',
    lootTableId: 'emerald_chest',
    uniqueRewardTemplateId: 'living_stone',
    flavor:
      'Глубокая шахта, уходящая вертикально вниз. Стены увешаны друзами кристаллов; пара из них выступает настолько, что можно отломить.',
    landmark: false,
  },
];

export function poisForTemplate(templateId: string): Poi[] {
  if (templateId === 'emerald_reach') return EMERALD_POIS;
  if (templateId === 'mine_of_virdite') return MINE_POIS;
  return [];
}
