const treatmentService = require('../../../services/treatmentService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class TreatmentController {
  /**
   * Get all treatments
   */
  getTreatments = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search,
      category: req.query.category,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      requiresLab: req.query.requiresLab !== undefined ? req.query.requiresLab === 'true' : undefined,
      sortBy: req.query.sortBy || 'category',
      sortOrder: req.query.sortOrder || 'ASC',
    };

    const result = await treatmentService.getTreatments(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.treatments,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single treatment
   */
  getTreatment = asyncHandler(async (req, res) => {
    const treatment = await treatmentService.getTreatmentById(req.params.id, req.user.clinicId);
    return successResponse(res, { treatment });
  });

  /**
   * Create treatment
   */
  createTreatment = asyncHandler(async (req, res) => {
    const treatment = await treatmentService.createTreatment(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'treatment',
      entityId: treatment.id,
      newData: treatment,
      metadata: {
        name: treatment.name,
        category: treatment.category,
        price: treatment.price,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { treatment }, 'Treatment created successfully', 201);
  });

  /**
   * Update treatment
   */
  updateTreatment = asyncHandler(async (req, res) => {
    const oldTreatment = await treatmentService.getTreatmentById(req.params.id, req.user.clinicId);

    const treatment = await treatmentService.updateTreatment(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'treatment',
      entityId: treatment.id,
      oldData: oldTreatment,
      newData: treatment,
      metadata: {
        name: treatment.name,
        priceChanged: oldTreatment.price !== treatment.price,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { treatment }, 'Treatment updated successfully');
  });

  /**
   * Delete treatment
   */
  deleteTreatment = asyncHandler(async (req, res) => {
    const oldTreatment = await treatmentService.getTreatmentById(req.params.id, req.user.clinicId);

    await treatmentService.deleteTreatment(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'DELETE',
      entity: 'treatment',
      entityId: req.params.id,
      oldData: oldTreatment,
      metadata: { name: oldTreatment.name },
      req,
    }).catch(() => {});

    return successResponse(res, null, 'Treatment deleted successfully');
  });

  /**
   * Get treatment categories
   */
  getCategories = asyncHandler(async (req, res) => {
    const categories = await treatmentService.getCategories(req.user.clinicId);
    return successResponse(res, { categories });
  });

  /**
   * Get popular treatments
   */
  getPopular = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const treatments = await treatmentService.getPopularTreatments(req.user.clinicId, limit);
    return successResponse(res, { treatments });
  });

  /**
   * Get treatment statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await treatmentService.getTreatmentStats(req.user.clinicId);
    return successResponse(res, { stats });
  });

  /**
   * Bulk import treatments
   */
  bulkImport = asyncHandler(async (req, res) => {
    const { treatments } = req.body;

    if (!treatments || !Array.isArray(treatments)) {
      return res.status(400).json({ error: 'Treatments array is required' });
    }

    const results = await treatmentService.bulkImportTreatments(
      treatments,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'treatment_bulk',
      entityId: null,
      metadata: {
        total: results.total,
        created: results.created.length,
        failed: results.failed.length,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { results }, `Imported ${results.created.length} treatments`);
  });
}

module.exports = new TreatmentController();
