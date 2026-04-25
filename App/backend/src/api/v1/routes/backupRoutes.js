const router = require('express').Router();
const controller = require('../controllers/backupController');
const auth = require('../../../middleware/auth');

router.use(auth);

router.get('/', controller.getBackups);
router.post('/', controller.createBackup);
router.post('/:id/restore', controller.restoreBackup);
router.delete('/:id', controller.deleteBackup);

module.exports = router;