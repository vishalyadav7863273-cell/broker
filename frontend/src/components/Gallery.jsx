import { useState } from 'react';
import { imgSrc } from '../api/data';
import { FlatPhoto } from './FlatCard';
import Scene, { VIEW_LABELS, palFor, viewsFor } from './Scene';

// Uploaded photos when the flat has them; otherwise drawn views of each room (living room, bedroom, kitchen, balcony, building).
export default function Gallery({ flat }) {
  const [i, setI] = useState(0);
  const real = flat.photos?.length > 0;
  const pal = palFor(flat.propertyId);
  const items = real ? flat.photos.map((p, k) => ({ key: p, photo: p, label: `Photo ${k + 1}` })) : viewsFor(flat.bhk).map((v) => ({ key: v, view: v, label: VIEW_LABELS[v] }));
  const cur = items[Math.min(i, items.length - 1)];
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl">
        {real
          ? <FlatPhoto flat={flat} index={i} className="h-72 sm:h-[26rem]" />
          : <Scene variant={cur.view} palette={pal} label={`${flat.name} ${cur.label}`} className="h-72 w-full sm:h-[26rem]" />}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold backdrop-blur">{cur.label}</span>
        {!real && <span className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">Illustrative view</span>}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Flat views">
        {items.map((it, k) => (
          <button key={it.key} onClick={() => setI(k)} aria-label={it.label} aria-current={i === k} className={`w-24 shrink-0 text-center ${i === k ? '' : 'opacity-70 hover:opacity-100'}`}>
            <span className={`block h-16 overflow-hidden rounded-lg ring-2 ${i === k ? 'ring-ink' : 'ring-transparent'}`}>
              {it.photo ? <img src={imgSrc(it.photo)} alt="" className="h-full w-full object-cover" /> : <Scene variant={it.view} palette={pal} className="h-full w-full" />}
            </span>
            <span className="mt-1 block truncate text-xs text-slate2">{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
