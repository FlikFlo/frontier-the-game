import type { ExpeditionTemplate } from '../types/domain';

export const EXPEDITION_TEMPLATES: Record<string, ExpeditionTemplate> = {
  mine_of_virdite: {
    id: 'mine_of_virdite',
    name: 'Шахта Вирдита',
    school: 'earth',
    travelDays: 1,
    crystalCost: {}, // free for the first local expedition — no portal needed
    recommendedPower: 10,
  },
};

export function getExpeditionTemplate(id: string): ExpeditionTemplate {
  const t = EXPEDITION_TEMPLATES[id];
  if (!t) throw new Error(`Unknown expedition template: ${id}`);
  return t;
}
