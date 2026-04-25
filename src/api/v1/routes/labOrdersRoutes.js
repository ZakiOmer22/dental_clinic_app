const router = require('express').Router();
const labController = require('../controllers/labController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');
const {
  createLabOrderSchema,
  updateLabOrderSchema,
  updateItemStatusSchema,
  receiveOrderSchema,
  labQuerySchema,
} = require('../validators/labValidator');

router.use(auth);

const validateQuery = (req, res, next) => {
  const { error, value } = labQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ error: error.details[0].message });
  req.query = value;
  next();
};

router.get('/', validateQuery, labController.getOrders);
router.get('/stats', labController.getStats);
router.get('/:id', labController.getOrder);
router.post('/', validate(createLabOrderSchema), labController.createOrder);
router.patch('/:id', validate(updateLabOrderSchema), labController.updateOrder);
router.post('/:id/receive', validate(receiveOrderSchema), labController.receiveOrder);
router.patch('/:orderId/items/:itemId', validate(updateItemStatusSchema), labController.updateItemStatus);

module.exports = router;