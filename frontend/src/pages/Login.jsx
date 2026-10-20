import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/client';
import { Alert, Field } from '../components/ui';

const PORTALS = [['user', 'User'], ['customer', 'Tenant'], ['admin', 'Admin']];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [sp] = useSearchParams();
  const [portal, setPortal] = useState(PORTALS.some(([p]) => p === sp.get('portal')) ? sp.get('portal') : 'customer');
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const { user } = await login(f.email, f.password, portal);
      nav(['admin', 'staff'].includes(user.role) ? '/admin' : loc.state?.from || '/dashboard', { replace: true });
    } catch (er) { setError(errMsg(er)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <h1 className="text-3xl font-semibold">Welcome back</h1>
      <div className="mt-6 grid grid-cols-3 rounded-lg bg-ink/5 p-1" role="tablist" aria-label="Login type">
        {PORTALS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={portal === k} onClick={() => setPortal(k)} className={`rounded-md py-2 text-sm font-semibold ${portal === k ? 'bg-white shadow' : 'text-slate2'}`}>{l}</button>
        ))}
      </div>
      <form onSubmit={submit} className="card mt-4 space-y-4 p-6">
        <Field label="Email"><input type="email" required autoComplete="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input type="password" required autoComplete="current-password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Alert>{error}</Alert>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : `Log in as ${PORTALS.find(([k]) => k === portal)[1].toLowerCase()}`}</button>
        <div className="flex justify-between text-sm">
          <Link to="/forgot-password" className="underline">Forgot password?</Link>
          {portal !== 'admin' && <Link to={portal === 'customer' ? '/register/tenant' : '/register'} className="underline">Create account</Link>}
        </div>
      </form>
    </div>
  );
}
