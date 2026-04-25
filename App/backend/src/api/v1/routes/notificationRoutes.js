const router = require('express').Router();
const controller = require('../controllers/notificationController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createNotificationSchema,
} = require('../validators/notificationValidator');

router.use(auth);

router.get('/', controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/:id/read', controller.markAsRead);
router.post('/read-all', controller.markAllAsRead);

// internal/system usage
router.post('/', validate(createNotificationSchema), controller.createNotification);

module.exports = router;