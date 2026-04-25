const router = require('express').Router();
const controller = require('../controllers/fileController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');
const multer = require('multer');

const {
  uploadFileSchema,
} = require('../validators/fileValidator');

// basic local storage (upgrade later)
const upload = multer({ dest: 'uploads/' });

router.use(auth);

router.get('/', controller.getFiles);
router.post(
  '/',
  upload.single('file'),
  validate(uploadFileSchema),
  controller.uploadFile
);

router.delete('/:id', controller.deleteFile);

module.exports = router;