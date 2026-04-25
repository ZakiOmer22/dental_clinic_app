const router = require('express').Router();
const controller = require('../controllers/roomController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createRoomSchema,
  updateRoomSchema,
} = require('../validators/roomValidator');

router.use(auth);

router.get('/', controller.getRooms);
router.get('/:id', controller.getRoom);

router.post('/', validate(createRoomSchema), controller.createRoom);
router.put('/:id', validate(updateRoomSchema), controller.updateRoom);

router.patch('/:id/deactivate', controller.deactivateRoom);

module.exports = router;