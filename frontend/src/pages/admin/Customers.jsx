import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FURNISHING, adminCustomers, fmtDateTime, fmtDate, listFlats, money } from '../../api/data';
import { errMsg } from '../../api/client';
import { useNotif } from '../../context/NotifContext';
import { Alert, Empty, Spinner } from '../../components/ui';

const D = ({ k, v }) => (v ? <div><dt className="text-xs text-slate2">{k}</dt><dd className="text-sm font-medium capitalize">{v}</dd></div> : null);

// Available flats that fit the tenant's stated requirement, plus a shortcut to add a new one for them.
function Matches({ c }) {
  const nav = useNavigate();
  const [flats, setFlats] = useState(null);
  useEffect(() => {
    listFlats({ status: 'available', bhk: c.requiredBHK, area: c.preferredArea, maxRent: c.maxBudget }).then(setFlats).catch(() => setFlats([]));
  }, [c]);
  const addFor = () => nav('/admin?' + new URLSearchParams(Object.entries({
    tab: 'flats', new: '1', for: c.fullName, bhk: c.requiredBHK, area: c.preferredArea, rent: c.maxBudget,
    furnishing: FURNISHING.includes(c.furnishingPreference) ? c.furnishingPreference : '',
  }).filter(([, v]) => v)));
  return (
    <div className="mt-5 border-t border-ink/10 pt-4">
      <p className="text-sm font-semibold">Available flats matching this requirement{flats ? ` (${flats.length})` : ''}</p>
      {flats && flats.length === 0 && <p className="mt-1 text-sm text-slate2">Nothing matches yet. Add a flat that fits what they asked for.</p>}
      {flats && flats.length > 0 && <ul className="mt-2 flex flex-wrap gap-2">{flats.map((f) => <li key={f._id}><Link to={`/flats/${f._id}`} className="inline-block rounded-full bg-white px-3 py-1 text-sm ring-1 ring-ink/15 hover:bg-ink/5">{f.name} · {money(f.monthlyRent)}</Link></li>)}</ul>}
      <button onClick={addFor} className="btn btn-primary mt-3 !py-2 text-sm">+ Add a flat for {c.fullName.split(' ')[0]}</button>
    </div>
  );
}

export default function Customers() {
  const { tick, unread } = useNotif();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => adminCustomers(search).then(setRows).catch((e) => { setError(errMsg(e)); setRows([]); }), 250);
    return () => clearTimeout(t);
  }, [search, tick, unread]);

  return (
    <div>
      <input className="input max-w-md" placeholder="Search by name, phone or area" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search tenants" />
      <div className="mt-4"><Alert>{error}</Alert></div>
      {rows === null ? <Spinner /> : rows.length === 0 ? <div className="mt-6"><Empty title="No tenants found">Tenant profiles appear here when people sign up.</Empty></div> : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-slate2"><tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Looking for</th><th className="p-3">Budget</th><th className="p-3">Joined</th><th className="p-3" /></tr></thead>
            <tbody>
              {rows.map((c) => (
                <Fragment key={c._id}>
                  <tr className="border-b border-ink/5">
                    <td className="p-3 font-medium">{c.fullName}</td>
                    <td className="p-3"><a className="underline" href={`tel:${c.contactNumber}`}>{c.contactNumber}</a></td>
                    <td className="p-3">{[c.requiredBHK, c.tenantType, c.preferredArea].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="p-3">{c.maxBudget ? money(c.maxBudget) : '—'}</td>
                    <td className="p-3">{fmtDateTime(c.createdAt)}</td>
                    <td className="p-3 text-right"><button className="underline" onClick={() => setOpen(open === c._id ? null : c._id)}>{open === c._id ? 'Hide' : 'Details'}</button></td>
                  </tr>
                  {open === c._id && (
                    <tr className="border-b border-ink/5 bg-mint/40">
                      <td colSpan="6" className="p-4">
                        <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          <D k="Email" v={c.userId?.email} /><D k="Age group" v={c.ageGroup} /><D k="Native place" v={c.nativePlace} /><D k="Currently staying" v={c.currentlyStaying} />
                          <D k="Furnishing" v={c.furnishingPreference} /><D k="Preferred floor" v={c.preferredFloor} /><D k="People" v={c.numberOfPeople} /><D k="Shifting date" v={c.expectedShiftingDate && fmtDate(c.expectedShiftingDate)} />
                          <D k="Profession" v={c.profession} /><D k="Company / college" v={c.companyOrCollege} /><D k="Work location" v={c.workLocation} /><D k="Vehicle" v={c.vehicleOwnership} />
                          <D k="Pets" v={c.pets} /><D k="Smoking / drinking" v={c.smokingDrinkingPreference} /><D k="LinkedIn" v={c.linkedinProfile} /><D k="Notes" v={c.additionalNotes} />
                        </dl>
                        <Matches c={c} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
