export const Field = ({ label, error, children, hint }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate2">{hint}</span>}
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>
);

export const Alert = ({ type = 'error', children }) =>
  children ? (
    <div role="alert" className={`rounded-lg px-4 py-3 text-sm ${type === 'error' ? 'bg-red-50 text-red-700' : 'bg-mint text-ink'}`}>
      {children}
    </div>
  ) : null;

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-slate2">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
    {label}
  </div>
);

export const Empty = ({ title, children }) => (
  <div className="card mx-auto max-w-md p-8 text-center">
    <h3 className="text-lg font-bold">{title}</h3>
    <div className="mt-2 text-sm text-slate2">{children}</div>
  </div>
);

export const Badge = ({ children, tone = 'mint' }) => {
  const tones = { mint: 'bg-mint text-ink', amber: 'bg-marigold/25 text-ink', gray: 'bg-ink/10 text-slate2', red: 'bg-red-100 text-red-700' };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tones[tone]}`}>{children}</span>;
};

export const statusTone = { available: 'mint', pending: 'amber', scheduled: 'mint', completed: 'mint', occupied: 'gray', maintenance: 'amber', cancelled: 'red', 'no-show': 'red' };

// Loading placeholders that match the real cards, so the page does not jump when data arrives.
export const CardSkeleton = () => (
  <div className="card overflow-hidden" aria-hidden="true">
    <div className="h-52 shimmer" />
    <div className="space-y-3 p-5"><div className="h-5 w-2/3 rounded shimmer" /><div className="h-4 w-1/2 rounded shimmer" /><div className="h-8 w-1/3 rounded shimmer" /></div>
  </div>
);
export const ListSkeleton = () => (
  <div className="card flex flex-col overflow-hidden md:flex-row" aria-hidden="true">
    <div className="h-60 shimmer md:w-[330px]" />
    <div className="flex-1 space-y-4 p-5"><div className="h-6 w-1/2 rounded shimmer" /><div className="h-4 w-1/3 rounded shimmer" /><div className="h-16 rounded shimmer" /><div className="h-4 w-3/4 rounded shimmer" /></div>
  </div>
);
