const inventoryService = require('../../../services/inventoryService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class InventoryController {
  /**
   * Get all items
   */
  getItems = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      category: req.query.category,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      lowStock: req.query.lowStock === 'true',
      expiringSoon: req.query.expiringSoon === 'true',
      supplier: req.query.supplier,
      location: req.query.location,
      sortBy: req.query.sortBy || 'name',
      sortOrder: req.query.sortOrder || 'ASC',
    };

    const result = await inventoryService.getItems(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.items,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single item
   */
  getItem = asyncHandler(async (req, res) => {
    const item = await inventoryService.getItemById(req.params.id, req.user.clinicId);
    return successResponse(res, { item });
  });

  /**
   * Create item
   */
  createItem = asyncHandler(async (req, res) => {
    const item = await inventoryService.createItem(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'inventory_item',
      entityId: item.id,
      newData: item,
      metadata: {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { item }, 'Item created successfully', 201);
  });

  /**
   * Update item
   */
  updateItem = asyncHandler(async (req, res) => {
    const oldItem = await inventoryService.getItemById(req.params.id, req.user.clinicId);

    const item = await inventoryService.updateItem(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'inventory_item',
      entityId: item.id,
      oldData: oldItem,
      newData: item,
      metadata: { name: item.name },
      req,
    }).catch(() => {});

    return successResponse(res, { item }, 'Item updated successfully');
  });

  /**
   * Stock in
   */
  stockIn = asyncHandler(async (req, res) => {
    const item = await inventoryService.stockIn(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'inventory_stock_in',
      entityId: item.id,
      metadata: {
        itemName: item.name,
        quantity: req.body.quantity,
        supplier: req.body.supplier,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { item }, 'Stock added successfully');
  });

  /**
   * Stock out
   */
  stockOut = asyncHandler(async (req, res) => {
    const item = await inventoryService.stockOut(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'inventory_stock_out',
      entityId: item.id,
      metadata: {
        itemName: item.name,
        quantity: req.body.quantity,
        reason: req.body.reason,
        patientId: req.body.patientId,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { item }, 'Stock removed successfully');
  });

  /**
   * Get transactions
   */
  getTransactions = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      itemId: req.query.itemId ? parseInt(req.query.itemId) : undefined,
      type: req.query.type,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      sortBy: req.query.sortBy || 'transactionDate',
      sortOrder: req.query.sortOrder || 'DESC',
    };

    const result = await inventoryService.getTransactions(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.transactions,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get low stock alerts
   */
  getLowStockAlerts = asyncHandler(async (req, res) => {
    const alerts = await inventoryService.getLowStockAlerts(req.user.clinicId);
    return successResponse(res, { alerts });
  });

  /**
   * Get expiring items
   */
  getExpiringItems = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const items = await inventoryService.getExpiringItems(req.user.clinicId, days);
    return successResponse(res, { items, daysThreshold: days });
  });

  /**
   * Get inventory statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await inventoryService.getInventoryStats(req.user.clinicId);
    return successResponse(res, { stats });
  });
}

module.exports = new InventoryController();
