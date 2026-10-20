const Flat = require('../models/Flat');
const { Visit } = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const audit = require('../utils/audit');

const FIELDS = ['propertyId', 'name', 'address', 'area', 'monthlyRent', 'securityDeposit', 'advanceRent', 'brokerage', 'bhk', 'furnishing', 'floor', 'photos', 'amenities', 'status', 'description',
  'carpetArea', 'bathrooms', 'balconies', 'facing', 'ageOfProperty', 'availableFrom', 'maintenance', 'preferredTenants', 'parking', 'petsAllowed'];
const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = (body) => Object.fromEntries(FIELDS.filter((k) => body[k] !== undefined && body[k] !== '').map((k) => [k, body[k]]));

// GET /api/flats?area=&bhk=&furnishing=&status=&maxRent=   (public)
exports.list = asyncHandler(async (req, res) => {
  const { area, bhk, furnishing, status, maxRent } = req.query;
  const f = {};
  if (area) f.area = new RegExp(`^${esc(area.trim())}$`, 'i');
  if (bhk) f.bhk = String(bhk);
  if (furnishing) f.furnishing = String(furnishing);
  if (status) f.status = String(status);
  if (maxRent && Number(maxRent) > 0) f.monthlyRent = { $lte: Number(maxRent) };
  res.json({ flats: await Flat.find(f).sort('-createdAt').limit(200) });
});

exports.areas = asyncHandler(async (req, res) => {
  res.json({ areas: (await Flat.distinct('area')).sort() });
});

exports.getOne = asyncHandler(async (req, res) => {
  const flat = await Flat.findById(req.params.id);
  if (!flat) throw new ApiError(404, 'Flat not found');
  res.json({ flat });
});

exports.create = asyncHandler(async (req, res) => {
  const flat = await Flat.create(pick(req.body));
  await audit(req, 'flat.create', 'Flat', flat._id, { propertyId: flat.propertyId });
  res.status(201).json({ flat });
});

exports.update = asyncHandler(async (req, res) => {
  const flat = await Flat.findById(req.params.id);
  if (!flat) throw new ApiError(404, 'Flat not found');
  flat.set(pick(req.body));
  await flat.save();
  await audit(req, 'flat.update', 'Flat', flat._id);
  res.json({ flat });
});

exports.remove = asyncHandler(async (req, res) => {
  const flat = await Flat.findById(req.params.id);
  if (!flat) throw new ApiError(404, 'Flat not found');
  const active = await Visit.countDocuments({ flatId: flat._id, status: { $in: ['pending', 'scheduled'] } });
  if (active) throw new ApiError(409, 'This flat has active visits. Cancel or complete them first.');
  await flat.deleteOne();
  await audit(req, 'flat.delete', 'Flat', flat._id, { propertyId: flat.propertyId });
  res.json({ message: 'Flat deleted' });
});
