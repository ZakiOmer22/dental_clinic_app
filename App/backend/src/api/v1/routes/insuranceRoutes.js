const router = require('express').Router();
const controller = require('../controllers/insuranceController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createInsuranceSchema,
  updateInsuranceSchema,
} = require('../validators/insuranceValidator');

router.use(auth);

router.get('/', (req, res) => res.json({ success: true, data: [], total: 0 }));
router.get('/policies', (req, res) => res.json({ success: true, data: [], total: 0 }));
router.get('/claims', (req, res) => res.json({ success: true, data: [], total: 0 }));
router.get('/:id', controller.getInsuranceById);

router.post('/', validate(createInsuranceSchema), controller.createInsurance);
router.put('/:id', validate(updateInsuranceSchema), controller.updateInsurance);

module.exports = router;