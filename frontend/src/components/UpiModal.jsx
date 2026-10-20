import { useEffect, useRef, useState } from 'react';
import { money, submitUpi } from '../api/data';
import { errMsg } from '../api/client';
import { UPI } from '../config';
import { Alert } from './ui';

// Pay by scanning the QR with any UPI app, then send us the 12-digit transaction ID so the team can confirm it.
export default function UpiModal({ flat, purpose, label, amount, onClose, onDone }) {
  const [utr, setUtr] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    box.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const link = `upi://pay?pa=${UPI.id}&pn=${encodeURIComponent(UPI.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`${label} ${flat.propertyId}`)}`;
  const copy = async () => { try { await navigator.clipboard.writeText(UPI.id); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ } };
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await submitUpi(flat._id, purpose, utr.trim()); setDone(true); onDone(); } catch (er) { setError(errMsg(er)); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="upi-title" className="rise relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl outline-none sm:p-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5">✕</button>
        {done ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint text-2xl">✓</span>
            <h2 id="upi-title" className="mt-4 text-2xl">Payment details sent</h2>
            <p className="mx-auto mt-2 max-w-sm text-slate2">Our team will match the transaction in the UPI account and confirm it. You will get a receipt by email.</p>
            <button onClick={onClose} className="btn btn-primary mt-6">Done</button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-[240px_1fr]">
            <div>
              <img src={UPI.qr} alt={`UPI QR code for ${UPI.name}`} className="w-full rounded-2xl ring-1 ring-ink/10" />
              <button onClick={copy} className="btn btn-ghost mt-3 w-full !py-2 text-sm">{copied ? 'UPI ID copied ✓' : 'Copy UPI ID'}</button>
            </div>
            <form onSubmit={submit}>
              <p className="eyebrow">Pay by UPI QR</p>
              <h2 id="upi-title" className="mt-2 text-2xl">{label}</h2>
              <p className="text-sm text-slate2">{flat.name}</p>
              <p className="mt-3 font-display text-4xl font-semibold">{money(amount)}</p>
              <ol className="mt-4 space-y-2 text-sm">
                <li><b>1.</b> Scan the QR with Google Pay, PhonePe, Paytm or any UPI app.</li>
                <li><b>2.</b> Pay exactly <b>{money(amount)}</b> to {UPI.name} ({UPI.id}).</li>
                <li><b>3.</b> Type the 12-digit UPI transaction ID (UTR) from the payment screen below.</li>
              </ol>
              <a href={link} className="mt-3 inline-block text-sm font-semibold underline">On your phone? Open in a UPI app</a>
              <label className="mt-4 block text-sm font-medium">UPI transaction ID
                <input required inputMode="numeric" pattern="\d{12}" maxLength={12} autoComplete="off" className="input mt-1 tracking-widest" placeholder="12 digits" value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))} />
              </label>
              <div className="mt-3"><Alert>{error}</Alert></div>
              <button className="btn btn-primary mt-4 w-full" disabled={busy || utr.length !== 12}>{busy ? 'Sending…' : 'I have paid, send details'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
