import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { Alert, Field } from '../components/ui';

const Shell = ({ title, children }) => (
  <div className="mx-auto max-w-md px-5 py-14"><h1 className="text-3xl font-semibold">{title}</h1><div className="card mt-6 p-6">{children}</div></div>
);

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setError('');
    try { setMsg((await api.post('/auth/forgot-password', { email })).data.message); } catch (er) { setError(errMsg(er)); }
  };
  return (
    <Shell title="Reset your password">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Alert>{error}</Alert><Alert type="ok">{msg}</Alert>
        <button className="btn btn-primary w-full">Send reset link</button>
        <Link to="/login" className="block text-center text-sm underline">Back to log in</Link>
      </form>
    </Shell>
  );
}

export function ResetPassword() {
  const { token } = useParams();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post(`/auth/reset-password/${token}`, { password }); nav('/login'); } catch (er) { setError(errMsg(er)); }
  };
  return (
    <Shell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" hint="8+ characters, with a letter and a number."><input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Alert>{error}</Alert>
        <button className="btn btn-primary w-full">Save new password</button>
      </form>
    </Shell>
  );
}
