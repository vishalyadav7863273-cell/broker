const Flat = require('../models/Flat');
const User = require('../models/User');
const { Visit, Payment } = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');
const { getClient, keyId, verifyPaymentSignature, verifyWebhookSignature } = require('../utils/razorpay');
const { notifyAdmins } = require('../utils/notify');
const { sendUserEmail } = require('../utils/mailer');
const { emitToAdmins } = require('../socket');

const LABEL = { security_deposit: 'Security deposit', advance_rent: 'Advance rent', brokerage: 'Brokerage' };
const amountFor = (f, purpose) => ({
  security_deposit: f.securityDeposit ?? f.monthlyRent * 2,
  advance_rent: f.advanceRent ?? f.monthlyRent,
  brokerage: f.brokerage ?? f.monthlyRent,
})[purpose];
const POP = [{ path: 'flatId', select: 'name propertyId area' }, { path: 'customerId', select: 'fullName contactNumber userId' }];
const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

// Shared rules for every way of paying (Razorpay or UPI QR). The amount always comes from the flat, never from the browser.
async function checkPayable(req, flatId, purpose) {
  const flat = await Flat.findById(flatId);
  if (!flat) throw new ApiError(404, 'Flat not found');
  if (flat.status !== 'available') throw new ApiError(409, 'This flat is no longer available');
  if (!(await Visit.exists({ customerId: req.customer._id, flatId, status: 'completed' }))) {
    throw new ApiError(403, 'You can pay online after your visit to this flat is completed.');
  }
  if (await Payment.exists({ flatId, customerId: { $ne: req.customer._id }, paymentStatus: 'successful' })) {
    throw new ApiError(409, 'This flat has already been booked by another tenant.');
  }
  if (await Payment.exists({ customerId: req.customer._id, flatId, paymentPurpose: purpose, paymentStatus: 'successful' })) {
    throw new ApiError(409, `${LABEL[purpose]} is already paid.`);
  }
  if (await Payment.exists({ customerId: req.customer._id, flatId, paymentPurpose: purpose, paymentMethod: 'upi_qr', paymentStatus: 'pending' })) {
    throw new ApiError(409, `Your UPI payment for ${LABEL[purpose].toLowerCase()} is already waiting for confirmation.`);
  }
  const amount = amountFor(flat, purpose);
  if (!amount || amount < 1) throw new ApiError(400, 'Nothing to pay for this item.');
  return { flat, amount };
}

// Marks a payment successful exactly once (checkout verify, webhook and admin confirmation may overlap).
async function markPaid(payment, razorpayPaymentId) {
  const set = { paymentStatus: 'successful', transactionDate: new Date() };
  if (razorpayPaymentId) set.razorpayPaymentId = razorpayPaymentId; // never set null: the field has a unique sparse index
  const updated = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: { $ne: 'successful' } }, set, { new: true });
  if (!updated) return Payment.findById(payment._id).populate(POP);
  await updated.populate(POP);
  const ref = razorpayPaymentId || updated.utr;
  await notifyAdmins({
    notificationType: 'payment_success',
    customerId: updated.customerId._id,
    paymentId: updated._id,
    title: 'Payment received',
    message: `${updated.customerId.fullName} paid ${inr(updated.amount)} (${LABEL[updated.paymentPurpose]}) for ${updated.flatId?.name || 'a flat'}.`,
    dedupeKey: `payment_success:${updated._id}`,
  }, {
    subject: `Payment received: ${inr(updated.amount)} from ${updated.customerId.fullName}`,
    heading: 'An online payment was received',
    rows: [['Tenant', updated.customerId.fullName], ['Phone', updated.customerId.contactNumber], ['Flat', updated.flatId?.name], ['For', LABEL[updated.paymentPurpose]],
      ['Amount', inr(updated.amount)], ['Method', updated.paymentMethod === 'upi_qr' ? 'UPI QR' : 'Razorpay'], ['Reference', ref]],
    cta: '/admin?tab=payments',
  });
  emitToAdmins('payment:changed', { id: updated._id });
  const u = await User.findById(updated.customerId.userId).select('email');
  if (u) sendUserEmail(u.email, {
    subject: `Payment receipt: ${inr(updated.amount)} for ${LABEL[updated.paymentPurpose]}`, heading: 'Payment received, thank you',
    intro: 'This is your receipt. Our team will contact you about the next steps for moving in.',
    rows: [['Flat', updated.flatId?.name], ['For', LABEL[updated.paymentPurpose]], ['Amount', inr(updated.amount)], ['Reference', ref]],
    cta: '/dashboard', ctaLabel: 'View my payments',
  });
  return updated;
}

// POST /api/payments/order  { flatId, purpose }  -> data for Razorpay Checkout
exports.createOrder = asyncHandler(async (req, res) => {
  const { flatId, purpose } = req.body;
  const rzp = getClient();
  const { flat, amount } = await checkPayable(req, flatId, purpose);

  let payment = await Payment.findOne({ customerId: req.customer._id, flatId, paymentPurpose: purpose, paymentStatus: 'pending', paymentMethod: 'razorpay' });
  if (payment && payment.amount !== amount) { payment.paymentStatus = 'failed'; await payment.save(); payment = null; } // price changed
  if (!payment) {
    payment = await Payment.create({ customerId: req.customer._id, flatId, paymentPurpose: purpose, amount });
    try {
      const order = await rzp.orders.create({
        amount: Math.round(amount * 100), currency: 'INR', receipt: String(payment._id),
        notes: { flatId: String(flat._id), customerId: String(req.customer._id), purpose },
      });
      payment.razorpayOrderId = order.id;
      await payment.save();
    } catch (e) {
      console.error('razorpay order failed:', e?.error?.description || e.message);
      await payment.deleteOne();
      throw new ApiError(502, 'Could not start the payment. Please try again.');
    }
  }
  res.json({
    keyId: keyId(), orderId: payment.razorpayOrderId, amount: Math.round(amount * 100), currency: 'INR',
    description: `${LABEL[purpose]} · ${flat.name}`,
    prefill: { name: req.customer.fullName, email: req.user.email, contact: req.customer.contactNumber },
  });
});

// POST /api/payments/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
exports.verify = asyncHandler(async (req, res) => {
  const { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig } = req.body;
  const payment = await Payment.findOne({ razorpayOrderId: oid, customerId: req.customer._id });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (!verifyPaymentSignature(oid, pid, sig)) throw new ApiError(400, 'Payment verification failed');
  res.json({ payment: await markPaid(payment, pid) });
});

// POST /api/payments/upi  { flatId, purpose, utr }  -> tenant paid by scanning the QR; admin must confirm
exports.submitUpi = asyncHandler(async (req, res) => {
  const { flatId, purpose } = req.body;
  const utr = String(req.body.utr).trim();
  const { flat, amount } = await checkPayable(req, flatId, purpose);
  if (await Payment.exists({ utr })) throw new ApiError(409, 'This transaction ID was already submitted.');
  const payment = await Payment.create({ customerId: req.customer._id, flatId, paymentPurpose: purpose, amount, paymentMethod: 'upi_qr', gateway: 'UPI QR', utr });
  await notifyAdmins({
    notificationType: 'payment_submitted',
    customerId: req.customer._id,
    paymentId: payment._id,
    title: 'UPI payment needs confirmation',
    message: `${req.customer.fullName} says they paid ${inr(amount)} (${LABEL[purpose]}) for ${flat.name} by UPI. Transaction ID ${utr}. Check your UPI app, then confirm.`,
    dedupeKey: `payment_submitted:${payment._id}`,
  }, {
    subject: `UPI payment to confirm: ${inr(amount)} from ${req.customer.fullName}`,
    heading: 'A tenant paid by UPI QR and needs confirmation',
    rows: [['Tenant', req.customer.fullName], ['Phone', req.customer.contactNumber], ['Flat', flat.name], ['For', LABEL[purpose]], ['Amount', inr(amount)], ['UPI transaction ID', utr]],
    cta: '/admin?tab=payments',
  });
  emitToAdmins('payment:changed', { id: payment._id });
  sendUserEmail(req.user.email, {
    subject: `We received your UPI payment details for ${flat.name}`, heading: 'Payment submitted',
    intro: 'Thank you. Our team will match the transaction in the UPI account and confirm it shortly. You will get a receipt by email.',
    rows: [['Flat', flat.name], ['For', LABEL[purpose]], ['Amount', inr(amount)], ['UPI transaction ID', utr]],
    cta: '/dashboard', ctaLabel: 'View my payments',
  });
  res.status(201).json({ payment });
});

// PATCH /api/payments/:id/confirm  (admin/staff) after checking the money arrived in the UPI account
exports.confirmUpi = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, paymentMethod: 'upi_qr' });
  if (!payment) throw new ApiError(404, 'UPI payment not found');
  const done = await markPaid(payment);
  await audit(req, 'payment.confirmUpi', 'Payment', payment._id, { utr: payment.utr });
  res.json({ payment: done });
});

// PATCH /api/payments/:id/reject  { reason? }
exports.rejectUpi = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, paymentMethod: 'upi_qr' });
  if (!payment) throw new ApiError(404, 'UPI payment not found');
  if (payment.paymentStatus === 'successful') throw new ApiError(409, 'This payment is already confirmed.');
  payment.paymentStatus = 'failed';
  payment.reviewNote = req.body.reason || undefined;
  await payment.save();
  await audit(req, 'payment.rejectUpi', 'Payment', payment._id, { utr: payment.utr });
  await payment.populate(POP);
  emitToAdmins('payment:changed', { id: payment._id });
  const u = await User.findById(payment.customerId.userId).select('email');
  if (u) sendUserEmail(u.email, {
    subject: `We could not match your UPI payment for ${payment.flatId?.name || 'your flat'}`, heading: 'Payment not matched',
    intro: `We could not find this transaction in our UPI account.${payment.reviewNote ? ` Note from our team: ${payment.reviewNote}` : ''} Please check the transaction ID and submit again, or contact us.`,
    rows: [['Flat', payment.flatId?.name], ['For', LABEL[payment.paymentPurpose]], ['Amount', inr(payment.amount)], ['UPI transaction ID', payment.utr]],
    cta: '/contact', ctaLabel: 'Contact us',
  });
  res.json({ payment });
});

// POST /api/payments/webhook  (raw body; registered in server.js before express.json)
exports.webhook = asyncHandler(async (req, res) => {
  if (!verifyWebhookSignature(req.body, req.get('x-razorpay-signature'))) return res.status(400).json({ message: 'Invalid signature' });
  const evt = JSON.parse(req.body.toString('utf8'));
  const entity = evt.payload?.payment?.entity;
  const payment = entity?.order_id && (await Payment.findOne({ razorpayOrderId: entity.order_id }));
  if (payment) {
    if (['payment.captured', 'order.paid'].includes(evt.event)) await markPaid(payment, entity.id);
    else if (evt.event === 'payment.failed' && payment.paymentStatus === 'pending') {
      await payment.populate(POP);
      await notifyAdmins({
        notificationType: 'payment_failed',
        customerId: payment.customerId._id,
        paymentId: payment._id,
        title: 'Payment failed',
        message: `${payment.customerId.fullName}'s ${inr(payment.amount)} payment (${LABEL[payment.paymentPurpose]}) for ${payment.flatId?.name || 'a flat'} failed.`,
        dedupeKey: `payment_failed:${payment._id}:${entity.id}`,
      });
      emitToAdmins('payment:changed', { id: payment._id });
    }
  }
  res.json({ ok: true });
});

// Tenant's own payments, including UPI ones that are still waiting for confirmation
exports.mine = asyncHandler(async (req, res) => {
  const payments = await Payment.find({
    customerId: req.customer._id,
    $or: [{ paymentStatus: { $in: ['successful', 'refunded'] } }, { paymentMethod: 'upi_qr' }],
  }).populate(POP[0]).sort('-createdAt');
  res.json({ payments });
});

exports.adminList = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.status) f.paymentStatus = String(req.query.status);
  res.json({ payments: await Payment.find(f).populate(POP).sort('-createdAt').limit(300) });
});
