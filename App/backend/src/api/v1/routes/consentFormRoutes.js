const router = require('express').Router();
const controller = require('../controllers/consentFormController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createConsentFormSchema,
  updateConsentFormSchema,
  assignSchema,
  signSchema,
} = require('../validators/consentFormValidator');

router.use(auth);

router.get('/', controller.getConsentForms);
router.get('/:id', controller.getConsentForm);

router.post('/', validate(createConsentFormSchema), controller.createConsentForm);
router.put('/:id', validate(updateConsentFormSchema), controller.updateConsentForm);

router.post('/:id/assign', validate(assignSchema), controller.assignToPatient);
router.post('/:id/sign', validate(signSchema), controller.signConsentForm);

module.exports = router;