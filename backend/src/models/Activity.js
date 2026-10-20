const mongoose = require('mongoose');

/**
 * ONE MongoDB collection: "visits_payments_notifications"
 * Three logically separate Mongoose models (discriminators) keyed by `recordType`.
 * To split later, point each discriminator at its own collection - API stays the same.
 */
const baseOptions = { collection: 'visits_payments_notifications', discriminatorKey: 'recordType', timestamps: true };

const Activity = mongoose.model('Activity', new mongoose.Schema({}, baseOptions));

const Visit = Activity.discriminator(
  'visit',
  new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true, index: true },
    visitDate: { type: Date, required: true, index: true },
    visitTime: { type: String, required: true },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
      index: true,
    },
  })
);

const Payment = Activity.discriminator(
  'payment',
  new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true },
    paymentPurpose: {
      type: String,
      enum: ['visit_fee', 'booking_amount', 'advance_rent', 'security_deposit', 'brokerage'],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 }, // in INR (rupees); converted to paise only when talking to Razorpay
    currency: { type: String, default: 'INR', enum: ['INR'] },
    gateway: { type: String, default: 'Razorpay' },
    // 'upi_qr' = tenant paid by scanning the QR and submitted the 12-digit UPI transaction ID; admin confirms it manually.
    paymentMethod: { type: String, enum: ['razorpay', 'upi_qr'], default: 'razorpay', index: true },
    utr: { type: String, index: true, sparse: true, unique: true },
    reviewNote: { type: String, maxlength: 200 },
    razorpayOrderId: { type: String, index: true, sparse: true, unique: true },
    razorpayPaymentId: { type: String, index: true, sparse: true, unique: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'successful', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    idempotencyKey: { type: String, index: true, sparse: true, unique: true },
    transactionDate: { type: Date },
  })
);

const Notification = Activity.discriminator(
  'notification',
  new mongoose.Schema({
    notificationType: {
      type: String,
      enum: ['visit_booked', 'visit_cancelled', 'visit_rescheduled', 'payment_success', 'payment_failed', 'payment_submitted', 'customer_registered'],
      required: true,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readStatus: { type: Boolean, default: false, index: true },
    // dedupe: same event => same key => only one notification
    dedupeKey: { type: String, unique: true, sparse: true },
  })
);

Activity.collection.createIndex({ recordType: 1, createdAt: -1 }).catch(() => {});

module.exports = { Activity, Visit, Payment, Notification };
