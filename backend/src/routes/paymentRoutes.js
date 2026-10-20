const router = require('express').Router();
const { body, param } = require('express-validator');
const c = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const { protect, requireCustomer, staffOrAdmin } = require('../middleware/auth');

router.use(protect);

router.post('/order', requireCustomer,
  [body('flatId').isMongoId(), body('purpose').isIn(['security_deposit', 'advance_rent', 'brokerage'])],
  validate, c.createOrder);
router.post('/verify', requireCustomer,
  [body('razorpay_order_id').isString().notEmpty(), body('razorpay_payment_id').isString().notEmpty(), body('razorpay_signature').isString().notEmpty()],
  validate, c.verify);
router.post('/upi', requireCustomer,
  [body('flatId').isMongoId(), body('purpose').isIn(['security_deposit', 'advance_rent', 'brokerage']), body('utr').trim().matches(/^\d{12}$/).withMessage('The UPI transaction ID is 12 digits')],
  validate, c.submitUpi);
router.get('/my', requireCustomer, c.mine);
router.patch('/:id/confirm', staffOrAdmin, param('id').isMongoId(), validate, c.confirmUpi);
router.patch('/:id/reject', staffOrAdmin, [param('id').isMongoId(), body('reason').optional().trim().isLength({ max: 200 })], validate, c.rejectUpi);
router.get('/', staffOrAdmin, c.adminList);

module.exports = router;
