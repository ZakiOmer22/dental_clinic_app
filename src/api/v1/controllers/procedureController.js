const procedureService = require('../../../services/procedureService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class ProcedureController {
  /**
   * Get procedures
   */
  getProcedures = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      dentistId: req.query.dentistId ? parseInt(req.query.dentistId) : undefined,
      status: req.query.status,
    };

    const result = await procedureService.getProcedures(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.procedures,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single procedure
   */
  getProcedure = asyncHandler(async (req, res) => {
    const procedure = await procedureService.getProcedureById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'procedure',
      entityId: procedure.id,
      req,
    }).catch(() => {});

    return successResponse(res, { procedure });
  });

  /**
   * Create procedure
   */
  createProcedure = asyncHandler(async (req, res) => {
    const procedure = await procedureService.createProcedure(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'procedure',
      entityId: procedure.id,
      newData: procedure,
      req,
    }).catch(() => {});

    return successResponse(res, { procedure }, 'Procedure created', 201);
  });

  /**
   * Update procedure
   */
  updateProcedure = asyncHandler(async (req, res) => {
    const oldProcedure = await procedureService.getProcedureById(req.params.id, req.user.clinicId);

    const procedure = await procedureService.updateProcedure(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'procedure',
      entityId: procedure.id,
      oldData: oldProcedure,
      newData: procedure,
      req,
    }).catch(() => {});

    return successResponse(res, { procedure }, 'Procedure updated');
  });

  /**
   * Update status
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const procedure = await procedureService.updateStatus(
      req.params.id,
      status,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { procedure }, 'Status updated');
  });
}

module.exports = new ProcedureController();