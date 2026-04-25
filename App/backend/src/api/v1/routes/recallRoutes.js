const router = require('express').Router();
const controller = require('../controllers/recallController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createRecallSchema,
  updateRecallSchema,
} = require('../validators/recallValidator');

router.use(auth);

router.get('/', controller.getRecalls);
router.get('/:id', controller.getRecall);

router.post('/', validate(createRecallSchema), controller.createRecall);
router.put('/:id', validate(updateRecallSchema), controller.updateRecall);

router.patch('/:id/complete', controller.completeRecall);

module.exports = router;