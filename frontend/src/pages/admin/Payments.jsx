import { useEffect, useState } from 'react';
import { PURPOSE, adminPayments, confirmPayment, fmtDateTime, money, rejectPayment } from '../../api/data';
import { errMsg } from '../../api/client';
import { useNotif } from '../../context/NotifContext';
import { Alert, Badge, Empty, Spinner } from '../../components/ui';

const tone = { successful: 'mint', pending: 'amber', failed: 'red', refunded: 'gray' };

export default function Payments() {
  const { tick } = useNotif();
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const load = () => adminPayments(status).then(setRows).catch((e) => { setError(errMsg(e)); setRows([]); });
  useEffect(() => { load(); }, [status, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (p, kind) => {
    let reason;
    if (kind === 'reject') { reason = window.prompt('Why is it being rejected? (optional, sent to the tenant)', ''); if (reason === null) return; }
    else if (!window.confirm(`Confirm that ${money(p.amount)} (UTR ${p.utr}) has arrived in the UPI account?`)) return;
    setBusy(p._id); setError('');
    try { await (kind === 'reject' ? rejectPayment(p._id, reason) : confirmPayment(p._id)); await load(); } catch (e) { setError(errMsg(e)); } finally { setBusy(''); }
  };

  const ok = (rows || []).filter((p) => p.paymentStatus === 'successful');
  const cards = [['Collected online', money(ok.reduce((s, p) => s + p.amount, 0))], ['Successful payments', ok.length], ['Awaiting confirmation', (rows || []).filter((p) => p.paymentStatus === 'pending' && p.paymentMethod === 'upi_qr').length], ['Failed', (rows || []).filter((p) => p.paymentStatus === 'failed').length]];

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Payment status">
        {[['', 'All'], ['successful', 'Successful'], ['pending', 'Pending'], ['failed', 'Failed']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={status === k} onClick={() => { setRows(null); setStatus(k); }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status === k ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15 hover:bg-ink/5'}`}>{l}</button>
        ))}
      </div>
      <div className="mt-4"><Alert>{error}</Alert></div>
      {rows === null ? <Spinner /> : (
        <>
          {!status && <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([k, v]) => <div key={k} className="card p-5"><p className="text-sm text-slate2">{k}</p><p className="mt-1 font-display text-3xl font-semibold">{v}</p></div>)}</div>}
          {rows.length === 0 ? <div className="mt-6"><Empty title="No payments yet">Online and UPI QR payments from tenants are listed here. UPI payments wait here until you confirm them.</Empty></div> : (
            <div className="card mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/10 text-slate2"><tr><th className="p-3">Date</th><th className="p-3">Tenant</th><th className="p-3">Flat</th><th className="p-3">For</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Method</th><th className="p-3">Reference</th><th className="p-3" /></tr></thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p._id} className="border-b border-ink/5">
                      <td className="p-3">{fmtDateTime(p.transactionDate || p.createdAt)}</td>
                      <td className="p-3 font-medium">{p.customerId?.fullName || '—'}{p.customerId?.contactNumber && <a className="block text-xs font-normal underline" href={`tel:${p.customerId.contactNumber}`}>{p.customerId.contactNumber}</a>}</td>
                      <td className="p-3">{p.flatId?.name || '—'}<span className="block text-xs text-slate2">{p.flatId?.propertyId}</span></td>
                      <td className="p-3">{PURPOSE[p.paymentPurpose]}</td>
                      <td className="p-3 font-semibold">{money(p.amount)}</td>
                      <td className="p-3"><Badge tone={tone[p.paymentStatus]}>{p.paymentStatus}</Badge></td>
                      <td className="p-3">{p.paymentMethod === 'upi_qr' ? 'UPI QR' : 'Razorpay'}</td>
                      <td className="p-3 font-mono text-xs">{p.paymentMethod === 'upi_qr' ? `UTR ${p.utr}` : p.razorpayPaymentId || p.razorpayOrderId || '—'}{p.reviewNote && <span className="mt-1 block font-sans text-slate2">{p.reviewNote}</span>}</td>
                      <td className="space-x-2 whitespace-nowrap p-3 text-right">
                        {p.paymentMethod === 'upi_qr' && p.paymentStatus !== 'successful' && (
                          <>
                            <button disabled={busy === p._id} onClick={() => act(p, 'confirm')} className="btn btn-primary !px-3 !py-1.5 text-xs">Confirm received</button>
                            {p.paymentStatus === 'pending' && <button disabled={busy === p._id} onClick={() => act(p, 'reject')} className="btn btn-ghost !px-3 !py-1.5 text-xs">Reject</button>}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
