const router = require('express').Router();
const controller = require('../controllers/knowledgeBaseController');
const auth = require('../../../middleware/auth');
const validate = require('../middlewares/validate');

const {
  createArticleSchema,
  updateArticleSchema,
} = require('../validators/knowledgeBaseValidator');

router.use(auth);

router.get('/articles', async (req, res) => {
  res.json({ success: true, data: [], total: 0 });
});

router.get('/', async (req, res) => {
  res.json({ 
    success: true, 
    data: [], 
    total: 0,
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
  });
});

router.get('/:id', controller.getArticle);

router.post('/', validate(createArticleSchema), controller.createArticle);
router.put('/:id', validate(updateArticleSchema), controller.updateArticle);

router.delete('/:id', controller.deleteArticle);

module.exports = router;