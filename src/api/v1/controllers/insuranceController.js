const insuranceService = require('../../../services/insuranceService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class InsuranceController {
  /**
   * Get insurance records
   */
  getInsurance = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      providerId: req.query.providerId ? parseInt(req.query.providerId) : undefined,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      status: req.query.status,
    };

    const result = await insuranceService.getInsurance(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.insurance,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single insurance record
   */
  getInsuranceById = asyncHandler(async (req, res) => {
    const record = await insuranceService.getInsuranceById(
      req.params.id,
      req.user.clinicId
    );

    return successResponse(res, { insurance: record });
  });

  /**
   * Create insurance policy
   */
  createInsurance = asyncHandler(async (req, res) => {
    const record = await insuranceService.createInsurance(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'insurance',
      entityId: record.id,
      newData: record,
      req,
    }).catch(() => {});

    return successResponse(res, { insurance: record }, 'Insurance added', 201);
  });

  /**
   * Update insurance
   */
  updateInsurance = asyncHandler(async (req, res) => {
    const oldRecord = await insuranceService.getInsuranceById(
      req.params.id,
      req.user.clinicId
    );

    const record = await insuranceService.updateInsurance(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'insurance',
      entityId: record.id,
      oldData: oldRecord,
      newData: record,
      req,
    }).catch(() => {});

    return successResponse(res, { insurance: record }, 'Insurance updated');
  });
}

module.exports = new InsuranceController();