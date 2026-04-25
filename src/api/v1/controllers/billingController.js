const billingService = require('../../../services/billingService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class BillingController {
  /**
   * Get all invoices
   */
  getInvoices = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : undefined,
      overdue: req.query.overdue === 'true',
      sortBy: req.query.sortBy || 'invoiceDate',
      sortOrder: req.query.sortOrder || 'DESC',
    };

    const result = await billingService.getInvoices(req.user.clinicId, filters);

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
    const invoice = await billingService.getInvoiceById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'invoice',
      entityId: invoice.id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        patientId: invoice.patientId,
        amount: invoice.amounts.total,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { invoice });
  });

  /**
   * Create invoice
   */
  createInvoice = asyncHandler(async (req, res) => {
    const invoice = await billingService.createInvoice(
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
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        patientId: invoice.patientId,
        totalAmount: invoice.amounts.total,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { invoice }, 'Invoice created successfully', 201);
  });

  /**
   * Update invoice
   */
  updateInvoice = asyncHandler(async (req, res) => {
    const oldInvoice = await billingService.getInvoiceById(req.params.id, req.user.clinicId);

    const invoice = await billingService.updateInvoice(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'invoice',
      entityId: invoice.id,
      oldData: oldInvoice,
      newData: invoice,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        statusChanged: oldInvoice.status !== invoice.status,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { invoice }, 'Invoice updated successfully');
  });

  /**
   * Add payment
   */
  addPayment = asyncHandler(async (req, res) => {
    const payment = await billingService.addPayment(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'payment',
      entityId: payment.id,
      newData: payment,
      metadata: {
        invoiceId: req.body.invoiceId,
        amount: req.body.amount,
        paymentMethod: req.body.paymentMethod,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { payment }, 'Payment recorded successfully', 201);
  });

  /**
   * Get payments
   */
  getPayments = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      invoiceId: req.query.invoiceId ? parseInt(req.query.invoiceId) : undefined,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      paymentMethod: req.query.paymentMethod,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      sortBy: req.query.sortBy || 'paymentDate',
      sortOrder: req.query.sortOrder || 'DESC',
    };

    const result = await billingService.getPayments(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.payments,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get billing statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const { fromDate, toDate } = req.query;
    const stats = await billingService.getBillingStats(req.user.clinicId, fromDate, toDate);
    return successResponse(res, { stats });
  });
}

module.exports = new BillingController();
