import { useEffect, useState } from 'react';
import api, { API_ORIGIN } from './client';

export const AREAS = ['Gomti Nagar', 'Indira Nagar', 'Aliganj', 'Hazratganj', 'Vikas Nagar', 'Jankipuram'];
export const BHKS = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK+'];
export const FURNISHING = ['furnished', 'semi-furnished', 'unfurnished'];
export const SLOTS = ['10:00 AM', '11:30 AM', '01:00 PM', '03:00 PM', '04:30 PM', '06:00 PM'];

// Uploaded photos are stored as /uploads/x.jpg on the API server; pasted links are used as they are.
export const imgSrc = (p) => (/^(https?:|data:)/.test(p) ? p : API_ORIGIN + p);
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
// Visit dates are stored as UTC midnight, so always format in UTC to avoid off-by-one days.
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const fmtDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const moveIn = (f) => {
  const deposit = f.securityDeposit ?? f.monthlyRent * 2;
  const advance = f.advanceRent ?? f.monthlyRent;
  const brokerage = f.brokerage ?? f.monthlyRent;
  return { rent: f.monthlyRent, deposit, advance, brokerage, total: deposit + advance + brokerage };
};

// Areas come from the flats that actually exist, so new areas added by admin show up in filters.
export function useAreas() {
  const [areas, setAreas] = useState(AREAS);
  useEffect(() => { api.get('/flats/areas').then(({ data }) => data.areas?.length && setAreas(data.areas)).catch(() => {}); }, []);
  return areas;
}

const clean = (p = {}) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v != null));

// ---- Public / tenant ----
export const listFlats = async (p) => (await api.get('/flats', { params: clean(p) })).data.flats;
export const getFlat = async (id) => (await api.get(`/flats/${id}`)).data.flat;
export const bookVisit = async (body) => (await api.post('/visits', body)).data.visit;
export const myVisits = async () => (await api.get('/visits/my')).data.visits;
export const cancelVisit = (id) => api.patch(`/visits/${id}/cancel`);

// ---- Admin / staff ----
export const adminStats = async () => (await api.get('/admin/overview')).data.stats;
export const adminVisits = async (status) => (await api.get('/visits', { params: clean({ status }) })).data.visits;
export const updateVisit = async (id, body) => (await api.patch(`/visits/${id}`, body)).data.visit;
export const saveFlat = async (id, body) => (await (id ? api.put(`/flats/${id}`, body) : api.post('/flats', body))).data.flat;
export const deleteFlat = (id) => api.delete(`/flats/${id}`);
export const adminCustomers = async (search) => (await api.get('/admin/customers', { params: clean({ search }) })).data.customers;
export const staffList = async () => (await api.get('/admin/staff')).data.staff;
export const usersList = async () => (await api.get('/admin/users')).data.users;
export const createStaff = async (body) => (await api.post('/admin/users', body)).data.user;
export const setUser = async (id, body) => (await api.patch(`/admin/users/${id}`, body)).data.user;
export const notifRead = (id) => api.patch(`/notifications/${id}/read`);
export const notifReadAll = () => api.patch('/notifications/read-all');

// ---- Payments ----
export const myPayments = async () => (await api.get('/payments/my')).data.payments;
export const adminPayments = async (status) => (await api.get('/payments', { params: clean({ status }) })).data.payments;
export const PURPOSE = { security_deposit: 'Security deposit', advance_rent: 'Advance rent', brokerage: 'Brokerage', booking_amount: 'Booking amount', visit_fee: 'Visit fee' };

export const uploadPhotos = async (files) => {
  const fd = new FormData();
  [...files].forEach((f) => fd.append('photos', f));
  return (await api.post('/uploads', fd)).data.urls;
};

// ---- UPI QR payments ----
export const submitUpi = async (flatId, purpose, utr) => (await api.post('/payments/upi', { flatId, purpose, utr })).data.payment;
export const confirmPayment = async (id) => (await api.patch(`/payments/${id}/confirm`)).data.payment;
export const rejectPayment = async (id, reason) => (await api.patch(`/payments/${id}/reject`, { reason })).data.payment;
