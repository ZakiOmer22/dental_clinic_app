const financialService = require('../../../services/financialService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class FinancialController {
  /**
   * Get invoices
   */
  getInvoices = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
    };

    const result = await financialService.getInvoices(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.invoices,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single invoice
   */
  getInvoice = asyncHandler(async (req, res) => {
    const invoice = await financialService.getInvoiceById(
      req.params.id,
      req.user.clinicId
    );

    return successResponse(res, { invoice });
  });

  /**
   * Create invoice
   */
  createInvoice = asyncHandler(async (req, res) => {
    const invoice = await financialService.createInvoice(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'invoice',
      entityId: invoice.id,
      newData: invoice,
      req,
    }).catch(() => {});

    return successResponse(res, { invoice }, 'Invoice created', 201);
  });

  /**
   * Record payment
   */
  recordPayment = asyncHandler(async (req, res) => {
    const payment = await financialService.recordPayment(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { payment }, 'Payment recorded');
  });
}

module.exports = new FinancialController();