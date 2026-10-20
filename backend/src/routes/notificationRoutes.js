const router = require('express').Router();
const { param } = require('express-validator');
const { Notification } = require('../models/Activity');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { protect, staffOrAdmin } = require('../middleware/auth');

// Admin/staff share one notification inbox.
router.use(protect, staffOrAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const [notifications, unread] = await Promise.all([
    Notification.find().sort('-createdAt').limit(limit),
    Notification.countDocuments({ readStatus: false }),
  ]);
  res.json({ notifications, unread });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany({ readStatus: false }, { readStatus: true });
  res.json({ unread: 0 });
}));

router.patch('/:id/read', param('id').isMongoId(), validate, asyncHandler(async (req, res) => {
  const n = await Notification.findByIdAndUpdate(req.params.id, { readStatus: true }, { new: true });
  if (!n) throw new ApiError(404, 'Notification not found');
  res.json({ notification: n, unread: await Notification.countDocuments({ readStatus: false }) });
}));

module.exports = router;
