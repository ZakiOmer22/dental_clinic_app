const patientService = require('../../../services/patientService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class PatientController {
  getPatientHistory = asyncHandler(async (req, res) => {
  return successResponse(res, { visits: [], data: [] });
});

getPatientBalance = asyncHandler(async (req, res) => {
  return successResponse(res, { invoices: [], total_billed: 0, total_paid: 0, balance_due: 0, data: [] });
});

getPatientFiles = asyncHandler(async (req, res) => {
  return successResponse(res, { data: [] });
});

  getDentalChart = asyncHandler(async (req, res) => {
    return successResponse(res, { chart: [] });
  });
  /**
   * Get all patients
   */
  getPatients = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'DESC',
    };

    const result = await patientService.getPatients(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.patients,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single patient
   */
  getPatient = asyncHandler(async (req, res) => {
    const patient = await patientService.getPatientById(req.params.id, req.user.clinicId);

    // Log view for HIPAA compliance
    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'patient',
      entityId: patient.id,
      metadata: { 
        patientName: `${patient.firstName} ${patient.lastName}`,
        accessReason: 'patient_record_view',
      },
      req,
    }).catch(() => {});

    return successResponse(res, { patient });
  });

  /**
   * Create patient
   */
  createPatient = asyncHandler(async (req, res) => {
    const patient = await patientService.createPatient(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    // Log creation
    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'patient',
      entityId: patient.id,
      newData: patient,
      metadata: { patientName: `${patient.firstName} ${patient.lastName}` },
      req,
    }).catch(() => {});

    return successResponse(res, { patient }, 'Patient created successfully', 201);
  });

  /**
   * Update patient
   */
  updatePatient = asyncHandler(async (req, res) => {
    // Get old data for audit
    const oldPatient = await patientService.getPatientById(req.params.id, req.user.clinicId);

    const patient = await patientService.updatePatient(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    // Log update with changes
    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'patient',
      entityId: patient.id,
      oldData: oldPatient,
      newData: patient,
      metadata: { patientName: `${patient.firstName} ${patient.lastName}` },
      req,
    }).catch(() => {});

    return successResponse(res, { patient }, 'Patient updated successfully');
  });

  /**
   * Delete patient (soft delete)
   */
  deletePatient = asyncHandler(async (req, res) => {
    const oldPatient = await patientService.getPatientById(req.params.id, req.user.clinicId);

    await patientService.deletePatient(req.params.id, req.user.clinicId);

    // Log deletion
    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'DELETE',
      entity: 'patient',
      entityId: req.params.id,
      oldData: oldPatient,
      metadata: { patientName: `${oldPatient.firstName} ${oldPatient.lastName}` },
      req,
    }).catch(() => {});

    return successResponse(res, null, 'Patient deleted successfully');
  });

  /**
   * Get patient statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const stats = await patientService.getPatientStats(req.user.clinicId);
    return successResponse(res, { stats });
  });
}

module.exports = new PatientController();
