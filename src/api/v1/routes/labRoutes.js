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
  createLabSchema,
} = require('../validators/labValidator');

router.use(auth);

// Query validation
const validateQuery = (req, res, next) => {
  const { error, value } = labQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

// Lab routes
router.get('/labs', labController.getLabs);
router.get('/labs/:id', labController.getLab);
router.post('/labs', validate(createLabSchema), labController.createLab);

// Order routes
router.get('/orders', validateQuery, labController.getOrders);
router.get('/orders/stats', labController.getStats);
router.get('/orders/:id', labController.getOrder);
router.post('/orders', validate(createLabOrderSchema), labController.createOrder);
router.patch('/orders/:id', validate(updateLabOrderSchema), labController.updateOrder);
router.post('/orders/:id/receive', validate(receiveOrderSchema), labController.receiveOrder);
router.patch('/orders/:orderId/items/:itemId', validate(updateItemStatusSchema), labController.updateItemStatus);

module.exports = router;