const roomService = require('../../../services/roomService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class RoomController {
  /**
   * Get rooms
   */
  getRooms = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      type: req.query.type,
      status: req.query.status,
    };

    const result = await roomService.getRooms(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.rooms,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single room
   */
  getRoom = asyncHandler(async (req, res) => {
    const room = await roomService.getRoomById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'room',
      entityId: room.id,
      req,
    }).catch(() => {});

    return successResponse(res, { room });
  });

  /**
   * Create room
   */
  createRoom = asyncHandler(async (req, res) => {
    const room = await roomService.createRoom(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'room',
      entityId: room.id,
      newData: room,
      req,
    }).catch(() => {});

    return successResponse(res, { room }, 'Room created', 201);
  });

  /**
   * Update room
   */
  updateRoom = asyncHandler(async (req, res) => {
    const oldRoom = await roomService.getRoomById(req.params.id, req.user.clinicId);

    const room = await roomService.updateRoom(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'room',
      entityId: room.id,
      oldData: oldRoom,
      newData: room,
      req,
    }).catch(() => {});

    return successResponse(res, { room }, 'Room updated');
  });

  /**
   * Deactivate room
   */
  deactivateRoom = asyncHandler(async (req, res) => {
    await roomService.deactivateRoom(
      req.params.id,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, null, 'Room deactivated');
  });
}

module.exports = new RoomController();