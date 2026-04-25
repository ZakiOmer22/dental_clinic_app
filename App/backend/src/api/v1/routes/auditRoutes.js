const router = require('express').Router();
const controller = require('../controllers/auditController');
const auth = require('../../../middleware/auth');

router.use(auth);

router.get('/', controller.getAudits);
router.get('/:id', controller.getAudit);

module.exports = router;