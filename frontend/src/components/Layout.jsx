import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CONTACT } from '../config';
import { useShortlist } from '../lib/shortlist';
import CompareBar from './CompareBar';
import FloatingContact from './FloatingContact';
import { Building, HeartIcon, HomeIcon, Phone } from './Icons';
import { Bell, ToastStack } from './NotificationBell';
import ScrollFx from './ScrollFx';

// Animated underline on hover; the current page gets a soft green pill.
const link = ({ isActive }) => `relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100 ${isActive ? 'bg-mint text-ink' : 'text-slate2 hover:text-ink'}`;

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const saved = useShortlist();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]); // new page starts at the top
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollFx />
      <header className={`sticky top-0 z-30 border-b bg-chalk/90 backdrop-blur transition-shadow duration-300 ${scrolled ? 'border-transparent shadow-[0_10px_30px_-18px_rgba(28,59,48,.45)]' : 'border-ink/10'}`}>
        <div className={`mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
          <Link to="/" className="group flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-ink transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-105"><HomeIcon /></span>
            <span className="leading-none">
              <span className="block font-display text-2xl font-semibold">HomeKey<span className="text-marigold">.</span></span>
              <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-slate2 sm:block">Find a place to belong</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
            <NavLink to="/" end className={link}><HomeIcon width="18" height="18" />Home</NavLink>
            <NavLink to="/flats" className={link}><Building width="18" height="18" />Available homes</NavLink>
            <NavLink to="/contact" className={link}><Phone width="18" height="18" />Contact</NavLink>
            {!isAdmin && (
              <Link to="/flats?saved=1" aria-label={`Shortlisted homes: ${saved.ids.length}`} className="relative grid h-11 w-11 place-items-center rounded-xl text-ink hover:bg-ink/5">
                <HeartIcon on={saved.ids.length > 0} />
                {saved.ids.length > 0 && <span key={saved.ids.length} className="pop absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[11px] font-bold leading-[18px] text-white">{saved.ids.length}</span>}
              </Link>
            )}
            {user && <NavLink to={isAdmin ? '/admin' : '/dashboard'} className={link}>{isAdmin ? 'Admin' : 'My account'}</NavLink>}
            {isAdmin && <Bell />}
            {user ? (
              <button className="btn btn-primary ml-2 !py-2.5" onClick={async () => { await logout(); nav('/'); }}>Log out</button>
            ) : (
              <Link to="/login" className="btn btn-primary ml-2 !py-2.5">Login / Sign up</Link>
            )}
          </nav>
        </div>
      </header>
      {isAdmin && <ToastStack />}
      <main key={pathname} className="page-in flex-1"><Outlet /></main>
      <CompareBar />
      <FloatingContact />
      <footer className="mt-24 bg-ink text-white/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl font-semibold text-white">HomeKey<span className="text-marigold">.</span></p>
            <p className="mt-2 max-w-xs text-sm">Thoughtfully selected homes, transparent costs, and a broker who walks you through every step.</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Explore</p>
            <ul className="mt-2 space-y-1"><li><Link to="/flats">Available homes</Link></li><li><Link to="/compare">Compare homes</Link></li><li><Link to="/register/tenant">Tenant sign up</Link></li><li><Link to="/register">Create account</Link></li></ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Team</p>
            <ul className="mt-2 space-y-1"><li><Link to="/contact">Contact us</Link></li><li><a href={`tel:${CONTACT.phone}`}>Call {CONTACT.phone}</a></li><li><Link to="/login?portal=admin">Admin / staff login</Link></li></ul>
          </div>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} HomeKey</p>
      </footer>
    </div>
  );
}
