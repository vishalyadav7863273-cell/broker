import api from './client';

const loadCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = resolve;
  s.onerror = () => reject(new Error('Could not load the payment window. Check your internet connection.'));
  document.body.appendChild(s);
});

// Opens Razorpay Checkout. The amount is decided by the server; the browser only relays the order.
// Resolves with the verified payment, rejects with Error('Payment cancelled') if the window is closed.
export async function payOnline(flatId, purpose) {
  await loadCheckout();
  const { data: o } = await api.post('/payments/order', { flatId, purpose });
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: o.keyId, amount: o.amount, currency: o.currency, order_id: o.orderId,
      name: 'HomeKey', description: o.description, prefill: o.prefill, theme: { color: '#1C3B30' },
      handler: async (resp) => {
        try { resolve((await api.post('/payments/verify', resp)).data.payment); } catch (e) { reject(e); }
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rzp.open();
  });
}
