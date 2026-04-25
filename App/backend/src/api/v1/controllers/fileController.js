const fileService = require('../../../services/fileService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class FileController {
  /**
   * Upload file
   */
  uploadFile = asyncHandler(async (req, res) => {
    const file = req.file;

    const saved = await fileService.uploadFile(
      file,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'file',
      entityId: saved.id,
      metadata: { fileName: saved.original_name },
      req,
    }).catch(() => {});

    return successResponse(res, { file: saved }, 'File uploaded', 201);
  });

  /**
   * Get files
   */
  getFiles = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      entityType: req.query.entityType,
      entityId: req.query.entityId ? parseInt(req.query.entityId) : undefined,
    };

    const result = await fileService.getFiles(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.files,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Delete file
   */
  deleteFile = asyncHandler(async (req, res) => {
    await fileService.deleteFile(
      req.params.id,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, null, 'File deleted');
  });
}

module.exports = new FileController();