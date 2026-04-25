const userService = require('../../../services/userService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class UserController {
  /**
   * Get all users
   */
  getUsers = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
    };

    const result = await userService.getUsers(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.users,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single user
   */
  getUser = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'user',
      entityId: user.id,
      req,
    }).catch(() => {});

    return successResponse(res, { user });
  });

  /**
   * Create user
   */
  createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'user',
      entityId: user.id,
      newData: user,
      req,
    }).catch(() => {});

    return successResponse(res, { user }, 'User created', 201);
  });

  /**
   * Update user
   */
  updateUser = asyncHandler(async (req, res) => {
    const oldUser = await userService.getUserById(req.params.id, req.user.clinicId);

    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'user',
      entityId: user.id,
      oldData: oldUser,
      newData: user,
      req,
    }).catch(() => {});

    return successResponse(res, { user }, 'User updated');
  });

  /**
   * Deactivate user
   */
  deactivateUser = asyncHandler(async (req, res) => {
    await userService.deactivateUser(
      req.params.id,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, null, 'User deactivated');
  });
}

module.exports = new UserController();