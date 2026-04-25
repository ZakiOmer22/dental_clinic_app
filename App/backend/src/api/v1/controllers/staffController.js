const staffService = require('../../../services/staffService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class StaffController {
  /**
   * Get all staff
   */
  getStaff = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
    };

    const result = await staffService.getStaff(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.staff,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single staff
   */
  getStaffById = asyncHandler(async (req, res) => {
    const staff = await staffService.getStaffById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'staff',
      entityId: staff.id,
      req,
    }).catch(() => {});

    return successResponse(res, { staff });
  });

  /**
   * Create staff
   */
  createStaff = asyncHandler(async (req, res) => {
    const staff = await staffService.createStaff(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'staff',
      entityId: staff.id,
      newData: staff,
      req,
    }).catch(() => {});

    return successResponse(res, { staff }, 'Staff created', 201);
  });

  /**
   * Update staff
   */
  updateStaff = asyncHandler(async (req, res) => {
    const oldStaff = await staffService.getStaffById(req.params.id, req.user.clinicId);

    const staff = await staffService.updateStaff(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'staff',
      entityId: staff.id,
      oldData: oldStaff,
      newData: staff,
      req,
    }).catch(() => {});

    return successResponse(res, { staff }, 'Staff updated');
  });

  /**
   * Deactivate staff
   */
  deactivateStaff = asyncHandler(async (req, res) => {
    await staffService.deactivateStaff(
      req.params.id,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, null, 'Staff deactivated');
  });
}

module.exports = new StaffController();