const router = require('express').Router();
const controller = require('../controllers/userController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createUserSchema,
  updateUserSchema,
} = require('../validators/userValidator');

router.use(auth);

router.get('/', controller.getUsers);
router.get('/:id', controller.getUser);

router.post('/', validate(createUserSchema), controller.createUser);
router.put('/:id', validate(updateUserSchema), controller.updateUser);

router.patch('/:id/deactivate', controller.deactivateUser);

module.exports = router;