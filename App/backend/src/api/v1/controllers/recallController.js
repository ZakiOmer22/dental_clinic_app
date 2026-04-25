const recallService = require('../../../services/recallService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class RecallController {
  /**
   * Get all recalls
   */
  getRecalls = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      dueBefore: req.query.dueBefore,
      dueAfter: req.query.dueAfter,
    };

    const result = await recallService.getRecalls(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.recalls,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single recall
   */
  getRecall = asyncHandler(async (req, res) => {
    const recall = await recallService.getRecallById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'recall',
      entityId: recall.id,
      req,
    }).catch(() => {});

    return successResponse(res, { recall });
  });

  /**
   * Create recall
   */
  createRecall = asyncHandler(async (req, res) => {
    const recall = await recallService.createRecall(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'recall',
      entityId: recall.id,
      newData: recall,
      req,
    }).catch(() => {});

    return successResponse(res, { recall }, 'Recall created', 201);
  });

  /**
   * Update recall
   */
  updateRecall = asyncHandler(async (req, res) => {
    const oldRecall = await recallService.getRecallById(req.params.id, req.user.clinicId);

    const recall = await recallService.updateRecall(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'recall',
      entityId: recall.id,
      oldData: oldRecall,
      newData: recall,
      req,
    }).catch(() => {});

    return successResponse(res, { recall }, 'Recall updated');
  });

  /**
   * Mark recall as completed
   */
  completeRecall = asyncHandler(async (req, res) => {
    const recall = await recallService.completeRecall(
      req.params.id,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { recall }, 'Recall completed');
  });
}

module.exports = new RecallController();