const router = require('express').Router();
const billingController = require('../controllers/billingController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');
const {
  createInvoiceSchema,
  updateInvoiceSchema,
  createPaymentSchema,
  invoiceQuerySchema,
  paymentQuerySchema,
} = require('../validators/billingValidator');

router.use(auth);

// Query validation
const validateInvoiceQuery = (req, res, next) => {
  const { error, value } = invoiceQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

const validatePaymentQuery = (req, res, next) => {
  const { error, value } = paymentQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

// Invoice routes
router.get('/invoices', validateInvoiceQuery, billingController.getInvoices);
router.get('/invoices/stats', billingController.getStats);
router.get('/invoices/:id', billingController.getInvoice);
router.post('/invoices', validate(createInvoiceSchema), billingController.createInvoice);
router.patch('/invoices/:id', validate(updateInvoiceSchema), billingController.updateInvoice);

// Payment routes
router.get('/payments', validatePaymentQuery, billingController.getPayments);
router.post('/payments', validate(createPaymentSchema), billingController.addPayment);

module.exports = router;