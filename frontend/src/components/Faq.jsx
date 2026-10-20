import { useId, useState } from 'react';

export default function Faq({ items }) {
  const [open, setOpen] = useState(0);
  const base = useId();
  return (
    <ul className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map(([q, a], i) => (
        <li key={q}>
          <h3>
            <button id={`${base}-b${i}`} aria-expanded={open === i} aria-controls={`${base}-p${i}`} onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-xl hover:text-sage">
              {q}
              <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint text-lg transition-transform duration-300 ${open === i ? 'rotate-45' : ''}`}>+</span>
            </button>
          </h3>
          <div id={`${base}-p${i}`} role="region" aria-labelledby={`${base}-b${i}`} aria-hidden={open !== i} className={`accordion ${open === i ? 'open' : ''}`}>
            <div className="overflow-hidden"><p className="max-w-2xl pb-5 text-slate2">{a}</p></div>
          </div>
        </li>
      ))}
    </ul>
  );
}
