const router = require('express').Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');
const {
  createItemSchema,
  updateItemSchema,
  stockInSchema,
  stockOutSchema,
  inventoryQuerySchema,
  transactionQuerySchema,
} = require('../validators/inventoryValidator');

router.use(auth);

// Query validation
const validateItemQuery = (req, res, next) => {
  const { error, value } = inventoryQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

const validateTransactionQuery = (req, res, next) => {
  const { error, value } = transactionQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

// Item routes
router.get('/items', validateItemQuery, inventoryController.getItems);
router.get('/items/alerts/low-stock', inventoryController.getLowStockAlerts);
router.get('/items/alerts/expiring', inventoryController.getExpiringItems);
router.get('/items/stats', inventoryController.getStats);
router.get('/items/:id', inventoryController.getItem);
router.post('/items', validate(createItemSchema), inventoryController.createItem);
router.patch('/items/:id', validate(updateItemSchema), inventoryController.updateItem);

// Stock routes
router.post('/stock/in', validate(stockInSchema), inventoryController.stockIn);
router.post('/stock/out', validate(stockOutSchema), inventoryController.stockOut);

// Transaction routes
router.get('/transactions', validateTransactionQuery, inventoryController.getTransactions);

module.exports = router;