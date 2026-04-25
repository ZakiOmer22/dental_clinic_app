const notificationService = require('../../../services/notificationService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class NotificationController {
  getUnreadCount = asyncHandler(async (req, res) => {
  return successResponse(res, { count: 0 });
  });
  /**
   * Get notifications
   */
  getNotifications = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      isRead: req.query.isRead,
      type: req.query.type,
    };

    const result = await notificationService.getNotifications(req.user.id, filters);

    return paginatedResponse(
      res,
      result.notifications,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Mark as read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'notification',
      entityId: notification.id,
      metadata: { read: true },
      req,
    }).catch(() => {});

    return successResponse(res, { notification }, 'Marked as read');
  });

  /**
   * Mark all as read
   */
  markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user.id);

    return successResponse(res, null, 'All notifications marked as read');
  });

  /**
   * Create notification (internal use)
   */
  createNotification = asyncHandler(async (req, res) => {
    const notification = await notificationService.createNotification(req.body);

    return successResponse(res, { notification }, 'Notification created', 201);
  });
}

module.exports = new NotificationController();