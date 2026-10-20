import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BHKS, FURNISHING, deleteFlat, imgSrc, listFlats, money, saveFlat, uploadPhotos } from '../../api/data';
import { errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Alert, Field, Spinner } from '../../components/ui';

const EMPTY = { propertyId: '', name: '', address: '', area: '', monthlyRent: '', securityDeposit: '', advanceRent: '', brokerage: '', bhk: '2BHK', furnishing: 'unfurnished', floor: '', status: 'available', amenities: '', photos: [], description: '',
  carpetArea: '', bathrooms: '', balconies: '', facing: '', ageOfProperty: '', availableFrom: '', maintenance: '', preferredTenants: '', parking: '', petsAllowed: false };
const toForm = (f) => ({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, f[k] ?? ''])), amenities: (f.amenities || []).join(', '), photos: f.photos || [], availableFrom: f.availableFrom ? String(f.availableFrom).slice(0, 10) : '', petsAllowed: !!f.petsAllowed });
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

// Module-level so typing in the link box keeps focus.
function PhotoPicker({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const upload = async (e) => {
    const files = [...e.target.files]; e.target.value = ''; // copy first: resetting the input empties the live FileList
    if (!files.length) return;
    setBusy(true); setError('');
    try { onChange([...value, ...(await uploadPhotos(files))]); } catch (er) { setError(errMsg(er)); } finally { setBusy(false); }
  };
  const addLink = () => { if (/^https?:\/\//.test(link.trim())) { onChange([...value, link.trim()]); setLink(''); } else setError('Paste a full image link starting with http'); };
  return (
    <div>
      <span className="mb-1 block text-sm font-medium">Photos <span className="font-normal text-slate2">(first one is the cover; without photos a drawn room is shown)</span></span>
      {value.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-3">
          {value.map((p, i) => (
            <li key={p} className="relative">
              <img src={imgSrc(p)} alt={`Photo ${i + 1}`} className="h-20 w-28 rounded-lg object-cover ring-1 ring-ink/15" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-ink px-1.5 text-[10px] font-semibold text-white">Cover</span>}
              <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs text-white">✕</button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn btn-ghost cursor-pointer !py-2 text-sm">
          {busy ? 'Uploading…' : 'Upload photos'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={upload} disabled={busy} />
        </label>
        <input className="input max-w-xs !py-2" placeholder="or paste an image link" value={link} onChange={(e) => setLink(e.target.value)} />
        <button type="button" className="btn btn-ghost !py-2 text-sm" onClick={addLink}>Add link</button>
      </div>
      <p className="mt-1 text-xs text-slate2">JPG, PNG or WebP, up to 5 MB each.</p>
      <div className="mt-2"><Alert>{error}</Alert></div>
    </div>
  );
}

// Module-level so the inputs keep focus while typing.
function FlatForm({ initial, id, onDone, onCancel }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    const { amenities, ...rest } = f;
    try { await saveFlat(id, { ...rest, amenities: list(amenities) }); onDone(); } catch (er) { setError(errMsg(er)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="card mt-4 grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Property ID *"><input required className="input" {...bind('propertyId')} /></Field>
      <Field label="Name *"><input required className="input" {...bind('name')} /></Field>
      <Field label="Area *"><input required className="input" {...bind('area')} /></Field>
      <div className="sm:col-span-2 lg:col-span-3"><Field label="Address *"><input required className="input" {...bind('address')} /></Field></div>
      <Field label="Monthly rent (₹) *"><input required type="number" min="0" className="input" {...bind('monthlyRent')} /></Field>
      <Field label="Security deposit (₹)" hint="Blank = 2 months rent"><input type="number" min="0" className="input" {...bind('securityDeposit')} /></Field>
      <Field label="Advance rent (₹)" hint="Blank = 1 month rent"><input type="number" min="0" className="input" {...bind('advanceRent')} /></Field>
      <Field label="Brokerage (₹)" hint="Blank = 1 month rent"><input type="number" min="0" className="input" {...bind('brokerage')} /></Field>
      <Field label="Size *"><select className="input" {...bind('bhk')}>{BHKS.map((b) => <option key={b}>{b}</option>)}</select></Field>
      <Field label="Furnishing *"><select className="input" {...bind('furnishing')}>{FURNISHING.map((b) => <option key={b}>{b}</option>)}</select></Field>
      <Field label="Floor"><input type="number" min="0" className="input" {...bind('floor')} /></Field>
      <Field label="Status"><select className="input" {...bind('status')}>{['available', 'occupied', 'maintenance'].map((b) => <option key={b}>{b}</option>)}</select></Field>
      <div className="sm:col-span-2 lg:col-span-3"><h3 className="mt-2 text-lg">Property details</h3></div>
      <Field label="Carpet area (sq ft)"><input type="number" min="0" className="input" {...bind('carpetArea')} /></Field>
      <Field label="Bathrooms"><input type="number" min="0" className="input" {...bind('bathrooms')} /></Field>
      <Field label="Balconies"><input type="number" min="0" className="input" {...bind('balconies')} /></Field>
      <Field label="Facing"><select className="input" {...bind('facing')}><option value="">Not set</option>{['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Property age (years)"><input type="number" min="0" className="input" {...bind('ageOfProperty')} /></Field>
      <Field label="Available from"><input type="date" className="input" {...bind('availableFrom')} /></Field>
      <Field label="Maintenance (₹/month)"><input type="number" min="0" className="input" {...bind('maintenance')} /></Field>
      <Field label="Best for"><select className="input" {...bind('preferredTenants')}><option value="">Not set</option><option value="any">Family or bachelors</option><option value="family">Family</option><option value="bachelor">Bachelors</option></select></Field>
      <Field label="Parking"><select className="input" {...bind('parking')}><option value="">Not set</option><option value="none">None</option><option value="bike">Bike</option><option value="car">Car</option><option value="both">Bike and car</option></select></Field>
      <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-ink" checked={f.petsAllowed} onChange={(e) => setF({ ...f, petsAllowed: e.target.checked })} />Pets allowed</label>
      <div className="sm:col-span-2"><Field label="Amenities" hint="Separate with commas"><input className="input" {...bind('amenities')} placeholder="Lift, Parking, Power backup" /></Field></div>
      <div className="sm:col-span-2 lg:col-span-3"><PhotoPicker value={f.photos} onChange={(photos) => setF({ ...f, photos })} /></div>
      <div className="sm:col-span-2 lg:col-span-3"><Field label="Description"><textarea rows={3} maxLength={3000} className="input" {...bind('description')} /></Field></div>
      <div className="sm:col-span-2 lg:col-span-3"><Alert>{error}</Alert></div>
      <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Add flat'}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function FlatsAdmin() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const [flats, setFlats] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | flat
  const [error, setError] = useState('');
  const load = () => listFlats({}).then(setFlats).catch((e) => { setError(errMsg(e)); setFlats([]); });
  useEffect(() => { load(); }, []);
  useEffect(() => { if (sp.get('new')) setEditing('new'); }, [sp]);

  // Requirement of the tenant the admin is adding this flat for (passed from the Tenants tab)
  const forName = sp.get('for');
  const prefill = () => ({
    ...EMPTY,
    bhk: BHKS.includes(sp.get('bhk')) ? sp.get('bhk') : EMPTY.bhk,
    furnishing: FURNISHING.includes(sp.get('furnishing')) ? sp.get('furnishing') : EMPTY.furnishing,
    area: sp.get('area') || '',
    monthlyRent: sp.get('rent') || '',
  });
  const close = () => { setEditing(null); if (sp.get('new')) setSp({ tab: 'flats' }); };

  const quickStatus = async (f, status) => { try { await saveFlat(f._id, { status }); load(); } catch (e) { setError(errMsg(e)); } };
  const remove = async (f) => {
    if (!window.confirm(`Delete ${f.name}? This cannot be undone.`)) return;
    try { await deleteFlat(f._id); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-slate2">{flats ? `${flats.length} flats` : ''}</p>
        {!editing && <button className="btn btn-primary !py-2" onClick={() => setEditing('new')}>Add flat</button>}
      </div>
      {editing === 'new' && forName && <div className="mt-4 rounded-xl bg-marigold/30 p-4 text-sm"><b>Adding a flat for {forName}.</b> Size, area, furnishing and rent are filled from their requirement. Change anything before saving.</div>}
      {editing && <FlatForm key={editing === 'new' ? `new-${sp.toString()}` : editing._id} id={editing === 'new' ? null : editing._id} initial={editing === 'new' ? prefill() : toForm(editing)} onCancel={close} onDone={() => { close(); load(); }} />}
      <div className="mt-4"><Alert>{error}</Alert></div>
      {flats === null ? <Spinner /> : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-slate2"><tr><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Area</th><th className="p-3">Size</th><th className="p-3">Rent</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>
              {flats.map((f) => (
                <tr key={f._id} className="border-b border-ink/5">
                  <td className="p-3">{f.propertyId}</td>
                  <td className="p-3 font-medium"><Link className="hover:underline" to={`/flats/${f._id}`}>{f.name}</Link></td>
                  <td className="p-3">{f.area}</td><td className="p-3">{f.bhk}</td><td className="p-3">{money(f.monthlyRent)}</td>
                  <td className="p-3"><select aria-label={`Status of ${f.name}`} className="rounded-lg border border-ink/15 bg-white px-2 py-1" value={f.status} onChange={(e) => quickStatus(f, e.target.value)}>{['available', 'occupied', 'maintenance'].map((s) => <option key={s}>{s}</option>)}</select></td>
                  <td className="space-x-3 p-3 text-right"><button className="underline" onClick={() => setEditing(f)}>Edit</button>{user.role === 'admin' && <button className="text-red-700 underline" onClick={() => remove(f)}>Delete</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
