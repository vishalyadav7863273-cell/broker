import { useSyncExternalStore } from 'react';

// Small shared list of ids saved in the browser, so every component (header counter, cards, pages) stays in sync.
export function createIdStore(key, { max = Infinity, area = 'localStorage' } = {}) {
  const storage = () => { try { return window[area]; } catch { return null; } };
  const read = () => { try { const v = JSON.parse(storage()?.getItem(key)); return Array.isArray(v) ? v : []; } catch { return []; } };
  let ids = read();
  const subs = new Set();
  const save = (next) => { ids = next; try { storage()?.setItem(key, JSON.stringify(next)); } catch { /* storage unavailable */ } subs.forEach((f) => f()); };
  window.addEventListener('storage', (e) => { if (e.key === key) { ids = read(); subs.forEach((f) => f()); } });
  return {
    use: () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => ids),
    toggle: (id) => { if (ids.includes(id)) { save(ids.filter((x) => x !== id)); return true; } if (ids.length >= max) return false; save([...ids, id]); return true; },
    push: (id, limit = 8) => save([id, ...ids.filter((x) => x !== id)].slice(0, limit)),
    remove: (id) => save(ids.filter((x) => x !== id)),
    clear: () => save([]),
  };
}
