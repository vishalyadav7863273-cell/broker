const AuditLog = require('../models/AuditLog');

module.exports = async function audit(req, action, targetType, targetId, meta) {
  try {
    await AuditLog.create({ actorId: req.user?._id, action, targetType, targetId: String(targetId || ''), meta, ip: req.ip });
  } catch (e) {
    console.error('audit log failed:', e.message);
  }
};
