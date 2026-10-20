import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SLOTS, adminVisits, fmtDate, money, staffList, updateVisit } from '../../api/data';
import { errMsg } from '../../api/client';
import { useNotif } from '../../context/NotifContext';
import { Alert, Badge, Empty, Spinner, statusTone } from '../../components/ui';

const STATUSES = ['pending', 'scheduled', 'completed', 'cancelled', 'no-show', 'all'];

function EditPanel({ v, staff, onSave, busy }) {
  const [f, setF] = useState({ visitDate: v.visitDate.slice(0, 10), visitTime: v.visitTime, assignedStaff: v.assignedStaff?._id || '' });
  const slots = SLOTS.includes(f.visitTime) ? SLOTS : [f.visitTime, ...SLOTS];
  return (
    <div className="mt-4 grid gap-3 rounded-xl bg-mint/60 p-4 sm:grid-cols-4">
      <label className="text-sm font-medium">Date<input type="date" className="input mt-1" value={f.visitDate} onChange={(e) => setF({ ...f, visitDate: e.target.value })} /></label>
      <label className="text-sm font-medium">Time<select className="input mt-1" value={f.visitTime} onChange={(e) => setF({ ...f, visitTime: e.target.value })}>{slots.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label className="text-sm font-medium">Assigned staff
        <select className="input mt-1" value={f.assignedStaff} onChange={(e) => setF({ ...f, assignedStaff: e.target.value })}>
          <option value="">Unassigned</option>{staff.map((s) => <option key={s._id} value={s._id}>{s.fullName}</option>)}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button disabled={busy} className="btn btn-primary !px-4 !py-2.5" onClick={() => onSave(f)}>Save</button>
        {v.status === 'pending' && <button disabled={busy} className="btn btn-accent !px-4 !py-2.5" onClick={() => onSave({ ...f, status: 'scheduled' })}>Save and confirm</button>}
      </div>
    </div>
  );
}

function VisitCard({ v, staff, onChange, setError }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const act = async (body) => {
    setBusy(true); setError('');
    try { await updateVisit(v._id, { ...body, assignedStaff: body.assignedStaff === undefined ? undefined : body.assignedStaff || null }); setEditing(false); await onChange(); }
    catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  };
  const c = v.customerId; const fl = v.flatId;
  const Btn = ({ s, label, cls = 'btn-ghost' }) => <button disabled={busy} onClick={() => act({ status: s })} className={`btn ${cls} !px-4 !py-2 text-sm`}>{label}</button>;
  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg">{fl ? <Link to={`/flats/${fl._id}`} className="hover:underline">{fl.name}</Link> : 'Flat removed'}</h3>
            <Badge tone={statusTone[v.status]}>{v.status}</Badge>
          </div>
          {fl && <p className="text-sm text-slate2">{fl.propertyId} · {fl.area} · {fl.bhk} · {money(fl.monthlyRent)}/month</p>}
          <p className="mt-3 font-semibold">{fmtDate(v.visitDate)} at {v.visitTime}</p>
          <p className="mt-1 text-sm">
            <b>{c?.fullName || 'Unknown tenant'}</b>
            {c?.contactNumber && <> · <a className="underline" href={`tel:${c.contactNumber}`}>{c.contactNumber}</a></>}
          </p>
          {c && <p className="text-sm text-slate2">{[c.requiredBHK, c.tenantType, c.maxBudget && `budget ${money(c.maxBudget)}`, c.preferredArea].filter(Boolean).join(' · ') || 'No preferences shared'}</p>}
          <p className="mt-1 text-sm text-slate2">Staff: {v.assignedStaff?.fullName || 'Unassigned'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {v.status === 'pending' && <><Btn s="scheduled" label="Confirm visit" cls="btn-primary" /><Btn s="cancelled" label="Decline" /></>}
          {v.status === 'scheduled' && <><Btn s="completed" label="Mark completed" cls="btn-primary" /><Btn s="no-show" label="No-show" /><Btn s="cancelled" label="Cancel" /></>}
          {['completed', 'cancelled', 'no-show'].includes(v.status) && <Btn s="pending" label="Reopen" />}
          <button onClick={() => setEditing(!editing)} className="btn btn-ghost !px-4 !py-2 text-sm">{editing ? 'Close' : 'Reschedule / assign'}</button>
        </div>
      </div>
      {editing && <EditPanel v={v} staff={staff} busy={busy} onSave={act} />}
    </li>
  );
}

export function VisitList({ status, limit }) {
  const { tick } = useNotif();
  const [visits, setVisits] = useState(null);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  const load = useCallback(() => adminVisits(status === 'all' ? '' : status).then(setVisits).catch((e) => { setError(errMsg(e)); setVisits([]); }), [status]);
  useEffect(() => { setVisits(null); load(); }, [load, tick]);
  useEffect(() => { staffList().then(setStaff).catch(() => {}); }, []);

  if (visits === null) return <Spinner />;
  const shown = limit ? visits.slice(0, limit) : visits;
  return (
    <>
      <Alert>{error}</Alert>
      {shown.length === 0 ? (
        <div className="mt-6"><Empty title={status === 'pending' ? 'No pending visit requests' : 'No visits here'}>{status === 'pending' ? 'New requests from tenants will appear here instantly.' : 'Try another status filter.'}</Empty></div>
      ) : (
        <ul className="mt-4 space-y-4">{shown.map((v) => <VisitCard key={v._id} v={v} staff={staff} onChange={load} setError={setError} />)}</ul>
      )}
      {limit && visits.length > limit && <Link to="/admin?tab=visits" className="mt-4 inline-block text-sm font-semibold underline">See all {visits.length} pending requests</Link>}
    </>
  );
}

export default function Visits() {
  const [status, setStatus] = useState('pending');
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Visit status">
        {STATUSES.map((s) => (
          <button key={s} role="tab" aria-selected={status === s} onClick={() => setStatus(s)} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${status === s ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15 hover:bg-ink/5'}`}>{s}</button>
        ))}
      </div>
      <VisitList status={status} />
    </div>
  );
}
