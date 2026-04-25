const auditService = require('../../../services/auditService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');

class AuditController {
  /**
   * Get audit logs
   */
   getAudits = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      entity: req.query.entity,
      entityId: req.query.entityId ? parseInt(req.query.entityId) : undefined,
      action: req.query.action,
      userId: req.query.userId ? parseInt(req.query.userId) : undefined,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
    };

    const result = await auditService.getAudits(req.user.clinicId, filters);

    return res.json({
      success: true,
      data: result.audits.map(row => ({
        ...row,
        timestamp: row.created_at,
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.pagination.total,
        totalPages: Math.ceil(result.pagination.total / filters.limit),
      },
    });
  });

  /**
   * Get single audit entry
   */
  getAudit = asyncHandler(async (req, res) => {
    const audit = await auditService.getAuditById(req.params.id, req.user.clinicId);

    return successResponse(res, { audit });
  });
}

module.exports = new AuditController();