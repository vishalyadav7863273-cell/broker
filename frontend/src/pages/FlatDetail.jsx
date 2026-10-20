import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { SLOTS, bookVisit, fmtDate, getFlat, listFlats, money, moveIn } from '../api/data';
import { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Gallery from '../components/Gallery';
import CostCard from '../components/CostCard';
import { Alert, Badge, Field, Spinner, statusTone } from '../components/ui';
import FlatCard from '../components/FlatCard';
import Reveal from '../components/Reveal';
import { Calendar, HeartIcon, MapPin, Receipt, Scale, Shield, Share } from '../components/Icons';
import { useCompare } from '../lib/compare';
import { trackViewed, useRecent } from '../lib/recent';
import { useShortlist } from '../lib/shortlist';

const PARKING = { none: 'No parking', bike: 'Bike', car: 'Car', both: 'Bike and car' };
const cap = (v) => (typeof v === 'string' && v ? v[0].toUpperCase() + v.slice(1) : v);
const specs = (f) => [
  ['Size', f.bhk], ['Furnishing', cap(f.furnishing)], ['Floor', f.floor === 0 ? 'Ground' : f.floor],
  ['Carpet area', f.carpetArea && `${f.carpetArea} sq ft`], ['Bathrooms', f.bathrooms], ['Balconies', f.balconies],
  ['Facing', f.facing], ['Property age', f.ageOfProperty != null && (f.ageOfProperty === 0 ? 'New' : `${f.ageOfProperty} yr`)],
  ['Parking', PARKING[f.parking]], ['Pets', f.petsAllowed != null && (f.petsAllowed ? 'Allowed' : 'Not allowed')],
  ['Best for', f.preferredTenants && (f.preferredTenants === 'any' ? 'Family or bachelors' : cap(f.preferredTenants))],
  ['Available from', f.availableFrom && fmtDate(f.availableFrom)], ['Maintenance', f.maintenance > 0 && `${money(f.maintenance)}/month`], ['Property ID', f.propertyId],
].filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '');

const Trust = () => (
  <ul className="card grid gap-4 p-5 text-sm">
    {[[Shield, 'Listed and checked by HomeKey', 'Our team knows every home we list'], [Calendar, 'See it before you pay', 'Online payment opens after your visit'], [Receipt, 'No hidden charges', 'Rent, deposit and brokerage shown up front']].map(([I, t, d]) => (
      <li key={t} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-mint"><I width="18" height="18" /></span><span><b className="block">{t}</b><span className="text-slate2">{d}</span></span></li>
    ))}
  </ul>
);

// Shortlist, compare, share on WhatsApp, copy link, open in maps.
function FlatActions({ flat }) {
  const saved = useShortlist();
  const compare = useCompare();
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${flat.name}, ${flat.area} · ${money(flat.monthlyRent)}/month\n${url}`)}`;
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${flat.address} ${flat.area}`)}`;
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ } };
  const on = saved.has(flat._id); const inCmp = compare.has(flat._id);
  const b = 'btn btn-ghost !px-4 !py-2 text-sm';
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button onClick={() => saved.toggle(flat._id)} aria-pressed={on} className={b}><span key={String(on)} className={on ? 'pop' : ''}><HeartIcon on={on} width="18" height="18" /></span>{on ? 'Shortlisted' : 'Shortlist'}</button>
      <button onClick={() => compare.toggle(flat._id)} aria-pressed={inCmp} disabled={!inCmp && compare.full} className={b}><Scale width="18" height="18" />{inCmp ? 'Added to compare' : 'Compare'}</button>
      <a href={wa} target="_blank" rel="noreferrer" className={b}><Share width="18" height="18" />Share on WhatsApp</a>
      <button onClick={copy} className={b}>{copied ? 'Link copied ✓' : 'Copy link'}</button>
      <a href={map} target="_blank" rel="noreferrer" className={b}><MapPin width="18" height="18" />View on map</a>
    </div>
  );
}

// "Similar homes" and "Recently viewed" under the flat.
function More({ flat }) {
  const recent = useRecent();
  const [all, setAll] = useState(null);
  useEffect(() => { listFlats({}).then(setAll).catch(() => setAll([])); }, []);
  if (!all) return null;
  const score = (f) => (f.area === flat.area ? 2 : 0) + (f.bhk === flat.bhk ? 2 : 0) + (Math.abs(f.monthlyRent - flat.monthlyRent) / flat.monthlyRent < 0.25 ? 1 : 0);
  const similar = all.filter((f) => f._id !== flat._id && f.status === 'available' && score(f) >= 2).sort((a, b) => score(b) - score(a)).slice(0, 3);
  const seen = recent.filter((id) => id !== flat._id).map((id) => all.find((f) => f._id === id)).filter(Boolean).slice(0, 3);
  const Row = ({ title, list }) => list.length ? (
    <section className="mt-16">
      <Reveal as="h2" className="text-2xl sm:text-3xl">{title}</Reveal>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((f, i) => <Reveal key={f._id} delay={i * 110}><FlatCard flat={f} /></Reveal>)}</div>
    </section>
  ) : null;
  return <><Row title="Similar homes" list={similar} /><Row title="Recently viewed" list={seen} /></>;
}

const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);

function VisitForm({ flat }) {
  const { user, customer } = useAuth();
  const loc = useLocation();
  const [f, setF] = useState({ visitDate: tomorrow(), visitTime: SLOTS[0] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  if (flat.status !== 'available') return <Alert>This flat is not available for visits right now.</Alert>;
  if (!user) return (
    <div className="text-sm">
      <p className="text-slate2">Log in to book a visit. Your booking goes straight to our team.</p>
      <div className="mt-4 flex gap-3">
        <Link to="/login" state={{ from: loc.pathname }} className="btn btn-primary">Log in</Link>
        <Link to="/register/tenant" className="btn btn-ghost">Sign up</Link>
      </div>
    </div>
  );
  if (!customer) return <Alert>Visit booking needs a tenant profile. Please sign up through the <Link className="underline" to="/register/tenant">tenant form</Link> to continue.</Alert>;
  if (done) return (
    <div className="rounded-xl bg-mint p-4 text-sm">
      <p className="font-bold">Visit requested</p>
      <p className="mt-1">{fmtDate(done.visitDate)} at {done.visitTime}. We will confirm it shortly. Track it in <Link className="underline" to="/dashboard">My account</Link>.</p>
    </div>
  );

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { setDone(await bookVisit({ flatId: flat._id, ...f })); } catch (er) { setError(errMsg(er)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Visit date"><input type="date" required min={tomorrow()} className="input" value={f.visitDate} onChange={(e) => setF({ ...f, visitDate: e.target.value })} /></Field>
      <Field label="Time slot"><select className="input" value={f.visitTime} onChange={(e) => setF({ ...f, visitTime: e.target.value })}>{SLOTS.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Alert>{error}</Alert>
      <button className="btn btn-accent w-full" disabled={busy}>{busy ? 'Booking…' : 'Book this visit'}</button>
    </form>
  );
}

export default function FlatDetail() {
  const { id } = useParams();
  const [flat, setFlat] = useState(null);
  const [error, setError] = useState('');
  const { customer } = useAuth();
  useEffect(() => { getFlat(id).then(setFlat).catch((e) => setError(errMsg(e))); }, [id]);
  useEffect(() => { if (flat) trackViewed(flat._id); }, [flat?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="mx-auto max-w-xl px-5 py-16"><Alert>{error}</Alert><Link to="/flats" className="mt-4 inline-block underline">Back to flats</Link></div>;
  if (!flat) return <Spinner />;
  const m = moveIn(flat);
  const fits = customer && (customer.maxBudget || customer.requiredBHK) && (!customer.maxBudget || flat.monthlyRent <= customer.maxBudget) && (!customer.requiredBHK || flat.bhk === customer.requiredBHK);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link to="/flats" className="text-sm font-semibold underline underline-offset-4">All flats</Link>
      <div className="mt-4 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Gallery flat={flat} />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold sm:text-4xl">{flat.name}</h1>
            <Badge tone={statusTone[flat.status]}>{flat.status}</Badge>
            {fits && <span className="rounded-full bg-marigold/30 px-3 py-1 text-xs font-semibold">✓ Matches your requirement</span>}
          </div>
          <p className="mt-1 text-slate2">{flat.address}</p>
          <FlatActions flat={flat} />
          <h2 className="mt-8 text-xl">Property details</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {specs(flat).map(([k, v]) => (
              <div key={k} className="card p-4"><dt className="text-xs text-slate2">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>
            ))}
          </dl>
          <h2 className="mt-8 text-xl">About this flat</h2>
          <p className="mt-2 max-w-prose text-slate2">{flat.description}</p>
          {flat.amenities?.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-bold">Amenities</h2>
              <ul className="mt-3 flex flex-wrap gap-2">{flat.amenities.map((a) => <li key={a} className="rounded-full bg-mint px-3 py-1 text-sm">{a}</li>)}</ul>
            </>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <CostCard flat={flat} m={m} />
          <div className="card p-6">
            <h2 className="mb-4 text-xl font-bold">Book a visit</h2>
            <VisitForm flat={flat} />
          </div>
          <Trust />
        </aside>
      </div>
      <More flat={flat} />
    </div>
  );
}
