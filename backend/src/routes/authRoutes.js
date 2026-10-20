const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const c = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts, try again later' },
});

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Za-z]/)
  .withMessage('Password needs a letter')
  .matches(/\d/)
  .withMessage('Password needs a number');

const baseRegister = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').trim().matches(/^[0-9+\-\s]{10,15}$/).withMessage('Valid phone number required'),
  passwordRule,
];

router.post('/register', authLimiter, baseRegister, validate, c.registerUser);

router.post(
  '/customer/register',
  authLimiter,
  [
    ...baseRegister,
    body('consentForDataCollection').equals('true').withMessage('Consent is required').bail(),
    body('maxBudget').optional().isFloat({ min: 0 }),
    body('numberOfPeople').optional().isInt({ min: 1, max: 20 }),
    body('tenantType').optional().isIn(['family', 'bachelor']),
    body('expectedShiftingDate').optional().isISO8601().withMessage('Invalid shifting date'),
    body('linkedinProfile').optional({ checkFalsy: true }).isURL().withMessage('Invalid LinkedIn URL'),
  ],
  validate,
  c.registerCustomer
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('portal').optional().isIn(['user', 'customer', 'admin']),
  ],
  validate,
  c.login
);

router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.get('/me', protect, c.me);
router.put('/me', protect, [body('fullName').optional().trim().notEmpty()], validate, c.updateMe);

router.post('/forgot-password', authLimiter, [body('email').isEmail().normalizeEmail()], validate, c.forgotPassword);
router.post('/reset-password/:token', authLimiter, [passwordRule], validate, c.resetPassword);

module.exports = router;
