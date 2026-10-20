const nodemailer = require('nodemailer');

// Escape anything a tenant typed before putting it in an email body.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let transport;
const configured = () => process.env.MAIL_DRY_RUN === 'true' || (process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransport = () => {
  if (transport) return transport;
  transport = process.env.MAIL_DRY_RUN === 'true'
    ? nodemailer.createTransport({ jsonTransport: true }) // prints the email instead of sending (dev)
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: (Number(process.env.SMTP_PORT) || 465) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
  return transport;
};

const adminRecipients = () =>
  (process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean);

exports.esc = esc;

// Never throws: a mail problem must not break a booking, registration or payment.
exports.sendMail = async ({ to, subject, html, text }) => {
  if (!configured() || !to || (Array.isArray(to) && !to.length)) return false;
  try {
    const info = await getTransport().sendMail({
      from: process.env.MAIL_FROM || `HomeKey <${process.env.SMTP_USER || 'no-reply@homekey.local'}>`,
      to, subject, html, text,
    });
    if (process.env.MAIL_DRY_RUN === 'true') console.log('[MAIL DRY RUN]', JSON.parse(info.message).subject, '->', to);
    return true;
  } catch (e) {
    console.error('mail failed:', e.message);
    return false;
  }
};

const clientBase = () => (process.env.CLIENT_URLS || 'http://localhost:5173').split(',')[0].trim();

// One look for every email: eyebrow, heading, optional intro, a small details table and a button.
const render = ({ eyebrow, heading, intro, rows = [], cta, ctaLabel }) => {
  const link = `${clientBase()}${cta || ''}`;
  const table = rows.filter(([, v]) => v).map(([k, v]) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#66726B">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1C3B30">
    <p style="margin:0 0 4px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#66726B">${esc(eyebrow)}</p>
    <h2 style="margin:0 0 16px">${esc(heading)}</h2>
    ${intro ? `<p style="margin:0 0 16px;line-height:1.5">${esc(intro)}</p>` : ''}
    <table style="border-collapse:collapse;font-size:15px">${table}</table>
    <p style="margin:24px 0"><a href="${esc(link)}" style="background:#1C3B30;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">${esc(ctaLabel || 'Open HomeKey')}</a></p>
    <p style="font-size:12px;color:#66726B">HomeKey · Find a place to belong</p>
  </div>`;
  const text = `${heading}\n\n${intro ? intro + '\n\n' : ''}${rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${link}`;
  return { html, text };
};
exports.render = render;

// Email to the admin's Gmail.
exports.sendAdminEmail = ({ subject, heading, rows, cta }) =>
  exports.sendMail({ to: adminRecipients(), subject, ...render({ eyebrow: 'HomeKey admin alert', heading, rows, cta, ctaLabel: 'Open admin dashboard' }) });

// Email to a tenant / user.
exports.sendUserEmail = (to, { subject, heading, intro, rows, cta, ctaLabel }) =>
  exports.sendMail({ to, subject, ...render({ eyebrow: 'HomeKey', heading, intro, rows, cta, ctaLabel }) });
