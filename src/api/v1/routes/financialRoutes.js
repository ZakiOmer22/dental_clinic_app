const router = require('express').Router();
const controller = require('../controllers/financialController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createInvoiceSchema,
  recordPaymentSchema,
} = require('../validators/financialValidator');

router.use(auth);

router.get('/taxes', (req, res) => res.json({ success: true, data: [] }));
router.get('/payment-terms', (req, res) => res.json({ success: true, data: [] }));
router.get('/settings', (req, res) => res.json({ success: true, data: { taxRate: 0, currency: 'USD' } }));
router.get('/invoices', controller.getInvoices);
router.get('/invoices/:id', controller.getInvoice);

router.post('/invoices', validate(createInvoiceSchema), controller.createInvoice);
router.post('/invoices/:id/payment', validate(recordPaymentSchema), controller.recordPayment);

module.exports = router;