import { createIdStore } from './idStore';

const store = createIdStore('hk_shortlist');
// Heart / shortlist, remembered in this browser.
export function useShortlist() {
  const ids = store.use();
  return { ids, toggle: store.toggle, has: (id) => ids.includes(id) };
}
