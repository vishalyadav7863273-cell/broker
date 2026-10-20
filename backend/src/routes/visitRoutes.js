const router = require('express').Router();
const { body, param } = require('express-validator');
const c = require('../controllers/visitController');
const validate = require('../middleware/validate');
const { protect, requireCustomer, staffOrAdmin } = require('../middleware/auth');

router.use(protect);

router.post('/', requireCustomer,
  [body('flatId').isMongoId(), body('visitDate').isISO8601().withMessage('Valid visit date required'), body('visitTime').trim().notEmpty().withMessage('Visit time required')],
  validate, c.create);
router.get('/my', requireCustomer, c.mine);
router.patch('/:id/cancel', requireCustomer, param('id').isMongoId(), validate, c.cancelMine);

router.get('/', staffOrAdmin, c.adminList);
router.patch('/:id', staffOrAdmin,
  [
    param('id').isMongoId(),
    body('status').optional().isIn(['pending', 'scheduled', 'completed', 'cancelled', 'no-show']),
    body('visitDate').optional().isISO8601(),
    body('visitTime').optional().trim().notEmpty(),
    body('assignedStaff').optional({ nullable: true, checkFalsy: true }).isMongoId(),
  ],
  validate, c.adminUpdate);

module.exports = router;
