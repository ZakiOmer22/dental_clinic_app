const appointmentService = require('../../../services/appointmentService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class AppointmentController {
  /**
   * Get all appointments
   */
  getAppointments = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      dentistId: req.query.dentistId ? parseInt(req.query.dentistId) : undefined,
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      today: req.query.today === 'true',
      upcoming: req.query.upcoming === 'true',
      sortBy: req.query.sortBy || 'appointmentDate',
      sortOrder: req.query.sortOrder || 'ASC',
    };

    const result = await appointmentService.getAppointments(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.appointments,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get today's appointments
   */
  getTodayAppointments = asyncHandler(async (req, res) => {
    const appointments = await appointmentService.getTodayAppointments(req.user.clinicId);
    return successResponse(res, { appointments, date: new Date().toISOString().split('T')[0] });
  });

  /**
   * Get single appointment
   */
  getAppointment = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.getAppointmentById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'appointment',
      entityId: appointment.id,
      metadata: {
        patientId: appointment.patientId,
        dentistId: appointment.dentistId,
        appointmentDate: appointment.appointmentDate,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { appointment });
  });

  /**
   * Check availability
   */
  checkAvailability = asyncHandler(async (req, res) => {
    const { dentistId, appointmentDate, startTime, endTime, excludeAppointmentId } = req.body;

    const hasConflict = await appointmentService.checkConflict(
      dentistId,
      appointmentDate,
      startTime,
      endTime,
      excludeAppointmentId,
      req.user.clinicId
    );

    return successResponse(res, { available: !hasConflict });
  });

  /**
   * Create appointment
   */
  createAppointment = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.createAppointment(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'appointment',
      entityId: appointment.id,
      newData: appointment,
      metadata: {
        patientId: appointment.patientId,
        dentistId: appointment.dentistId,
        appointmentDate: appointment.appointmentDate,
        isEmergency: appointment.isEmergency,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { appointment }, 'Appointment created successfully', 201);
  });

  /**
   * Update appointment
   */
  updateAppointment = asyncHandler(async (req, res) => {
    const oldAppointment = await appointmentService.getAppointmentById(req.params.id, req.user.clinicId);

    const appointment = await appointmentService.updateAppointment(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'appointment',
      entityId: appointment.id,
      oldData: oldAppointment,
      newData: appointment,
      metadata: {
        patientId: appointment.patientId,
        statusChanged: oldAppointment.status !== appointment.status,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { appointment }, 'Appointment updated successfully');
  });

  /**
   * Cancel appointment
   */
  cancelAppointment = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const oldAppointment = await appointmentService.getAppointmentById(req.params.id, req.user.clinicId);

    await appointmentService.cancelAppointment(
      req.params.id,
      reason,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'appointment',
      entityId: req.params.id,
      oldData: oldAppointment,
      newData: { status: 'cancelled', reason },
      metadata: { cancellationReason: reason },
      req,
    }).catch(() => {});

    return successResponse(res, null, 'Appointment cancelled successfully');
  });

  /**
   * Get appointment statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const { fromDate, toDate } = req.query;
    const stats = await appointmentService.getAppointmentStats(req.user.clinicId, fromDate, toDate);
    return successResponse(res, { stats });
  });
}

module.exports = new AppointmentController();
