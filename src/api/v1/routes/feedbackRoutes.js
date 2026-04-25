const router = require('express').Router();
const controller = require('../controllers/feedbackController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
} = require('../validators/feedbackValidator');

router.use(auth);

router.get('/', (req, res) => res.json({ success: true, data: [], total: 0 }));
router.get('/stats', (req, res) => res.json({ success: true, data: { total: 0, averageRating: 0 } }));
router.get('/:id', controller.getFeedbackById);
router.post('/', validate(createFeedbackSchema), controller.createFeedback);
router.patch('/:id/status', validate(updateFeedbackStatusSchema), controller.updateFeedbackStatus);

module.exports = router;