const { Notification } = require('../models/Activity');
const { emitToAdmins } = require('../socket');
const { sendAdminEmail } = require('./mailer');

// Saves a notification, pushes it live to connected admins and (optionally) emails the admin Gmail.
// Never throws: a notification failure must not break the tenant's booking/registration/payment.
// `email` = { subject, heading, rows: [[label, value]], cta: '/admin?tab=visits' }
exports.notifyAdmins = async (data, email) => {
  try {
    const n = await Notification.create(data);
    emitToAdmins('notification', n);
    if (email) sendAdminEmail(email); // fire and forget: don't make the tenant wait for SMTP
    return n;
  } catch (e) {
    if (e.code !== 11000) console.error('notifyAdmins failed:', e.message);
    return null;
  }
};
