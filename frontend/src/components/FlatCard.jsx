import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imgSrc, money, moveIn } from '../api/data';
import Scene, { palFor, variantFor } from './Scene';
import { Badge, statusTone } from './ui';

// Uploaded photo when there is one (and it loads), otherwise a drawn room matched to the flat's size.
export const FlatPhoto = ({ flat, className = 'h-52', index = 0 }) => {
  const [bad, setBad] = useState(false);
  const src = flat.photos?.[index];
  useEffect(() => setBad(false), [src]);
  if (src && !bad) return <img src={imgSrc(src)} alt={flat.name} loading="lazy" onError={() => setBad(true)} className={`w-full object-cover ${className}`} />;
  return <Scene variant={variantFor(flat.bhk)} palette={palFor(flat.propertyId)} label={flat.name} className={`w-full ${className}`} />;
};

export default function FlatCard({ flat }) {
  const m = moveIn(flat);
  return (
    <Link to={`/flats/${flat._id}`} className="card group block overflow-hidden transition hover:-translate-y-1 hover:border-ink/30 hover:shadow-[0_18px_40px_-22px_rgba(28,59,48,.45)]">
      <div className="relative overflow-hidden">
        <div className="transition duration-500 group-hover:scale-105"><FlatPhoto flat={flat} /></div>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold backdrop-blur">{flat.bhk}</span>
        <span className="absolute right-3 top-3"><Badge tone={statusTone[flat.status]}>{flat.status}</Badge></span>
      </div>
      <div className="p-5">
        <h3 className="text-lg leading-tight">{flat.name}</h3>
        <p className="mt-1 text-sm text-slate2">{flat.area} · {flat.furnishing}</p>
        <div className="mt-4 flex items-end justify-between border-t border-dashed border-ink/20 pt-4">
          <p className="font-display text-2xl font-semibold">{money(flat.monthlyRent)}<span className="font-sans text-sm font-normal text-slate2"> /month</span></p>
          <p className="text-right text-xs text-slate2">Move-in cost<br /><b className="text-sm text-ink">{money(m.total)}</b></p>
        </div>
      </div>
    </Link>
  );
}
