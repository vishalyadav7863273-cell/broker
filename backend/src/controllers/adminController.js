const User = require('../models/User');
const Customer = require('../models/Customer');
const Flat = require('../models/Flat');
const { Visit, Notification, Payment } = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.overview = asyncHandler(async (req, res) => {
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(+today + 864e5);
  const [totalFlats, available, occupied, pendingVisits, todayVisits, customers, unreadNotifications, paid] = await Promise.all([
    Flat.countDocuments(),
    Flat.countDocuments({ status: 'available' }),
    Flat.countDocuments({ status: 'occupied' }),
    Visit.countDocuments({ status: 'pending' }),
    Visit.countDocuments({ status: 'scheduled', visitDate: { $gte: today, $lt: tomorrow } }),
    Customer.countDocuments(),
    Notification.countDocuments({ readStatus: false }),
    Payment.aggregate([{ $match: { paymentStatus: 'successful' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  res.json({ stats: { totalFlats, available, occupied, pendingVisits, todayVisits, customers, unreadNotifications, collected: paid[0]?.total || 0 } });
});

exports.customers = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.search) {
    const r = new RegExp(esc(req.query.search), 'i');
    f.$or = [{ fullName: r }, { contactNumber: r }, { preferredArea: r }];
  }
  const customers = await Customer.find(f).populate('userId', 'email isActive').sort('-createdAt').limit(200);
  res.json({ customers });
});

// Active admins + staff (used for visit assignment)
exports.staff = asyncHandler(async (req, res) => {
  res.json({ staff: await User.find({ role: { $in: ['admin', 'staff'] }, isActive: true }).select('fullName role') });
});

exports.users = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.role) f.role = String(req.query.role);
  res.json({ users: await User.find(f).sort('-createdAt').limit(300).then((u) => u.map((x) => x.toSafeJSON())) });
});

exports.createStaff = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, 'Email already registered');
  const user = await User.create({ fullName, email, phone, passwordHash: await User.hashPassword(password), role: 'staff', isVerified: true });
  await audit(req, 'user.createStaff', 'User', user._id);
  res.status(201).json({ user: user.toSafeJSON() });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (String(user._id) === String(req.user._id)) throw new ApiError(400, 'You cannot change your own account here');
  const { isActive, role } = req.body;
  if (isActive !== undefined) {
    user.isActive = isActive;
    if (!isActive) user.tokenVersion += 1; // log them out everywhere
  }
  if (role) user.role = role;
  await user.save();
  await audit(req, 'user.update', 'User', user._id, { isActive, role });
  res.json({ user: user.toSafeJSON() });
});
