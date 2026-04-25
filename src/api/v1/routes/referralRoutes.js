const router = require('express').Router();
const controller = require('../controllers/referralController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createReferralSchema,
  updateReferralSchema,
  statusSchema,
  feedbackSchema,
} = require('../validators/referralValidator');

router.use(auth);

router.get('/', controller.getReferrals);
router.get('/:id', controller.getReferral);

router.post('/', validate(createReferralSchema), controller.createReferral);
router.put('/:id', validate(updateReferralSchema), controller.updateReferral);

router.patch('/:id/status', validate(statusSchema), controller.updateStatus);
router.post('/:id/feedback', validate(feedbackSchema), controller.addFeedback);

module.exports = router;