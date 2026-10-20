const router = require('express').Router();
const { body, param } = require('express-validator');
const c = require('../controllers/flatController');
const validate = require('../middleware/validate');
const { protect, adminOnly, staffOrAdmin } = require('../middleware/auth');

const BHK = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK+'];
const rules = (create) => {
  const opt = (chain) => (create ? chain : chain.optional());
  return [
    opt(body('propertyId').trim().notEmpty().withMessage('Property ID is required')),
    opt(body('name').trim().notEmpty().withMessage('Name is required')),
    opt(body('address').trim().notEmpty().withMessage('Address is required')),
    opt(body('area').trim().notEmpty().withMessage('Area is required')),
    opt(body('monthlyRent').isFloat({ min: 0 }).withMessage('Valid monthly rent required')),
    opt(body('bhk').isIn(BHK).withMessage('Invalid BHK')),
    opt(body('furnishing').isIn(['furnished', 'semi-furnished', 'unfurnished']).withMessage('Invalid furnishing')),
    body('status').optional().isIn(['available', 'occupied', 'maintenance']),
    ...['carpetArea', 'bathrooms', 'balconies', 'ageOfProperty', 'maintenance'].map((k) => body(k).optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage(`${k} must be a positive number`)),
    body('facing').optional({ checkFalsy: true }).isIn(['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West']),
    body('preferredTenants').optional({ checkFalsy: true }).isIn(['any', 'family', 'bachelor']),
    body('parking').optional({ checkFalsy: true }).isIn(['none', 'bike', 'car', 'both']),
    body('availableFrom').optional({ checkFalsy: true }).isISO8601(),
    body('petsAllowed').optional().isBoolean(),
    body('photos').optional().isArray({ max: 12 }),
    body('photos.*').optional().matches(/^(https?:\/\/|\/uploads\/)/).withMessage('Photos must be uploaded files or http(s) links'),
    body('amenities').optional().isArray(),
  ];
};

router.get('/', c.list);
router.get('/areas', c.areas);
router.get('/:id', param('id').isMongoId(), validate, c.getOne);
router.post('/', protect, staffOrAdmin, rules(true), validate, c.create);
router.put('/:id', protect, staffOrAdmin, param('id').isMongoId(), rules(false), validate, c.update);
router.delete('/:id', protect, adminOnly, param('id').isMongoId(), validate, c.remove);

module.exports = router;
