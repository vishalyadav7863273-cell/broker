import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/client';
import { Alert, Field } from '../components/ui';

export default function Register() {
  const { registerUser } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await registerUser(f); nav('/dashboard'); } catch (er) { setError(errMsg(er)); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <h1 className="text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-slate2">Looking to rent? <Link className="underline" to="/register/tenant">Create a tenant profile</Link> instead to get matched with flats.</p>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        <Field label="Full name"><input required className="input" {...bind('fullName')} /></Field>
        <Field label="Email"><input type="email" required className="input" {...bind('email')} /></Field>
        <Field label="Phone"><input required inputMode="tel" className="input" {...bind('phone')} /></Field>
        <Field label="Password" hint="At least 8 characters, with a letter and a number."><input type="password" required minLength={8} className="input" {...bind('password')} /></Field>
        <Alert>{error}</Alert>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="text-center text-sm">Already registered? <Link to="/login?portal=user" className="underline">Log in</Link></p>
      </form>
    </div>
  );
}
