import { createIdStore } from './idStore';

const store = createIdStore('hk_recent');
export const trackViewed = (id) => store.push(id, 8);
export const useRecent = () => store.use();
