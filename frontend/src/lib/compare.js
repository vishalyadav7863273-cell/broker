import { createIdStore } from './idStore';

export const COMPARE_MAX = 3;
const store = createIdStore('hk_compare', { max: COMPARE_MAX, area: 'sessionStorage' });
export function useCompare() {
  const ids = store.use();
  return { ids, toggle: store.toggle, remove: store.remove, clear: store.clear, has: (id) => ids.includes(id), full: ids.length >= COMPARE_MAX };
}
