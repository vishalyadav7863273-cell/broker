import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BHKS, listFlats, money, useAreas } from '../api/data';
import FlatCard from '../components/FlatCard';
import Reveal from '../components/Reveal';
import Parallax from '../components/Parallax';
import CountUp from '../components/CountUp';
import Faq from '../components/Faq';
import { Interior, PALS, palFor } from '../components/Scene';
import { CardSkeleton } from '../components/ui';
import { Arrow, Calendar, HomeIcon, Receipt, Shield, Target } from '../components/Icons';

/* ---------- Hero: an arched room that changes with who is moving in ---------- */
const WHO = {
  family: { label: 'Family', bhk: '2BHK', pal: PALS[0], caption: 'Space for every chapter.', hint: 'Roomy homes for families' },
  bachelor: { label: 'Bachelor', bhk: '1RK', pal: PALS[2], caption: 'Your door. Your pace.', hint: 'Studios near work and college' },
  couple: { label: 'Couple', bhk: '1BHK', pal: PALS[1], caption: 'Two of you, one beginning.', hint: 'Cosy 1BHKs for two' },
};

function HeroArt({ who }) {
  const w = WHO[who];
  return (
    <div className="rise relative mx-auto w-full max-w-[460px]">
      <svg viewBox="0 0 500 560" className="w-full overflow-visible" role="img" aria-label={`Illustration of a ${w.label.toLowerCase()} home`}>
        <defs>
          <clipPath id="inner"><path d="M44 486V132Q44 54 122 54H298Q376 54 376 132V486Z" /></clipPath>
          <filter id="lift" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="22" stdDeviation="20" floodColor="#1C3B30" floodOpacity=".14" /></filter>
        </defs>
        <circle cx="350" cy="210" r="150" fill="#DCE6DB" />
        <ellipse cx="220" cy="520" rx="190" ry="26" fill="#E4ECE3" />
        <path d="M30 500V130Q30 40 120 40H300Q390 40 390 130V500Z" fill="#fff" filter="url(#lift)" />
        <g clipPath="url(#inner)">
          <svg key={who} className="fade" x="44" y="54" width="332" height="382" viewBox="0 -140 400 440" preserveAspectRatio="xMidYMax meet"><Interior variant={who} pal={w.pal} /></svg>
          <rect x="44" y="436" width="332" height="50" fill="#F7F3EA" />
        </g>
        <g stroke="#2F5B46" strokeWidth="3" strokeLinecap="round"><path d="M392 120h30M400 106l14 28M414 106l-14 28" /></g>
        <text x="362" y="468" textAnchor="end" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontSize="20" fill="#1C3B30">{w.caption}</text>
      </svg>
      <div className="floaty absolute -left-2 top-[15%] flex items-center gap-3 rounded-2xl bg-white p-3 pr-6 shadow-[0_14px_40px_-12px_rgba(28,59,48,.35)] sm:-left-10">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-ink"><HomeIcon width="18" height="18" /></span>
        <span><b className="block text-sm">Find your fit</b><span className="text-xs text-slate2">{w.hint}</span></span>
      </div>
    </div>
  );
}

function Hero() {
  const [who, setWho] = useState('family');
  const up = (ms) => ({ className: 'anim-up', style: { animationDelay: `${ms}ms` } });
  return (
    <div className="relative overflow-x-clip">
      <div aria-hidden className="blob pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-mint blur-3xl" />
      <div aria-hidden className="blob pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-marigold/25 blur-3xl" style={{ animationDelay: '-6s' }} />
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-2 lg:pt-20">
        <div>
          <p className="eyebrow anim-up"><span className="h-2 w-2 rounded-full bg-marigold" />Your next chapter starts here</p>
          <h1 className="mt-6 text-5xl font-medium leading-[1.04] sm:text-7xl">
            <span className="block overflow-hidden pb-3"><span className="anim-line block" style={{ animationDelay: '120ms' }}>A place to call</span></span>
            <span className="-mt-3 block overflow-hidden pb-3"><em className="anim-line block font-medium italic text-sage" style={{ animationDelay: '280ms' }}>your own.</em></span>
          </h1>
          <p {...up(450)} className="anim-up mt-6 max-w-md text-lg leading-relaxed text-slate2">Thoughtfully selected homes, transparent guidance, and a smoother way to find your next address.</p>
          <fieldset {...up(560)} className="anim-up mt-8">
            <legend className="text-sm font-semibold text-slate2">Who is moving in?</legend>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Who is moving in">
              {Object.entries(WHO).map(([k, v]) => (
                <button key={k} role="radio" aria-checked={who === k} onClick={() => setWho(k)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${who === k ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15 hover:bg-mint'}`}>{v.label}</button>
              ))}
            </div>
          </fieldset>
          <div {...up(670)} className="anim-up mt-6 flex flex-wrap gap-3">
            <Link to={`/flats?bhk=${WHO[who].bhk}`} className="btn btn-primary">Explore {WHO[who].label.toLowerCase()} homes <Arrow width="18" height="18" /></Link>
            <Link to="/contact" className="btn btn-ghost">Talk to a broker</Link>
          </div>
          <p {...up(780)} className="anim-up mt-6 flex items-center gap-2 text-sm text-slate2"><Shield width="18" height="18" />Personal guidance from search to move-in</p>
        </div>
        <Parallax speed={0.1}><HeroArt who={who} /></Parallax>
      </section>
    </div>
  );
}

/* ---------- A better way home: live move-in cost calculator ---------- */
const points = [
  [Receipt, 'Every rupee shown first', 'Rent, deposit, advance and brokerage appear on every home, so there are no surprises at move-in.'],
  [Calendar, 'Visits in a few taps', 'Pick a date and time. Our team confirms and meets you at the home.'],
  [Target, 'Matched to your needs', 'Share your budget, area and shifting date once, and we shortlist homes that actually fit.'],
];

function Calculator() {
  const [rent, setRent] = useState(18000);
  const rows = [['Security deposit', '2 months', rent * 2], ['Advance rent', '1 month', rent], ['Brokerage', '1 month', rent]];
  return (
    <aside className="mx-auto w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_20px_50px_-24px_rgba(28,59,48,.35)]" aria-label="Move-in cost calculator">
      <p className="text-sm font-semibold text-slate2">Move-in cost calculator</p>
      <label className="mt-4 block">
        <span className="flex items-end justify-between"><span className="text-sm">Monthly rent</span><b className="font-display text-3xl font-semibold">{money(rent)}</b></span>
        <input type="range" min="5000" max="50000" step="500" value={rent} onChange={(e) => setRent(Number(e.target.value))} className="mt-3 w-full accent-[#1C3B30]" />
        <span className="flex justify-between text-xs text-slate2"><span>₹5,000</span><span>₹50,000</span></span>
      </label>
      <ul className="mt-5 space-y-2 border-t border-dashed border-ink/25 pt-4 text-sm">
        {rows.map(([l, n, v]) => <li key={l} className="flex justify-between"><span>{l} <span className="text-slate2">({n})</span></span><b>{money(v)}</b></li>)}
      </ul>
      <div className="mt-4 flex items-end justify-between border-t border-ink pt-4">
        <span className="text-sm font-semibold">You pay at move-in</span>
        <span className="font-display text-3xl font-semibold">{money(rent * 4)}</span>
      </div>
      <Link to={`/flats?maxRent=${rent}`} className="btn btn-primary mt-5 w-full">See homes up to {money(rent)} <Arrow width="18" height="18" /></Link>
      <p className="mt-3 text-xs text-slate2">Typical terms. Each home page shows its exact amounts.</p>
    </aside>
  );
}

function BetterWay() {
  return (
    <section className="mx-auto max-w-6xl border-t border-ink/10 px-5 pt-14">
      <p className="eyebrow">A better way home</p>
      <div className="mt-6 grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <Reveal as="h2" variant="left" className="max-w-lg text-4xl font-medium leading-tight sm:text-5xl">Finding a home should feel calm, not confusing.</Reveal>
          <ul className="mt-8 space-y-6">
            {points.map(([Icon, t, d], i) => (
              <Reveal as="li" key={t} variant="left" delay={150 + i * 140} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-ink"><Icon width="20" height="20" /></span>
                <div><h3 className="text-lg">{t}</h3><p className="mt-1 max-w-md text-slate2">{d}</p></div>
              </Reveal>
            ))}
          </ul>
        </div>
        <Reveal variant="right" delay={200}><Calculator /></Reveal>
      </div>
    </section>
  );
}

/* ---------- Neighbourhoods, built from the flats that actually exist ---------- */
function Areas({ flats }) {
  const groups = Object.values(flats.reduce((m, f) => {
    const g = (m[f.area] ||= { area: f.area, count: 0, min: Infinity });
    g.count += 1; g.min = Math.min(g.min, f.monthlyRent);
    return m;
  }, {})).sort((a, b) => b.count - a.count).slice(0, 6);
  if (!groups.length) return null;
  return (
    <section className="mx-auto mt-24 max-w-6xl px-5">
      <Reveal><p className="eyebrow">Neighbourhoods</p>
      <h2 className="mt-3 text-3xl sm:text-4xl">Pick the street you want to wake up on</h2></Reveal>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g, i) => {
          const p = palFor(g.area);
          return (
            <Reveal key={g.area} variant="scale" delay={i * 90}><Link to={`/flats?area=${encodeURIComponent(g.area)}`} className="group relative block overflow-hidden rounded-2xl p-6 transition hover:-translate-y-1" style={{ background: `linear-gradient(135deg, ${p.w1}, ${p.w2})` }}>
              <span aria-hidden className="absolute -right-1 -top-6 font-display text-9xl font-medium italic opacity-10">{g.count}</span>
              <p className="font-display text-2xl">{g.area}</p>
              <p className="mt-1 text-sm text-slate2">{g.count} home{g.count > 1 && 's'} · from {money(g.min)}</p>
              <span className="mt-8 inline-flex items-center gap-1 text-sm font-semibold">Explore <Arrow width="16" height="16" className="transition group-hover:translate-x-1" /></span>
            </Link></Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Search sentence ---------- */
const inline = 'mx-1 rounded-lg border-0 border-b-2 border-ink bg-mint px-2 py-1 font-display font-semibold focus:bg-marigold/30';

function SearchSentence() {
  const nav = useNavigate();
  const AREAS = useAreas();
  const [q, setQ] = useState({ bhk: '2BHK', area: '', maxRent: '20000' });
  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  const go = (e) => { e.preventDefault(); nav(`/flats?${new URLSearchParams(Object.entries(q).filter(([, v]) => v))}`); };
  return (
    <section className="mx-auto mt-24 max-w-6xl px-5">
      <Reveal variant="scale"><form onSubmit={go} className="rounded-3xl bg-white p-8 text-xl leading-[3.2rem] ring-1 ring-ink/10 sm:p-12 sm:text-2xl">
        <p className="eyebrow !leading-normal">Start with what matters</p>
        <div className="mt-3">
          I need a
          <select aria-label="BHK" className={inline} value={q.bhk} onChange={set('bhk')}><option value="">any size</option>{BHKS.map((b) => <option key={b}>{b}</option>)}</select>
          home in
          <select aria-label="Area" className={inline} value={q.area} onChange={set('area')}><option value="">any area</option>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
          under ₹<input aria-label="Maximum rent per month" inputMode="numeric" className={`${inline} w-28`} value={q.maxRent} onChange={set('maxRent')} /> a month.
        </div>
        <button className="btn btn-primary mt-4">Show matching homes <Arrow width="18" height="18" /></button>
      </form></Reveal>
    </section>
  );
}

const TICKER = ['Verified homes', 'Every rupee shown first', 'Visit before you pay', 'Pay online with Razorpay', 'Personal broker support', 'Move in with confidence'];
function Marquee() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="marquee mt-20 overflow-hidden border-y border-ink/10 bg-mint/60 py-4" aria-hidden="true">
      <div className="marquee-track flex w-max gap-10 whitespace-nowrap font-display text-xl italic">
        {items.map((t, i) => <span key={i} className="flex items-center gap-10">{t}<span className="h-2 w-2 rounded-full bg-marigold" /></span>)}
      </div>
    </div>
  );
}

function Stats({ flats }) {
  const items = [[flats.length, '', 'homes ready to visit', ''], [new Set(flats.map((f) => f.area)).size, '', 'neighbourhoods to choose from', ''], [Math.min(...flats.map((f) => f.monthlyRent)), '₹', 'rents start from', '/month']];
  return (
    <section className="mx-auto mt-24 max-w-6xl px-5">
      <Reveal variant="scale" className="grid gap-8 rounded-3xl bg-ink px-8 py-12 text-white sm:grid-cols-3">
        {items.map(([n, pre, label, suf]) => (
          <div key={label} className="text-center">
            <p className="font-display text-5xl font-semibold sm:text-6xl"><CountUp to={n} prefix={pre} /><span className="text-2xl text-white/70">{suf}</span></p>
            <p className="mt-2 text-white/75">{label}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

const FAQ = [
  ['How does booking a visit work?', 'Open any home, pick a date and time and send the request. Our team confirms it by email, and you can see or cancel it any time in My account.'],
  ['What do I pay when I move in?', 'Usually a security deposit, advance rent and brokerage. Every home shows its exact amounts, and the calculator above shows the typical terms.'],
  ['How can I pay?', 'Once your visit is marked completed you can pay online with Razorpay (UPI, cards, net banking) or scan our UPI QR and send the transaction ID. Either way you get a receipt by email.'],
  ['Can I shortlist and compare homes?', 'Yes. Tap the heart to shortlist a home, and “+ Compare” to put up to three homes side by side.'],
  ['Do you have homes for bachelors?', 'Yes. Choose Bachelor at the top of this page, or filter the homes list by 1RK and furnished homes.'],
  ['Who can I talk to?', 'Use the call and WhatsApp buttons on any page, or the Contact page. A broker will guide you from shortlist to move-in.'],
];

const steps = [
  ['Search and shortlist', 'Filter by size, area, furnishing and budget.'],
  ['Book a visit', 'Pick a date and time. We confirm and meet you there.'],
  ['Pay securely online', 'After your visit, pay deposit, advance rent and brokerage online with Razorpay.'],
  ['Move in', 'Sign the agreement, collect the keys and settle in.'],
];

export default function Home() {
  const [flats, setFlats] = useState(null);
  useEffect(() => { listFlats({ status: 'available' }).then(setFlats).catch(() => setFlats([])); }, []);

  return (
    <>
      <Hero />
      <Marquee />
      <BetterWay />

      <section className="mx-auto mt-24 max-w-6xl px-5">
        <Reveal className="flex items-end justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl">Ready to visit this week</h2>
          <Link to="/flats" className="text-sm font-semibold underline underline-offset-4">See all homes</Link>
        </Reveal>
        {flats === null ? <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div> : <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{flats.slice(0, 3).map((f, i) => <Reveal key={f._id} delay={i * 130}><FlatCard flat={f} /></Reveal>)}</div>}
      </section>

      {flats && flats.length > 0 && <Stats flats={flats} />}
      {flats && <Areas flats={flats} />}
      <SearchSentence />

      <section className="mx-auto mt-24 max-w-6xl px-5">
        <Reveal as="h2" className="text-3xl sm:text-4xl">From search to keys in four steps</Reveal>
        <ol className="mt-10 grid gap-8 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 140}>
              <span className="inline-grid h-12 min-w-[4.5rem] place-items-center rounded-lg border-2 border-ink bg-white px-3 font-display text-lg font-semibold shadow-[3px_3px_0_0_#D9A47C]" aria-label={`Step ${i + 1}`}>No. {i + 1}</span>
              <h3 className="mt-4 text-lg">{t}</h3>
              <p className="mt-1 text-sm text-slate2">{d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-24 grid max-w-6xl gap-6 px-5 md:grid-cols-2">
        {[['family', 'Moving with family?', 'Tell us how many are moving and the floor you prefer. We shortlist larger homes in safe, gated societies.', 'bg-mint'],
          ['bachelor', 'Moving alone or with friends?', 'Furnished studios and shared 2BHKs near offices and colleges, with flexible shifting dates.', 'bg-cream ring-1 ring-ink/10']].map(([type, t, d, bg], i) => (
          <Reveal key={type} variant={i ? 'right' : 'left'} className={`rounded-3xl p-8 sm:p-10 ${bg}`}>
            <h3 className="text-2xl">{t}</h3>
            <p className="mt-2 max-w-md text-slate2">{d}</p>
            <Link to={`/register/tenant?type=${type}`} className="btn btn-primary mt-6">Create a {type} profile</Link>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto mt-24 grid max-w-6xl gap-10 px-5 lg:grid-cols-[.8fr_1.2fr]">
        <Reveal variant="left">
          <p className="eyebrow">Questions</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Good to know before you book</h2>
          <p className="mt-3 max-w-sm text-slate2">Still unsure? Call or WhatsApp us from the buttons at the corner of the page.</p>
        </Reveal>
        <Reveal variant="right"><Faq items={FAQ} /></Reveal>
      </section>
    </>
  );
}
