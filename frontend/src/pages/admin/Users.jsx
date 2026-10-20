import { useEffect, useState } from 'react';
import { createStaff, fmtDateTime, setUser, usersList } from '../../api/data';
import { errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Alert, Badge, Field, Spinner } from '../../components/ui';

function StaffForm({ onDone }) {
  const [f, setF] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  const submit = async (e) => {
    e.preventDefault(); setError('');
    try { await createStaff(f); setF({ fullName: '', email: '', phone: '', password: '' }); onDone(); } catch (er) { setError(errMsg(er)); }
  };
  return (
    <form onSubmit={submit} className="card grid gap-4 p-6 sm:grid-cols-2">
      <h2 className="text-xl sm:col-span-2">Add a staff member</h2>
      <Field label="Full name"><input required className="input" {...bind('fullName')} /></Field>
      <Field label="Phone"><input required className="input" {...bind('phone')} /></Field>
      <Field label="Email"><input type="email" required className="input" {...bind('email')} /></Field>
      <Field label="Temporary password" hint="8+ characters, with a letter and a number"><input type="password" required minLength={8} className="input" {...bind('password')} /></Field>
      <div className="sm:col-span-2"><Alert>{error}</Alert></div>
      <div className="sm:col-span-2"><button className="btn btn-primary">Create staff account</button></div>
    </form>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const load = () => usersList().then(setUsers).catch((e) => { setError(errMsg(e)); setUsers([]); });
  useEffect(() => { load(); }, []);
  const toggle = async (u) => { setError(''); try { await setUser(u.id, { isActive: !u.isActive }); load(); } catch (e) { setError(errMsg(e)); } };

  return (
    <div className="space-y-6">
      <StaffForm onDone={load} />
      <Alert>{error}</Alert>
      {users === null ? <Spinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-slate2"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Joined</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink/5">
                  <td className="p-3 font-medium">{u.fullName}</td><td className="p-3">{u.email}</td>
                  <td className="p-3"><Badge tone={u.role === 'user' ? 'gray' : 'amber'}>{u.role}</Badge></td>
                  <td className="p-3">{fmtDateTime(u.createdAt)}</td>
                  <td className="p-3"><Badge tone={u.isActive ? 'mint' : 'red'}>{u.isActive ? 'active' : 'deactivated'}</Badge></td>
                  <td className="p-3 text-right">{u.id !== me.id && <button className="underline" onClick={() => toggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
