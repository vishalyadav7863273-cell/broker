import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFlat, moveIn, myVisits } from '../api/data';
import { useAuth } from '../context/AuthContext';
import { CONTACT } from '../config';
import CostCard from '../components/CostCard';
import Reveal from '../components/Reveal';
import { Empty, Spinner } from '../components/ui';
import { Phone } from '../components/Icons';

// Online payment lives here too: tenants pay deposit, advance rent and brokerage for flats they have visited.
function PayOnline() {
  const { user, customer } = useAuth();
  const [flats, setFlats] = useState(null);
  useEffect(() => {
    if (!customer) { setFlats([]); return; }
    myVisits()
      .then((vs) => Promise.all([...new Set(vs.filter((v) => v.status === 'completed' && v.flatId).map((v) => v.flatId._id))].map(getFlat)))
      .then(setFlats).catch(() => setFlats([]));
  }, [customer?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section id="pay" className="mt-14 scroll-mt-24">
      <Reveal>
        <p className="eyebrow">Online payment</p>
        <h2 className="mt-3 text-3xl sm:text-4xl">Pay securely, from anywhere</h2>
        <p className="mt-2 max-w-xl text-slate2">UPI, cards, net banking and wallets through Razorpay. Payment opens for a flat once your visit to it is marked completed, and you get a receipt on email.</p>
      </Reveal>
      <div className="mt-6">
        {!user ? (
          <Empty title="Log in to pay online"><Link to="/login" state={{ from: '/contact' }} className="btn btn-primary mt-3">Log in</Link></Empty>
        ) : !customer ? (
          <Empty title="A tenant profile is needed">Online payments are for tenants who booked a visit. <Link to="/register/tenant" className="font-semibold underline">Create a tenant profile</Link>.</Empty>
        ) : flats === null ? <Spinner /> : flats.length === 0 ? (
          <Empty title="Nothing to pay yet">After a visit is completed, the flat appears here. <Link to="/flats" className="font-semibold underline">Browse homes</Link> and book a visit.</Empty>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {flats.map((f, i) => (
              <Reveal key={f._id} delay={i * 100}>
                <h3 className="mb-2 text-lg">{f.name} <span className="text-sm font-normal text-slate2">· {f.area}</span></h3>
                <CostCard flat={f} m={moveIn(f)} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Contact() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <Reveal>
        <p className="eyebrow">Talk to a broker</p>
        <h1 className="mt-4 text-4xl sm:text-5xl">We are a call away.</h1>
        <p className="mt-4 max-w-xl text-lg text-slate2">Tell us your budget and area and a broker will guide you from shortlist to move-in.</p>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Reveal as="a" href={`tel:${CONTACT.phone}`} className="card flex items-center gap-4 p-6 hover:border-ink/30">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-mint"><Phone /></span>
          <span><b className="block">Call us</b><span className="text-slate2">{CONTACT.phone}</span></span>
        </Reveal>
        <Reveal delay={100} className="card p-6"><b>Office hours</b><p className="mt-1 text-slate2">Mon to Sat, 10 AM to 7 PM</p></Reveal>
        <Reveal as="a" href="#pay" delay={200} className="card flex items-center gap-4 bg-ink p-6 text-white hover:brightness-110">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15">₹</span>
          <span><b className="block">Pay online</b><span className="text-white/75">Deposit, rent, brokerage</span></span>
        </Reveal>
      </div>

      <PayOnline />

      <Reveal className="mt-14 rounded-3xl bg-mint p-8">
        <h2 className="text-2xl">Prefer we call you?</h2>
        <p className="mt-2 max-w-md text-slate2">Create a tenant profile with your requirements and our team will reach out with matching homes.</p>
        <Link to="/register/tenant" className="btn btn-primary mt-5">Create tenant profile</Link>
      </Reveal>
    </div>
  );
}
