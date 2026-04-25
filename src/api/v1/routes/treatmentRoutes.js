const router = require('express').Router();
const treatmentController = require('../controllers/treatmentController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');
const {
  createTreatmentSchema,
  updateTreatmentSchema,
  treatmentQuerySchema,
} = require('../validators/treatmentValidator');

router.use(auth);

// Query validation
const validateQuery = (req, res, next) => {
  const { error, value } = treatmentQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

router.get('/', validateQuery, treatmentController.getTreatments);
router.get('/categories', treatmentController.getCategories);
router.get('/popular', treatmentController.getPopular);
router.get('/stats', treatmentController.getStats);
router.get('/:id', treatmentController.getTreatment);
router.post('/', validate(createTreatmentSchema), treatmentController.createTreatment);
router.post('/bulk-import', treatmentController.bulkImport);
router.put('/:id', validate(updateTreatmentSchema), treatmentController.updateTreatment);
router.patch('/:id', validate(updateTreatmentSchema), treatmentController.updateTreatment);
router.delete('/:id', treatmentController.deleteTreatment);

module.exports = router;