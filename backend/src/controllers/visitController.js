const Flat = require('../models/Flat');
const { Visit } = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');
const User = require('../models/User');
const { notifyAdmins } = require('../utils/notify');
const { sendUserEmail } = require('../utils/mailer');
const { emitToAdmins, emitToUser } = require('../socket');

const POPULATE = [
  { path: 'customerId', select: 'fullName contactNumber userId preferredArea maxBudget requiredBHK tenantType' },
  { path: 'flatId', select: 'name propertyId area monthlyRent bhk status' },
  { path: 'assignedStaff', select: 'fullName' },
];
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// POST /api/visits  (tenant)
exports.create = asyncHandler(async (req, res) => {
  const { flatId, visitDate, visitTime } = req.body;
  const flat = await Flat.findById(flatId);
  if (!flat) throw new ApiError(404, 'Flat not found');
  if (flat.status !== 'available') throw new ApiError(409, 'This flat is not available for visits');

  const day = new Date(visitDate);
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  if (day < today) throw new ApiError(400, 'Visit date cannot be in the past');

  const dup = await Visit.findOne({ customerId: req.customer._id, flatId, status: { $in: ['pending', 'scheduled'] } });
  if (dup) throw new ApiError(409, 'You already have an active visit request for this flat');

  const visit = await Visit.create({ customerId: req.customer._id, flatId, visitDate: day, visitTime });
  await notifyAdmins({
    notificationType: 'visit_booked',
    customerId: req.customer._id,
    visitId: visit._id,
    title: 'New visit request',
    message: `${req.customer.fullName} (${req.customer.contactNumber}) wants to visit ${flat.name} on ${fmt(day)} at ${visitTime}.`,
    dedupeKey: `visit_booked:${visit._id}`,
  }, {
    subject: `New flat booking request: ${req.customer.fullName} → ${flat.name}`,
    heading: 'A tenant has booked a flat visit',
    rows: [['Tenant', req.customer.fullName], ['Phone', req.customer.contactNumber], ['Email', req.user.email], ['Flat', `${flat.name} (${flat.propertyId})`],
      ['Area', flat.area], ['Rent', `₹${flat.monthlyRent.toLocaleString('en-IN')}/month`], ['Visit', `${fmt(day)} at ${visitTime}`],
      ['Budget', req.customer.maxBudget && `₹${Number(req.customer.maxBudget).toLocaleString('en-IN')}/month`]],
    cta: '/admin?tab=visits',
  });
  emitToAdmins('visit:changed', { id: visit._id });
  sendUserEmail(req.user.email, {
    subject: `We got your visit request for ${flat.name}`,
    heading: 'Visit request received',
    intro: 'Thanks for booking. Our team will confirm your visit shortly and you will get another email.',
    rows: [['Flat', flat.name], ['Area', flat.area], ['Date', fmt(day)], ['Time', visitTime]],
    cta: `/flats/${flat._id}`, ctaLabel: 'View the flat',
  });
  res.status(201).json({ visit });
});

// GET /api/visits/my  (tenant)
exports.mine = asyncHandler(async (req, res) => {
  const visits = await Visit.find({ customerId: req.customer._id }).populate(POPULATE[1]).populate(POPULATE[2]).sort('-createdAt');
  res.json({ visits });
});

// PATCH /api/visits/:id/cancel  (tenant, own visits)
exports.cancelMine = asyncHandler(async (req, res) => {
  const visit = await Visit.findOne({ _id: req.params.id, customerId: req.customer._id }).populate(POPULATE[1]);
  if (!visit) throw new ApiError(404, 'Visit not found');
  if (!['pending', 'scheduled'].includes(visit.status)) throw new ApiError(400, `A ${visit.status} visit cannot be cancelled`);
  visit.status = 'cancelled';
  await visit.save();
  await notifyAdmins({
    notificationType: 'visit_cancelled',
    customerId: req.customer._id,
    visitId: visit._id,
    title: 'Visit cancelled by tenant',
    message: `${req.customer.fullName} cancelled the visit to ${visit.flatId?.name || 'a flat'} on ${fmt(visit.visitDate)} at ${visit.visitTime}.`,
    dedupeKey: `visit_cancelled:${visit._id}`,
  });
  emitToAdmins('visit:changed', { id: visit._id });
  res.json({ visit });
});

// GET /api/visits?status=  (admin/staff)
exports.adminList = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.status) f.status = String(req.query.status);
  const visits = await Visit.find(f).populate(POPULATE).sort('-createdAt').limit(300);
  res.json({ visits });
});

// PATCH /api/visits/:id  (admin/staff) body: status, visitDate, visitTime, assignedStaff
exports.adminUpdate = asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) throw new ApiError(404, 'Visit not found');
  const { status, visitDate, visitTime, assignedStaff } = req.body;
  const before = { status: visit.status, date: new Date(visit.visitDate).toISOString().slice(0, 10), time: visit.visitTime };
  if (status) visit.status = status;
  if (visitDate) visit.visitDate = new Date(visitDate);
  if (visitTime) visit.visitTime = visitTime;
  if (assignedStaff !== undefined) visit.assignedStaff = assignedStaff || undefined;
  await visit.save();
  await audit(req, 'visit.update', 'Visit', visit._id, { status, visitDate, visitTime, assignedStaff });
  await visit.populate(POPULATE);
  emitToAdmins('visit:changed', { id: visit._id });
  if (visit.customerId?.userId) {
    emitToUser(visit.customerId.userId, 'visit:updated', { id: visit._id, status: visit.status });
    const moved = before.date !== new Date(visit.visitDate).toISOString().slice(0, 10) || before.time !== visit.visitTime;
    const copy = visit.status !== before.status
      ? { scheduled: ['Your visit is confirmed', 'Our team will meet you at the flat at the time below.'],
          completed: ['Thanks for visiting', 'If you liked the flat, you can now pay the deposit, advance rent and brokerage online.'],
          cancelled: ['Your visit was cancelled', 'Please contact us or book another time if you still want to see the flat.'],
          'no-show': ['We missed you at the visit', 'You can book a new time whenever you are ready.'] }[visit.status]
      : (moved && visit.status === 'scheduled' ? ['Your visit was rescheduled', 'Please note the new date and time below.'] : null);
    if (copy) {
      const u = await User.findById(visit.customerId.userId).select('email');
      if (u) sendUserEmail(u.email, {
        subject: `${copy[0]}: ${visit.flatId?.name || 'your visit'}`, heading: copy[0], intro: copy[1],
        rows: [['Flat', visit.flatId?.name], ['Date', fmt(visit.visitDate)], ['Time', visit.visitTime], ['Assigned to', visit.assignedStaff?.fullName]],
        cta: visit.flatId ? `/flats/${visit.flatId._id}` : '/dashboard', ctaLabel: visit.status === 'completed' ? 'Pay online' : 'View details',
      });
    }
  }
  res.json({ visit });
});
