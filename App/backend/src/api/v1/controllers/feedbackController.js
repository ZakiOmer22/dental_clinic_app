const feedbackService = require('../../../services/feedbackService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class FeedbackController {
  /**
   * Get feedback list
   */
  getFeedback = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      type: req.query.type,
      rating: req.query.rating ? parseInt(req.query.rating) : undefined,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
    };

    const result = await feedbackService.getFeedback(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.feedback,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single feedback
   */
  getFeedbackById = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.getFeedbackById(
      req.params.id,
      req.user.clinicId
    );

    return successResponse(res, { feedback });
  });

  /**
   * Create feedback
   */
  createFeedback = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.createFeedback(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'feedback',
      entityId: feedback.id,
      newData: feedback,
      req,
    }).catch(() => {});

    return successResponse(res, { feedback }, 'Feedback submitted', 201);
  });

  /**
   * Update feedback status (admin handling)
   */
  updateFeedbackStatus = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.updateFeedbackStatus(
      req.params.id,
      req.body.status,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { feedback }, 'Feedback updated');
  });
}

module.exports = new FeedbackController();