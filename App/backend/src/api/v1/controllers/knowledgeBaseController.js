const kbService = require('../../../services/knowledgeBaseService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class KnowledgeBaseController {
  /**
   * Get articles
   */
  getArticles = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      category: req.query.category,
      search: req.query.search,
      isPublished: req.query.isPublished,
    };

    const result = await kbService.getArticles(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.articles,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single article
   */
  getArticle = asyncHandler(async (req, res) => {
    const article = await kbService.getArticleById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'knowledge_base',
      entityId: article.id,
      req,
    }).catch(() => {});

    return successResponse(res, { article });
  });

  /**
   * Create article
   */
  createArticle = asyncHandler(async (req, res) => {
    const article = await kbService.createArticle(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'knowledge_base',
      entityId: article.id,
      newData: article,
      req,
    }).catch(() => {});

    return successResponse(res, { article }, 'Article created', 201);
  });

  /**
   * Update article
   */
  updateArticle = asyncHandler(async (req, res) => {
    const oldArticle = await kbService.getArticleById(req.params.id, req.user.clinicId);

    const article = await kbService.updateArticle(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'knowledge_base',
      entityId: article.id,
      oldData: oldArticle,
      newData: article,
      req,
    }).catch(() => {});

    return successResponse(res, { article }, 'Article updated');
  });

  /**
   * Delete article
   */
  deleteArticle = asyncHandler(async (req, res) => {
    await kbService.deleteArticle(
      req.params.id,
      req.user.clinicId
    );

    return successResponse(res, null, 'Article deleted');
  });
}

module.exports = new KnowledgeBaseController();