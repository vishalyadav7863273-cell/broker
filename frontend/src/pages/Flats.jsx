import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BHKS, FURNISHING, listFlats, money, moveIn, useAreas } from '../api/data';
import { errMsg } from '../api/client';
import { FlatPhoto } from '../components/FlatCard';
import Reveal from '../components/Reveal';
import { Alert, Badge, Empty, ListSkeleton, statusTone } from '../components/ui';
import { HeartIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../lib/compare';
import { useShortlist } from '../lib/shortlist';

const csv = (v) => (v ? v.split(',').filter(Boolean) : []);
const MIN = [0, 5000, 10000, 15000, 20000, 30000];
const MAX = [10000, 15000, 20000, 30000, 40000, 50000];
const ago = (d) => {
  if (!d) return '';
  const n = Math.floor((Date.now() - new Date(d)) / 864e5);
  return n < 1 ? 'today' : n === 1 ? 'yesterday' : n < 7 ? `${n} days ago` : n < 30 ? `${Math.floor(n / 7)}w ago` : `${Math.floor(n / 30)}mo ago`;
};

const Pill = ({ on, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={on} className={`rounded-full px-4 py-1.5 text-sm transition ${on ? 'bg-mint font-semibold ring-1 ring-ink' : 'bg-white ring-1 ring-ink/15 hover:bg-ink/5'}`}>
    {on ? '✓ ' : '+ '}{children}
  </button>
);
const Toggle = ({ label, on, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 py-3 text-sm font-medium">
    {label}
    <input type="checkbox" role="switch" className="peer sr-only" checked={on} onChange={(e) => onChange(e.target.checked)} />
    <span className="relative h-6 w-11 rounded-full bg-ink/20 transition peer-checked:bg-ink after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2" />
  </label>
);

function ListingCard({ flat, saved, onSave }) {
  const m = moveIn(flat);
  const isNew = flat.createdAt && Date.now() - new Date(flat.createdAt) < 14 * 864e5;
  const am = flat.amenities || [];
  const compare = useCompare();
  const { customer } = useAuth();
  const inCompare = compare.has(flat._id);
  const fits = customer && (customer.maxBudget || customer.requiredBHK) && (!customer.maxBudget || flat.monthlyRent <= customer.maxBudget) && (!customer.requiredBHK || flat.bhk === customer.requiredBHK);
  return (
    <article className="card flex flex-col overflow-hidden transition hover:shadow-[0_18px_40px_-24px_rgba(28,59,48,.5)] md:flex-row">
      <div className="relative shrink-0 overflow-hidden md:w-[330px]">
        <Link to={`/flats/${flat._id}`} aria-label={`Open ${flat.name}`} className="block h-60 md:h-full"><FlatPhoto flat={flat} className="h-60 transition duration-500 hover:scale-105 md:h-full md:min-h-[260px]" /></Link>
        <span className="absolute left-3 top-3 rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">{isNew ? 'New' : 'For rent'}</span>
        <button onClick={() => onSave(flat._id)} aria-pressed={saved} aria-label={saved ? 'Remove from shortlist' : 'Add to shortlist'} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow backdrop-blur transition hover:scale-110"><span key={String(saved)} className={saved ? 'pop block' : 'block'}><HeartIcon on={saved} /></span></button>
        {flat.photos?.length > 0 && <span className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-1 text-xs font-semibold text-white">📷 {flat.photos.length}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl leading-tight"><Link to={`/flats/${flat._id}`} className="hover:underline">{flat.name}</Link></h2>
            <p className="mt-1 text-sm text-slate2">{flat.bhk} Flat in {flat.area}{flat.bathrooms ? ` · ${flat.bathrooms} bath` : ''}{flat.floor !== undefined && ` · ${flat.floor === 0 ? 'Ground' : `Floor ${flat.floor}`}`}</p>
          </div>
          <Badge tone={statusTone[flat.status]}>{flat.status}</Badge>
        </div>
        {fits && <p className="mt-2"><span className="rounded-full bg-marigold/30 px-3 py-1 text-xs font-semibold">✓ Matches your requirement</span></p>}
        <div className="mt-4 grid grid-cols-2 gap-4 border-y border-dashed border-ink/20 py-4 sm:grid-cols-3">
          <div><p className="font-display text-2xl font-semibold">{money(flat.monthlyRent)}</p><p className="text-xs text-slate2">per month</p></div>
          <div><p className="font-semibold">{money(m.total)}</p><p className="text-xs text-slate2">move-in cost</p></div>
          <div><p className="font-semibold">{flat.carpetArea ? `${flat.carpetArea} sq ft` : <span className="capitalize">{flat.furnishing}</span>}</p><p className="text-xs capitalize text-slate2">{flat.carpetArea ? flat.furnishing : flat.propertyId}</p></div>
        </div>
        {am.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm"><span className="text-slate2">Highlights:</span>
            {am.slice(0, 3).map((a) => <span key={a} className="rounded-md bg-mint px-2.5 py-1">{a}</span>)}
            {am.length > 3 && <span className="rounded-md bg-mint px-2.5 py-1">+{am.length - 3}</span>}
          </p>
        )}
        {flat.description && <p className="mt-3 line-clamp-2 text-sm text-slate2">{flat.description}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <p className="text-sm text-slate2">Listed by <b className="text-ink">HomeKey</b>{flat.createdAt && ` · ${ago(flat.createdAt)}`}</p>
          <div className="flex gap-2">
            <button onClick={() => compare.toggle(flat._id)} aria-pressed={inCompare} disabled={!inCompare && compare.full} title={!inCompare && compare.full ? 'You can compare up to 3 homes' : undefined}
              className={`btn btn-ghost !px-4 !py-2 text-sm ${inCompare ? '!bg-mint ring-1 ring-ink' : ''}`}>{inCompare ? '✓ Added' : '+ Compare'}</button>
            <Link to="/contact" className="btn btn-ghost !px-4 !py-2 text-sm">Contact</Link>
            <Link to={`/flats/${flat._id}`} className="btn btn-primary !px-4 !py-2 text-sm">Book a visit</Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Flats() {
  const AREAS = useAreas();
  const [sp, setSp] = useSearchParams();
  const [all, setAll] = useState(null);
  const [error, setError] = useState('');
  const [qText, setQText] = useState(sp.get('q') || '');
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(8);
  const saved = useShortlist();

  useEffect(() => { listFlats({}).then(setAll).catch((e) => { setError(errMsg(e)); setAll([]); }); }, []);

  const set = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v === '' || v == null || v === false) n.delete(k); else n.set(k, v === true ? '1' : v);
    setSp(n, { replace: true }); setVisible(8);
  };
  const toggleCsv = (k, val) => { const cur = csv(sp.get(k)); set(k, (cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]).join(',')); };

  const bhk = csv(sp.get('bhk')); const fur = csv(sp.get('furnishing'));
  const area = sp.get('area') || ''; const min = Number(sp.get('minRent')) || 0; const max = Number(sp.get('maxRent')) || 0;

  const shown = useMemo(() => {
    if (!all) return null;
    const q = (sp.get('q') || '').toLowerCase();
    const r = all.filter((f) =>
      (sp.get('all') || f.status === 'available') &&
      (!area || f.area.toLowerCase() === area.toLowerCase()) &&
      (!bhk.length || bhk.includes(f.bhk)) && (!fur.length || fur.includes(f.furnishing)) &&
      f.monthlyRent >= min && (!max || f.monthlyRent <= max) &&
      (!sp.get('photos') || f.photos?.length) && (!sp.get('saved') || saved.has(f._id)) &&
      (!q || `${f.name} ${f.area} ${f.address} ${f.propertyId}`.toLowerCase().includes(q)));
    const sort = sp.get('sort') || 'new';
    return r.sort(sort === 'low' ? (a, b) => a.monthlyRent - b.monthlyRent : sort === 'high' ? (a, b) => b.monthlyRent - a.monthlyRent : (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [all, sp, saved.ids]); // eslint-disable-line react-hooks/exhaustive-deps

  const applied = [
    ...(area ? [[`Area: ${area}`, () => set('area', '')]] : []),
    ...bhk.map((b) => [b, () => toggleCsv('bhk', b)]),
    ...fur.map((f) => [f, () => toggleCsv('furnishing', f)]),
    ...(min || max ? [[`${money(min)} – ${max ? money(max) : 'any'}`, () => { const n = new URLSearchParams(sp); n.delete('minRent'); n.delete('maxRent'); setSp(n, { replace: true }); }]] : []),
    ...(sp.get('photos') ? [['With photos', () => set('photos', '')]] : []),
    ...(sp.get('saved') ? [['Shortlisted', () => set('saved', '')]] : []),
    ...(sp.get('q') ? [[`“${sp.get('q')}”`, () => { setQText(''); set('q', ''); }]] : []),
  ];
  const clearAll = () => { setQText(''); setSp({}, { replace: true }); };

  return (
    <div>
      <div className="border-b border-ink/10 bg-white">
        <form onSubmit={(e) => { e.preventDefault(); set('q', qText.trim()); }} className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-ink/15 bg-chalk px-4 py-2.5">
            <span className="text-sm font-semibold">Rent</span><span className="h-5 w-px bg-ink/20" />
            {area && <button type="button" onClick={() => set('area', '')} className="flex shrink-0 items-center gap-2 rounded-full bg-mint px-3 py-1 text-sm font-medium ring-1 ring-ink/30">{area} <span aria-label={`Remove ${area}`}>✕</span></button>}
            <input aria-label="Search homes" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate2/70" placeholder="Search by name, area or property ID" value={qText} onChange={(e) => setQText(e.target.value)} />
          </div>
          <button className="btn btn-primary !py-2.5">Search</button>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="btn btn-ghost !py-2.5 lg:hidden">Filters{applied.length > 0 && ` (${applied.length})`}</button>
        </form>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[290px_1fr]">
        <aside className={`${open ? 'block' : 'hidden'} h-fit lg:sticky lg:top-24 lg:block`}>
          <div className="card divide-y divide-ink/10 px-5">
            <div className="py-5">
              <div className="flex items-center justify-between"><h2 className="text-lg">Applied filters</h2>{applied.length > 0 && <button onClick={clearAll} className="text-sm font-semibold underline">Clear all</button>}</div>
              {applied.length === 0 ? <p className="mt-2 text-sm text-slate2">None yet. Pick a filter below.</p> : (
                <ul className="mt-3 flex flex-wrap gap-2">{applied.map(([l, rm]) => <li key={l}><button onClick={rm} className="flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-sm ring-1 ring-ink/30">{l} <span aria-label={`Remove ${l}`}>✕</span></button></li>)}</ul>
              )}
            </div>
            <div className="py-5">
              <h2 className="text-lg">Budget</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <select aria-label="Minimum rent" className="input !rounded-full" value={min} onChange={(e) => set('minRent', Number(e.target.value) || '')}>{MIN.map((v) => <option key={v} value={v}>{v ? money(v) : 'No min'}</option>)}</select>
                <select aria-label="Maximum rent" className="input !rounded-full" value={max} onChange={(e) => set('maxRent', Number(e.target.value) || '')}><option value={0}>No max</option>{MAX.map((v) => <option key={v} value={v}>{money(v)}</option>)}</select>
              </div>
            </div>
            <div className="py-5"><h2 className="text-lg">Bedrooms</h2><div className="mt-3 flex flex-wrap gap-2">{BHKS.map((b) => <Pill key={b} on={bhk.includes(b)} onClick={() => toggleCsv('bhk', b)}>{b}</Pill>)}</div></div>
            <div className="py-5"><h2 className="text-lg">Furnishing</h2><div className="mt-3 flex flex-wrap gap-2">{FURNISHING.map((f) => <Pill key={f} on={fur.includes(f)} onClick={() => toggleCsv('furnishing', f)}><span className="capitalize">{f}</span></Pill>)}</div></div>
            <div className="py-5"><h2 className="text-lg">Area</h2><div className="mt-3 flex flex-wrap gap-2">{AREAS.map((a) => <Pill key={a} on={area.toLowerCase() === a.toLowerCase()} onClick={() => set('area', area.toLowerCase() === a.toLowerCase() ? '' : a)}>{a}</Pill>)}</div></div>
            <div className="divide-y divide-ink/10 py-2">
              <Toggle label="Properties with photos" on={!!sp.get('photos')} onChange={(v) => set('photos', v)} />
              <Toggle label="Shortlisted only" on={!!sp.get('saved')} onChange={(v) => set('saved', v)} />
              <Toggle label="Include occupied homes" on={!!sp.get('all')} onChange={(v) => set('all', v)} />
            </div>
          </div>
        </aside>

        <section aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl">{shown ? shown.length : '…'} results <span className="text-slate2">|</span> Homes for rent</h1>
            <label className="flex items-center gap-2 text-sm"><span className="text-slate2">Sort by</span>
              <select className="input !w-auto !rounded-full !py-2" value={sp.get('sort') || 'new'} onChange={(e) => set('sort', e.target.value === 'new' ? '' : e.target.value)}>
                <option value="new">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Quick filters">
            {[['Furnished', fur.includes('furnished'), () => toggleCsv('furnishing', 'furnished')], ['With photos', !!sp.get('photos'), () => set('photos', !sp.get('photos'))],
              ['Under ₹15,000', max === 15000, () => set('maxRent', max === 15000 ? '' : 15000)], ['1BHK', bhk.includes('1BHK'), () => toggleCsv('bhk', '1BHK')],
              ['2BHK', bhk.includes('2BHK'), () => toggleCsv('bhk', '2BHK')], ['Shortlisted', !!sp.get('saved'), () => set('saved', !sp.get('saved'))]].map(([l, on, fn]) => (
              <button key={l} onClick={fn} aria-pressed={on} className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${on ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15 hover:bg-ink/5'}`}>{l}</button>
            ))}
          </div>
          <div className="mt-4"><Alert>{error}</Alert></div>
          {shown === null ? <div className="mt-4 space-y-5"><ListSkeleton /><ListSkeleton /><ListSkeleton /></div> : shown.length === 0 ? (
            <div className="mt-10"><Empty title="No homes match these filters">Try a higher budget or remove a filter. <button onClick={clearAll} className="font-semibold underline">Clear all filters</button></Empty></div>
          ) : (
            <>
              <div className="mt-4 space-y-5">
                {shown.slice(0, visible).map((f, i) => <Reveal key={f._id} delay={(i % 4) * 70}><ListingCard flat={f} saved={saved.has(f._id)} onSave={saved.toggle} /></Reveal>)}
              </div>
              {shown.length > visible && <div className="mt-8 text-center"><button onClick={() => setVisible(visible + 8)} className="btn btn-ghost">Show more homes ({shown.length - visible} left)</button></div>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
