const router = require('express').Router();
const controller = require('../controllers/settingsController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  updateSettingsSchema,
} = require('../validators/settingsValidator');

router.use(auth);

router.get('/', controller.getSettings);
router.put('/', validate(updateSettingsSchema), controller.updateSettings);

router.get('/clinic', async (req, res) => {
  res.json({
    clinic: {
      id: req.user?.clinicId || 1,
      name: 'Default Clinic',
      timezone: 'UTC',
    },
  });
});

router.put('/clinic', async (req, res) => {
  res.json({
    success: true,
    message: 'Clinic settings updated',
    clinic: {
      id: req.user?.clinicId || 1,
      name: req.body.name || 'Default Clinic',
      timezone: req.body.timezone || 'UTC',
    },
  });
});

module.exports = router;