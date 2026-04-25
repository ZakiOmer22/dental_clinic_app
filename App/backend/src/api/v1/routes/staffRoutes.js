const router = require('express').Router();
const controller = require('../controllers/staffController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createStaffSchema,
  updateStaffSchema,
} = require('../validators/staffValidator');

router.use(auth);

router.get('/', controller.getStaff);
router.get('/:id', controller.getStaffById);

router.post('/', validate(createStaffSchema), controller.createStaff);
router.put('/:id', validate(updateStaffSchema), controller.updateStaff);

router.patch('/:id/deactivate', controller.deactivateStaff);

module.exports = router;