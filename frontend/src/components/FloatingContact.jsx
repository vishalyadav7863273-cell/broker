import { useLocation } from 'react-router-dom';
import { CONTACT } from '../config';
import { useCompare } from '../lib/compare';
import { Chat, Phone } from './Icons';

// Always-available call / WhatsApp buttons on the public pages.
export default function FloatingContact() {
  const { pathname } = useLocation();
  const compare = useCompare();
  if (pathname.startsWith('/admin')) return null;
  return (
    <div className={`fixed left-5 z-40 flex flex-col gap-3 transition-all duration-300 ${compare.ids.length ? 'bottom-24' : 'bottom-6'}`}>
      <a href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('Hi HomeKey, I am looking for a flat.')}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
        className="ring-pulse grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110"><Chat /></a>
      <a href={`tel:${CONTACT.phone}`} aria-label="Call us" className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white shadow-lg transition hover:scale-110"><Phone /></a>
    </div>
  );
}
