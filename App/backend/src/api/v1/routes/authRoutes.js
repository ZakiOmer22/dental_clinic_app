const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');
const { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidator');

// Public routes
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.use(auth);
router.post('/logout', authController.logout);
router.get('/me', authController.me);
router.post('/register', validate(registerSchema), authController.register);

module.exports = router;