const router = require('express').Router();
const controller = require('../controllers/reportController');
const auth = require('../../../middleware/auth');

router.use(auth);

router.get('/appointments', controller.getAppointmentReport);
router.get('/revenue', controller.getRevenueReport);
router.get('/patients', controller.getPatientStats);
router.get('/treatments', controller.getTreatmentReport);
router.get('/recalls', controller.getRecallReport);

// export
router.get('/export/:type', controller.exportReport);

module.exports = router;