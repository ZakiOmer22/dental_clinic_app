const router = require('express').Router();
const prescriptionController = require('../controllers/prescriptionController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');
const {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  addRefillSchema,
  prescriptionQuerySchema,
  medicationQuerySchema,
} = require('../validators/prescriptionValidator');

router.use(auth);

// Query validation
const validateQuery = (req, res, next) => {
  const { error, value } = prescriptionQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

router.get('/', validateQuery, prescriptionController.getPrescriptions);
router.get('/stats', prescriptionController.getStats);
router.get('/medications/search', prescriptionController.searchMedications);
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);
router.get('/:id', prescriptionController.getPrescription);
router.post('/', validate(createPrescriptionSchema), prescriptionController.createPrescription);
router.patch('/:id', validate(updatePrescriptionSchema), prescriptionController.updatePrescription);
router.post('/:id/refill', validate(addRefillSchema), prescriptionController.addRefill);
router.post('/:id/cancel', prescriptionController.cancelPrescription);

module.exports = router;