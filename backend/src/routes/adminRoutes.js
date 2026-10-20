const router = require('express').Router();
const { body, param } = require('express-validator');
const c = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { protect, adminOnly, staffOrAdmin } = require('../middleware/auth');

router.use(protect);

router.get('/overview', staffOrAdmin, c.overview);
router.get('/customers', staffOrAdmin, c.customers);
router.get('/staff', staffOrAdmin, c.staff);

// User & staff management: admin only
router.get('/users', adminOnly, c.users);
router.post('/users', adminOnly,
  [
    body('fullName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().matches(/^[0-9+\-\s]{10,15}$/).withMessage('Valid phone number required'),
    body('password').isLength({ min: 8 }).matches(/[A-Za-z]/).matches(/\d/).withMessage('Password needs 8+ characters, a letter and a number'),
  ],
  validate, c.createStaff);
router.patch('/users/:id', adminOnly,
  [param('id').isMongoId(), body('isActive').optional().isBoolean().toBoolean(), body('role').optional().isIn(['admin', 'staff', 'user'])],
  validate, c.updateUser);

module.exports = router;
