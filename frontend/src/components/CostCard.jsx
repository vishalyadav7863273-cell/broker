import { useCallback, useEffect, useState } from 'react';
import { myPayments, myVisits, money } from '../api/data';
import { errMsg } from '../api/client';
import { payOnline } from '../api/pay';
import { useAuth } from '../context/AuthContext';
import { Alert } from './ui';
import UpiModal from './UpiModal';

const ROWS = [['security_deposit', 'Security deposit', 'deposit'], ['advance_rent', 'Advance rent', 'advance'], ['brokerage', 'Brokerage', 'brokerage']];

// Rent + move-in cost. Tenants who have completed a visit can pay each item online (Razorpay).
export default function CostCard({ flat, m }) {
  const { customer } = useAuth();
  const [mine, setMine] = useState({ visits: [], payments: [] });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [upi, setUpi] = useState(null); // { purpose, label, amount }

  const load = useCallback(() => (customer
    ? Promise.all([myVisits(), myPayments()]).then(([visits, payments]) => setMine({ visits, payments })).catch(() => {})
    : undefined), [customer]);
  useEffect(() => { load(); }, [load]);

  const same = (x) => (x.flatId?._id || x.flatId) === flat._id;
  const visited = mine.visits.some((v) => same(v) && v.status === 'completed');
  const paid = (purpose) => mine.payments.some((p) => same(p) && p.paymentPurpose === purpose && p.paymentStatus === 'successful');
  const waiting = (purpose) => mine.payments.some((p) => same(p) && p.paymentPurpose === purpose && p.paymentMethod === 'upi_qr' && p.paymentStatus === 'pending');
  const canPay = customer && visited && flat.status === 'available';

  const pay = async (purpose) => {
    setBusy(purpose); setError(''); setNote('');
    try { await payOnline(flat._id, purpose); setNote('Payment received. You can see the receipt in My account.'); await load(); }
    catch (e) { if (e.message !== 'Payment cancelled') setError(errMsg(e)); }
    finally { setBusy(''); }
  };

  return (
    <div className="card p-6">
      <p className="font-display text-3xl font-semibold">{money(flat.monthlyRent)}<span className="font-sans text-base font-normal text-slate2"> /month</span></p>
      <ul className="mt-4 space-y-3 border-t border-dashed border-ink/30 pt-4 text-sm">
        {ROWS.map(([purpose, label, key]) => (
          <li key={purpose} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span>{label}</span>
            <span className="flex flex-wrap items-center justify-end gap-2">
              <b>{money(m[key])}</b>
              {customer && paid(purpose) && <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold">Paid ✓</span>}
              {customer && !paid(purpose) && waiting(purpose) && <span className="rounded-full bg-marigold/30 px-2.5 py-0.5 text-xs font-semibold">Awaiting confirmation</span>}
              {canPay && !paid(purpose) && !waiting(purpose) && (
                <>
                  <button className="btn btn-primary !px-3 !py-1.5 text-xs" disabled={!!busy} onClick={() => pay(purpose)}>{busy === purpose ? 'Opening…' : 'Pay online'}</button>
                  <button className="btn btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setUpi({ purpose, label, amount: m[key] })}>UPI QR</button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between border-t border-ink pt-3 font-semibold"><span>Pay at move-in</span><span>{money(m.total)}</span></p>
      {flat.maintenance > 0 && <p className="mt-2 text-xs text-slate2">Plus {money(flat.maintenance)}/month maintenance, paid with rent.</p>}
      {customer && !visited && flat.status === 'available' && <p className="mt-3 text-xs text-slate2">Online payment opens once your visit to this flat is marked completed.</p>}
      <div className="mt-3 space-y-2"><Alert>{error}</Alert><Alert type="ok">{note}</Alert></div>
      {upi && <UpiModal flat={flat} {...upi} onClose={() => setUpi(null)} onDone={load} />}
    </div>
  );
}
