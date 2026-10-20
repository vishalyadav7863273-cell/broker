const crypto = require('crypto');
const User = require('../models/User');
const Customer = require('../models/Customer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notifyAdmins } = require('../utils/notify');
const { sendMail, sendUserEmail, esc } = require('../utils/mailer');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} = require('../utils/tokens');

const issueSession = (res, user, extra = {}) => {
  res.cookie('refreshToken', signRefreshToken(user), refreshCookieOptions());
  return res.json({ accessToken: signAccessToken(user), user: user.toSafeJSON(), ...extra });
};

// POST /api/auth/register  -> User portal (role: user)
exports.registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, 'Email already registered');
  const user = await User.create({
    fullName,
    email,
    phone,
    passwordHash: await User.hashPassword(password),
    role: 'user',
  });
  res.status(201);
  return issueSession(res, user);
});

// POST /api/auth/customer/register -> Tenant portal: creates login (users) + tenant profile (customers)
exports.registerCustomer = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, consentForDataCollection, ...profile } = req.body;
  if (!consentForDataCollection) throw new ApiError(400, 'Consent for data collection is required');
  if (await User.findOne({ email })) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    fullName,
    email,
    phone,
    passwordHash: await User.hashPassword(password),
    role: 'user',
  });
  let customer;
  try {
    customer = await Customer.create({
      ...profile,
      userId: user._id,
      fullName,
      contactNumber: phone,
      consentForDataCollection: true,
      consentAt: new Date(),
    });
  } catch (e) {
    await User.deleteOne({ _id: user._id }); // keep both collections consistent
    throw e;
  }
  const details = [profile.requiredBHK, profile.tenantType, profile.maxBudget && `budget ₹${profile.maxBudget}`, profile.preferredArea].filter(Boolean).join(' · ');
  await notifyAdmins({
    notificationType: 'customer_registered',
    customerId: customer._id,
    title: 'New tenant registered',
    message: `${fullName} (${phone}) created a tenant profile${details ? `: ${details}` : ''}.`,
    dedupeKey: `customer_registered:${customer._id}`,
  }, {
    subject: `New tenant registered: ${fullName}`,
    heading: 'A new tenant has registered',
    rows: [['Name', fullName], ['Phone', phone], ['Email', email], ['Looking for', [profile.requiredBHK, profile.tenantType].filter(Boolean).join(' · ')],
      ['Budget', profile.maxBudget && `₹${Number(profile.maxBudget).toLocaleString('en-IN')}/month`], ['Preferred area', profile.preferredArea], ['Shifting date', profile.expectedShiftingDate]],
    cta: '/admin?tab=customers',
  });
  sendUserEmail(email, {
    subject: 'Welcome to HomeKey', heading: `Welcome, ${fullName.split(' ')[0]}`,
    intro: 'Your tenant profile is ready. Browse homes, book a visit, and pay online once you have seen the flat.',
    cta: '/flats', ctaLabel: 'Browse homes',
  });
  res.status(201);
  return issueSession(res, user, { customer });
});

// POST /api/auth/login   body: { email, password, portal: 'user' | 'customer' | 'admin' }
exports.login = asyncHandler(async (req, res) => {
  const { email, password, portal = 'user' } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // same message for unknown email / wrong password
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  if (portal === 'admin') {
    if (!['admin', 'staff'].includes(user.role)) throw new ApiError(403, 'Not an admin account');
    return issueSession(res, user);
  }
  if (['admin', 'staff'].includes(user.role)) throw new ApiError(403, 'Please use the admin login');
  if (portal === 'customer') {
    const customer = await Customer.findOne({ userId: user._id });
    if (!customer) throw new ApiError(403, 'No tenant profile found. Please register as a tenant.');
    return issueSession(res, user, { customer });
  }
  return issueSession(res, user);
});

// POST /api/auth/refresh  (uses httpOnly cookie)
exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token');
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || user.tokenVersion !== payload.tv) throw new ApiError(401, 'Session expired');
  return issueSession(res, user);
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', refreshCookieOptions());
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ userId: req.user._id });
  res.json({ user: req.user.toSafeJSON(), customer });
});

// PUT /api/auth/me
exports.updateMe = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  if (fullName) req.user.fullName = fullName;
  if (phone) req.user.phone = phone;
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});

// POST /api/auth/forgot-password
// Email sending is not configured yet: in development the reset link is printed in the server console.
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const raw = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const link = `${(process.env.CLIENT_URLS || '').split(',')[0]}/reset-password/${raw}`;
    if (process.env.NODE_ENV !== 'production') console.log(`[DEV] Password reset link for ${user.email}: ${link}`);
    sendMail({
      to: user.email, subject: 'Reset your HomeKey password',
      html: `<p>Hi ${esc(user.fullName)},</p><p>Use this link within 30 minutes to choose a new password:</p><p><a href="${esc(link)}">${esc(link)}</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
      text: `Reset your password (valid 30 minutes): ${link}`,
    });
  }
  // Always same response to avoid revealing which emails exist
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res) => {
  const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpires');
  if (!user) throw new ApiError(400, 'Reset link is invalid or expired');

  user.passwordHash = await User.hashPassword(req.body.password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion += 1; // invalidates all existing refresh tokens
  await user.save();
  res.json({ message: 'Password updated. Please log in.' });
});
