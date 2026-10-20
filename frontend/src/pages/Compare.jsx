import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtDate, listFlats, money, moveIn } from '../api/data';
import { errMsg } from '../api/client';
import Scene, { palFor, variantFor } from '../components/Scene';
import { Alert, Empty, Spinner } from '../components/ui';
import { useCompare } from '../lib/compare';

const cap = (v) => (typeof v === 'string' && v ? v[0].toUpperCase() + v.slice(1) : v);
const PARKING = { none: 'None', bike: 'Bike', car: 'Car', both: 'Bike and car' };
// [label, value, best] where best is 'low' / 'high' to highlight the better number across homes
const ROWS = [
  ['Rent per month', (f) => f.monthlyRent, 'low', money],
  ['Move-in cost', (f) => moveIn(f).total, 'low', money],
  ['Maintenance', (f) => f.maintenance || 0, 'low', (v) => (v ? `${money(v)}/month` : 'None')],
  ['Carpet area', (f) => f.carpetArea, 'high', (v) => `${v} sq ft`],
  ['Bathrooms', (f) => f.bathrooms, 'high'], ['Balconies', (f) => f.balconies, 'high'],
  ['Size', (f) => f.bhk], ['Furnishing', (f) => cap(f.furnishing)], ['Floor', (f) => (f.floor === 0 ? 'Ground' : f.floor)],
  ['Facing', (f) => f.facing], ['Property age', (f) => (f.ageOfProperty != null ? (f.ageOfProperty === 0 ? 'New' : `${f.ageOfProperty} yr`) : undefined)],
  ['Parking', (f) => PARKING[f.parking]], ['Pets', (f) => (f.petsAllowed == null ? undefined : f.petsAllowed ? 'Allowed' : 'Not allowed')],
  ['Available from', (f) => f.availableFrom && fmtDate(f.availableFrom)], ['Amenities', (f) => f.amenities?.join(', ')],
];

export default function Compare() {
  const compare = useCompare();
  const key = compare.ids.join(',');
  const [flats, setFlats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    listFlats({}).then((all) => setFlats(compare.ids.map((id) => all.find((f) => f._id === id)).filter(Boolean))).catch((e) => { setError(errMsg(e)); setFlats([]); });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (flats === null) return <Spinner />;
  if (flats.length < 1) return <div className="mx-auto max-w-2xl px-5 py-20"><Empty title="Nothing to compare yet">On the homes page, press “+ Compare” on up to 3 homes. <Link to="/flats" className="font-semibold underline">Browse homes</Link></Empty></div>;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="eyebrow">Side by side</p>
      <h1 className="mt-2 text-4xl">Compare homes</h1>
      <div className="mt-4"><Alert>{error}</Alert></div>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="w-40 p-4" />
              {flats.map((f) => (
                <th key={f._id} className="min-w-[200px] p-4 align-top font-normal">
                  <div className="overflow-hidden rounded-xl"><Scene variant={variantFor(f.bhk)} palette={palFor(f.propertyId)} label={f.name} className="h-36 w-full" /></div>
                  <Link to={`/flats/${f._id}`} className="mt-3 block font-display text-lg font-semibold hover:underline">{f.name}</Link>
                  <p className="text-slate2">{f.area}</p>
                  <button onClick={() => compare.remove(f._id)} className="mt-1 text-xs underline">Remove</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, get, best, fmt]) => {
              const vals = flats.map(get);
              const nums = vals.filter((v) => typeof v === 'number');
              const win = best && nums.length > 1 && new Set(nums).size > 1 ? (best === 'low' ? Math.min(...nums) : Math.max(...nums)) : null;
              if (vals.every((v) => v === undefined || v === null || v === '')) return null;
              return (
                <tr key={label} className="border-t border-ink/10">
                  <th scope="row" className="p-4 font-medium text-slate2">{label}</th>
                  {vals.map((v, i) => (
                    <td key={flats[i]._id} className={`p-4 ${win !== null && v === win ? 'font-semibold' : ''}`}>
                      {v === undefined || v === null || v === '' ? '—' : fmt ? fmt(v) : v}
                      {win !== null && v === win && <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-xs font-semibold">Best</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-slate2">“Best” marks the lowest cost or the largest space in a row. <Link to="/flats" className="font-semibold underline">Add more homes</Link></p>
    </div>
  );
}
