const backupService = require('../../../services/backupService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class BackupController {
  /**
   * Create backup
   */
  createBackup = asyncHandler(async (req, res) => {
    const backup = await backupService.createBackup(
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'backup',
      entityId: backup.id,
      metadata: { type: 'manual_backup' },
      req,
    }).catch(() => {});

    return successResponse(res, { backup }, 'Backup started', 201);
  });

  /**
   * Get backups
   */
  getBackups = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
    };

    const result = await backupService.getBackups(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.backups,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Restore backup
   */
  restoreBackup = asyncHandler(async (req, res) => {
    const result = await backupService.restoreBackup(
      req.params.id,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { result }, 'Restore initiated');
  });

  /**
   * Delete backup
   */
  deleteBackup = asyncHandler(async (req, res) => {
    await backupService.deleteBackup(
      req.params.id,
      req.user.clinicId
    );

    return successResponse(res, null, 'Backup deleted');
  });
}

module.exports = new BackupController();