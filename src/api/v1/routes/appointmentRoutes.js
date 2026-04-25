const router = require('express').Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');
const {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentQuerySchema,
  checkAvailabilitySchema,
} = require('../validators/appointmentValidator');

router.use(auth);

// Query validation
const validateQuery = (req, res, next) => {
  const { error, value } = appointmentQuerySchema.validate(req.query, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

router.get('/', validateQuery, appointmentController.getAppointments);
router.get('/today', appointmentController.getTodayAppointments);
router.get('/stats', appointmentController.getStats);
router.post('/check-availability', validate(checkAvailabilitySchema), appointmentController.checkAvailability);
router.get('/:id', appointmentController.getAppointment);
router.post('/', validate(createAppointmentSchema), appointmentController.createAppointment);
router.put('/:id', validate(updateAppointmentSchema), appointmentController.updateAppointment);
router.patch('/:id', validate(updateAppointmentSchema), appointmentController.updateAppointment);
router.post('/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;