export type FortressRoomId =
  | 'portal_hall'
  | 'infirmary'
  | 'workshop'
  | 'storage'
  | 'forge'
  | 'library';

export type RoomUpgradeCost = {
  gold: number;
  materials?: Record<string, number>;
};

export type FortressRoomTemplate = {
  id: FortressRoomId;
  name: string;
  description: string;
  maxLevel: number;
  // Per-level effect copy shown in the upgrade card.
  effectPerLevel: (level: number) => string;
  // Gold/material cost to go from `level` → `level + 1`.
  costForLevel: (level: number) => RoomUpgradeCost;
};

export const FORTRESS_ROOMS: Record<FortressRoomId, FortressRoomTemplate> = {
  portal_hall: {
    id: 'portal_hall',
    name: 'Портальный зал',
    description:
      'Сердце крепости. Стены увешаны резными плитами — сюда сведены нити всех миров.',
    maxLevel: 5,
    effectPerLevel: (lvl) => `Нестабильность портала −${(lvl - 1) * 10}%`,
    costForLevel: (lvl) => ({
      gold: 40 + lvl * 40,
      materials: { stone_rough: 3 + lvl, ore_iron: lvl },
    }),
  },
  infirmary: {
    id: 'infirmary',
    name: 'Лазарет',
    description: 'Раненый компаньон приходит в себя быстрее под присмотром сестёр ордена.',
    maxLevel: 5,
    effectPerLevel: (lvl) => `+${(lvl - 1) * 8}% к макс. HP компаньона`,
    costForLevel: (lvl) => ({
      gold: 30 + lvl * 30,
      materials: { mine_herb: 3 + lvl, ink_essence: lvl },
    }),
  },
  workshop: {
    id: 'workshop',
    name: 'Мастерская',
    description: 'Рецепты зелий и Зиров. Пахнет пальмовой смолой и копотью свечей.',
    maxLevel: 5,
    effectPerLevel: (lvl) => `Открыто ${Math.min(lvl * 2, 10)} рецептов`,
    costForLevel: (lvl) => ({
      gold: 50 + lvl * 50,
      materials: { crude_paper: 3 + lvl, ink_essence: lvl + 1 },
    }),
  },
  storage: {
    id: 'storage',
    name: 'Склад',
    description:
      'Штабеля ящиков, подвешенные связки трав. Сюда стекается всё, что ты приносишь из вылазок.',
    maxLevel: 5,
    effectPerLevel: (lvl) => `Вместимость: ${12 + (lvl - 1) * 4}`,
    costForLevel: (lvl) => ({
      gold: 60 + lvl * 60,
      materials: { ore_iron: 2 + lvl, stone_rough: 4 + lvl },
    }),
  },
  forge: {
    id: 'forge',
    name: 'Кузня',
    description: 'Ещё не построена. Здесь можно будет улучшать оружие и броню.',
    maxLevel: 5,
    effectPerLevel: (lvl) => `+${(lvl - 1) * 2} к атаке оружия`,
    costForLevel: (lvl) => ({
      gold: 120 + lvl * 80,
      materials: { ore_iron: 3 + lvl, golem_core: lvl >= 2 ? 1 : 0 },
    }),
  },
  library: {
    id: 'library',
    name: 'Библиотека Зиров',
    description: 'Свитки и стеллажи. Каждый уровень — новый редкий Зир в каталоге мастерской.',
    maxLevel: 5,
    effectPerLevel: (lvl) => `Разблокирован ${lvl - 1} редких Зиров`,
    costForLevel: (lvl) => ({
      gold: 80 + lvl * 60,
      materials: { crude_paper: 4 + lvl, living_stone: lvl >= 2 ? 1 : 0 },
    }),
  },
};

export function listFortressRooms(): FortressRoomTemplate[] {
  return Object.values(FORTRESS_ROOMS);
}
