const reportService = require('../../../services/reportService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class ReportController {
  getRecallReport = asyncHandler(async (req, res) => {
    return successResponse(res, { data: [], total: 0 });
  });
  
  /**
   * Appointment report
   */
  getAppointmentReport = asyncHandler(async (req, res) => {
    const { fromDate, toDate } = req.query;

    const report = await reportService.getAppointmentReport(
      req.user.clinicId,
      fromDate,
      toDate
    );

    return successResponse(res, { report });
  });

  /**
   * Revenue report
   */
    getRevenueReport = asyncHandler(async (req, res) => {
    const { fromDate, toDate } = req.query;
    const report = await reportService.getRevenueReport(req.user.clinicId, fromDate, toDate);
    return res.json({
      success: true,
      data: [report],  // Wrap in array for .map()
      report: report
      });
    });

  /**
   * Patient statistics
   */
  getPatientStats = asyncHandler(async (req, res) => {
    const stats = await reportService.getPatientStats(req.user.clinicId);
    return successResponse(res, { stats });
  });

  /**
   * Treatment performance
   */
  getTreatmentReport = asyncHandler(async (req, res) => {
    const report = await reportService.getTreatmentReport(req.user.clinicId);
    return successResponse(res, { report });
  });

  /**
   * Export report (future-ready)
   */
  exportReport = asyncHandler(async (req, res) => {
    const { type } = req.params;

    const data = await reportService.exportReport(
      type,
      req.user.clinicId,
      req.query
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'EXPORT',
      entity: 'report',
      metadata: { type },
      req,
    }).catch(() => {});

    return successResponse(res, { data });
  });
}

module.exports = new ReportController();