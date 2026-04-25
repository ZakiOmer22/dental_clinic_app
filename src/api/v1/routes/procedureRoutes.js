const router = require('express').Router();
const controller = require('../controllers/procedureController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createProcedureSchema,
  updateProcedureSchema,
  statusSchema,
} = require('../validators/procedureValidator');

router.use(auth);

router.get('/', controller.getProcedures);
router.get('/:id', controller.getProcedure);

router.post('/', validate(createProcedureSchema), controller.createProcedure);
router.put('/:id', validate(updateProcedureSchema), controller.updateProcedure);

router.patch('/:id/status', validate(statusSchema), controller.updateStatus);

module.exports = router;