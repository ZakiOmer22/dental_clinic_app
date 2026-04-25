const labService = require('../../../services/labService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class LabController {
  /**
   * Get all labs
   */
  getLabs = asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const labs = await labService.getLabs(req.user.clinicId, includeInactive);
    return successResponse(res, { labs });
  });

  /**
   * Get single lab
   */
  getLab = asyncHandler(async (req, res) => {
    const lab = await labService.getLabById(req.params.id, req.user.clinicId);
    return successResponse(res, { lab });
  });

  /**
   * Create lab
   */
  createLab = asyncHandler(async (req, res) => {
    const lab = await labService.createLab(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'lab',
      entityId: lab.id,
      newData: lab,
      metadata: { name: lab.name },
      req,
    }).catch(() => {});

    return successResponse(res, { lab }, 'Lab created successfully', 201);
  });

  /**
   * Get all lab orders
   */
  getOrders = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      dentistId: req.query.dentistId ? parseInt(req.query.dentistId) : undefined,
      labId: req.query.labId ? parseInt(req.query.labId) : undefined,
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      isRush: req.query.isRush !== undefined ? req.query.isRush === 'true' : undefined,
      overdue: req.query.overdue === 'true',
      sortBy: req.query.sortBy || 'orderDate',
      sortOrder: req.query.sortOrder || 'DESC',
    };

    const result = await labService.getLabOrders(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.orders,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single lab order
   */
  getOrder = asyncHandler(async (req, res) => {
    const order = await labService.getLabOrderById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'lab_order',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        patientId: order.patientId,
        labId: order.labId,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { order });
  });

  /**
   * Create lab order
   */
  createOrder = asyncHandler(async (req, res) => {
    const order = await labService.createLabOrder(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'lab_order',
      entityId: order.id,
      newData: order,
      metadata: {
        orderNumber: order.orderNumber,
        patientId: order.patientId,
        labName: order.lab.name,
        isRush: order.isRush,
        totalAmount: order.amounts.total,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { order }, 'Lab order created successfully', 201);
  });

  /**
   * Update lab order
   */
  updateOrder = asyncHandler(async (req, res) => {
    const oldOrder = await labService.getLabOrderById(req.params.id, req.user.clinicId);

    const order = await labService.updateLabOrder(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'lab_order',
      entityId: order.id,
      oldData: oldOrder,
      newData: order,
      metadata: {
        orderNumber: order.orderNumber,
        statusChanged: oldOrder.status !== order.status,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { order }, 'Lab order updated successfully');
  });

  /**
   * Update item status
   */
  updateItemStatus = asyncHandler(async (req, res) => {
    const { orderId, itemId } = req.params;
    const order = await labService.updateItemStatus(
      orderId,
      itemId,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { order }, 'Item status updated successfully');
  });

  /**
   * Receive order
   */
  receiveOrder = asyncHandler(async (req, res) => {
    const order = await labService.receiveOrder(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'lab_order_received',
      entityId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        receivedDate: req.body.receivedDate,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { order }, 'Order received successfully');
  });

  /**
   * Get lab statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await labService.getLabStats(req.user.clinicId);
    return successResponse(res, { stats });
  });
}

module.exports = new LabController();
