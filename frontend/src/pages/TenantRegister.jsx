import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/client';
import { BHKS, FURNISHING } from '../api/data';
import { Alert, Field } from '../components/ui';

const AGES = ['18-25', '26-35', '36-45', '46-60', '60+'];
const VEHICLES = ['none', 'two-wheeler', 'four-wheeler', 'both'];

const Sel = ({ opts, any = 'Select', ...p }) => (
  <select className="input" {...p}>{any && <option value="">{any}</option>}{opts.map((o) => <option key={o}>{o}</option>)}</select>
);

const Section = ({ title, children }) => (
  <fieldset className="card p-6"><legend className="px-2 font-display text-lg font-semibold">{title}</legend><div className="mt-2 grid gap-4 sm:grid-cols-2">{children}</div></fieldset>
);

export default function TenantRegister() {
  const { registerCustomer } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [f, setF] = useState({
    fullName: '', email: '', phone: '', password: '', nativePlace: '', currentlyStaying: '', nationality: 'Indian', ageGroup: '',
    linkedinProfile: '', maxBudget: '', requiredBHK: '', furnishingPreference: 'any', preferredFloor: '', preferredArea: '',
    profession: '', companyOrCollege: '', workLocation: '', tenantType: ['family', 'bachelor'].includes(sp.get('type')) ? sp.get('type') : '',
    numberOfPeople: '', expectedShiftingDate: '', smokingDrinkingPreference: '', vehicleOwnership: 'none', pets: '', additionalNotes: '', consent: false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!f.consent) return setError('Please accept the data collection consent to continue.');
    setBusy(true);
    const { consent, ...rest } = f;
    // The API validates optional fields only when present, so drop empty ones.
    const body = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== ''));
    body.consentForDataCollection = true;
    try { await registerCustomer(body); nav('/dashboard'); } catch (er) { setError(errMsg(er)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-3xl font-semibold">Create your tenant profile</h1>
      <p className="mt-2 text-slate2">Tell us what you are looking for once. Our team uses it to match flats and book visits. Fields marked * are required.</p>
      <form onSubmit={submit} className="mt-8 space-y-6">
        <Section title="Account">
          <Field label="Full name *"><input required className="input" {...bind('fullName')} /></Field>
          <Field label="Phone *"><input required inputMode="tel" className="input" {...bind('phone')} /></Field>
          <Field label="Email *"><input type="email" required className="input" {...bind('email')} /></Field>
          <Field label="Password *" hint="8+ characters, with a letter and a number."><input type="password" required minLength={8} className="input" {...bind('password')} /></Field>
          <Field label="Age group"><Sel opts={AGES} {...bind('ageGroup')} /></Field>
          <Field label="Nationality"><input className="input" {...bind('nationality')} /></Field>
          <Field label="Native place"><input className="input" {...bind('nativePlace')} /></Field>
          <Field label="Currently staying at"><input className="input" {...bind('currentlyStaying')} /></Field>
        </Section>
        <Section title="Flat requirements">
          <Field label="Tenant type"><Sel opts={['family', 'bachelor']} {...bind('tenantType')} /></Field>
          <Field label="People moving in"><input type="number" min="1" max="20" className="input" {...bind('numberOfPeople')} /></Field>
          <Field label="Maximum budget (₹/month)"><input type="number" min="0" className="input" {...bind('maxBudget')} /></Field>
          <Field label="Flat size"><Sel opts={BHKS} {...bind('requiredBHK')} /></Field>
          <Field label="Furnishing"><Sel opts={['any', ...FURNISHING]} any="" {...bind('furnishingPreference')} /></Field>
          <Field label="Preferred area"><input className="input" {...bind('preferredArea')} /></Field>
          <Field label="Preferred floor"><input className="input" {...bind('preferredFloor')} placeholder="e.g. 2nd to 4th" /></Field>
          <Field label="Expected shifting date"><input type="date" className="input" {...bind('expectedShiftingDate')} /></Field>
        </Section>
        <Section title="Work or study">
          <Field label="Profession"><input className="input" {...bind('profession')} /></Field>
          <Field label="Company or college"><input className="input" {...bind('companyOrCollege')} /></Field>
          <Field label="Work location"><input className="input" {...bind('workLocation')} /></Field>
          <Field label="LinkedIn profile"><input type="url" className="input" {...bind('linkedinProfile')} placeholder="https://" /></Field>
        </Section>
        <Section title="Lifestyle (optional)">
          <Field label="Vehicle"><Sel opts={VEHICLES} any="" {...bind('vehicleOwnership')} /></Field>
          <Field label="Pets"><input className="input" {...bind('pets')} placeholder="e.g. one dog" /></Field>
          <Field label="Smoking / drinking preference"><input className="input" {...bind('smokingDrinkingPreference')} /></Field>
          <div className="sm:col-span-2"><Field label="Anything else we should know?"><textarea rows={3} maxLength={1000} className="input" {...bind('additionalNotes')} /></Field></div>
        </Section>
        <label className="card flex gap-3 p-5 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-ink" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
          <span>I agree that Ghar Dhundho may store and use this information to match flats and contact me about visits. I can ask for my data to be deleted at any time. *</span>
        </label>
        <Alert>{error}</Alert>
        <button className="btn btn-primary w-full sm:w-auto" disabled={busy}>{busy ? 'Creating profile…' : 'Create tenant profile'}</button>
        <p className="text-sm">Already registered? <Link to="/login" className="underline">Log in</Link></p>
      </form>
    </div>
  );
}
