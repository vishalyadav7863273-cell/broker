const mk = (d) => (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{d}</svg>
);
export const HomeIcon = mk(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />);
export const Building = mk(<><rect x="5" y="3" width="10" height="18" rx="1" /><path d="M15 9h4v12h-4M8 7h4M8 11h4M8 15h4" /></>);
export const Phone = mk(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />);
export const Arrow = mk(<path d="M5 12h14M13 6l6 6-6 6" />);
export const Shield = mk(<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>);
export const Receipt = mk(<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />);
export const Calendar = mk(<><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>);
export const Target = mk(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></>);
export const HeartIcon = ({ on, ...p }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill={on ? '#D64545' : 'none'} stroke={on ? '#D64545' : 'currentColor'} strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M12 20s-7-4.4-9-9.2C1.8 7.6 3.7 5 6.5 5c1.8 0 3.2 1 4 2.2h3C14.3 6 15.7 5 17.5 5 20.3 5 22.2 7.6 21 10.8 19 15.6 12 20 12 20z" /></svg>
);
export const Chat = mk(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />);
export const MapPin = mk(<><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>);
export const Share = mk(<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />);
export const Scale = mk(<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z" />);
