import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PURPOSE, cancelVisit, fmtDate, myPayments, myVisits, money } from '../api/data';
import { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Badge, Empty, Spinner, statusTone } from '../components/ui';

const Row = ({ k, v }) => v ? <div className="flex justify-between gap-4 py-2 text-sm"><dt className="text-slate2">{k}</dt><dd className="text-right font-medium capitalize">{v}</dd></div> : null;

export default function Dashboard() {
  const { user, customer } = useAuth();
  const [visits, setVisits] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const load = () => myVisits().then(setVisits).catch((e) => { setError(errMsg(e)); setVisits([]); });
  useEffect(() => { load(); myPayments().then(setPayments).catch(() => {}); }, []);

  const cancel = async (id) => { try { await cancelVisit(id); load(); } catch (e) { setError(errMsg(e)); } };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-4xl font-semibold">Hi, {user.fullName.split(' ')[0]}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Your visits</h2><Link to="/flats" className="btn btn-accent !py-1.5">Find a flat</Link></div>
          <div className="mt-4"><Alert>{error}</Alert></div>
          {visits === null ? <Spinner /> : visits.length === 0 ? (
            <div className="mt-6"><Empty title="No visits yet">Open any flat and pick a date to book your first visit.</Empty></div>
          ) : (
            <ul className="mt-4 space-y-3">
              {visits.map((v) => (
                <li key={v._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <Link to={`/flats/${v.flatId?._id}`} className="font-bold underline-offset-4 hover:underline">{v.flatId?.name || 'Flat removed'}</Link>
                    <p className="text-sm text-slate2">{fmtDate(v.visitDate)} · {v.visitTime}{v.flatId ? ` · ${money(v.flatId.monthlyRent)}/month` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusTone[v.status]}>{v.status}</Badge>
                    {v.status === 'completed' && v.flatId && <Link to={`/flats/${v.flatId._id}`} className="btn btn-primary !px-4 !py-1.5 text-sm">Pay online</Link>}
                    {['pending', 'scheduled'].includes(v.status) && <button onClick={() => cancel(v._id)} className="text-sm underline">Cancel</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold">Account</h2>
            <dl className="mt-2 divide-y divide-ink/10"><Row k="Name" v={user.fullName} /><Row k="Email" v={user.email} /><Row k="Phone" v={user.phone} /></dl>
          </div>
          <div className="card p-6">
            <h2 className="text-xl">Payments</h2>
            {payments.length === 0 ? <p className="mt-2 text-sm text-slate2">No payments yet. After your visit is completed you can pay deposit, advance rent and brokerage online.</p> : (
              <ul className="mt-2 divide-y divide-ink/10">
                {payments.map((p) => (
                  <li key={p._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span><b className="block">{PURPOSE[p.paymentPurpose]}</b><span className="text-slate2">{p.flatId?.name} · {fmtDate(p.transactionDate || p.createdAt)}{p.paymentMethod === 'upi_qr' ? ' · UPI' : ''}</span></span>
                    <span className="text-right"><b>{money(p.amount)}</b><span className="block text-xs capitalize text-slate2">{p.paymentStatus === 'pending' ? 'awaiting confirmation' : p.paymentStatus === 'failed' ? 'not matched' : p.paymentStatus}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {customer && (
            <div className="card p-6">
              <h2 className="text-xl font-bold">Tenant profile</h2>
              <dl className="mt-2 divide-y divide-ink/10">
                <Row k="Looking for" v={[customer.requiredBHK, customer.tenantType].filter(Boolean).join(' · ')} />
                <Row k="Budget" v={customer.maxBudget && `${money(customer.maxBudget)}/month`} />
                <Row k="Area" v={customer.preferredArea} />
                <Row k="Furnishing" v={customer.furnishingPreference} />
                <Row k="Shifting date" v={customer.expectedShiftingDate && new Date(customer.expectedShiftingDate).toDateString()} />
              </dl>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
