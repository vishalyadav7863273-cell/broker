const User = require('../models/User');
const Customer = require('../models/Customer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/tokens');

// Verifies the Bearer access token and loads the user from DB (so deactivation takes effect immediately).
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not available');
  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, 'Forbidden'));
  next();
};

// Customer portal: user must have a linked customer profile. Attaches req.customer.
const requireCustomer = asyncHandler(async (req, res, next) => {
  const customer = await Customer.findOne({ userId: req.user._id });
  if (!customer) throw new ApiError(403, 'Customer profile required');
  req.customer = customer;
  next();
});

const adminOnly = authorize('admin');
const staffOrAdmin = authorize('admin', 'staff');

module.exports = { protect, authorize, requireCustomer, adminOnly, staffOrAdmin };
