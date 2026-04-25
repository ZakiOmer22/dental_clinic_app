const router = require('express').Router();
const patientController = require('../controllers/patientController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');
const { 
  createPatientSchema, 
  updatePatientSchema, 
  patientQuerySchema 
} = require('../validators/patientValidator');

// All patient routes require authentication
router.use(auth);

// Query validation middleware
const validateQuery = (req, res, next) => {
  const { error, value } = patientQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

router.get('/', validateQuery, patientController.getPatients);
router.get('/stats', patientController.getStats);
router.get('/:id', patientController.getPatient);
router.post('/', validate(createPatientSchema), patientController.createPatient);
router.put('/:id', validate(updatePatientSchema), patientController.updatePatient);
router.patch('/:id', validate(updatePatientSchema), patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);
router.get('/:id/history', patientController.getPatientHistory);
router.get('/:id/balance', patientController.getPatientBalance);
router.get('/:id/files', patientController.getPatientFiles);
router.get('/:id/chart', patientController.getDentalChart);

module.exports = router;