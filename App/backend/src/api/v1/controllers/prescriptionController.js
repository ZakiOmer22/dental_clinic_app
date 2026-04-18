const prescriptionService = require('../../../services/prescriptionService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class PrescriptionController {
  /**
   * Get all prescriptions
   */
  getPrescriptions = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      dentistId: req.query.dentistId ? parseInt(req.query.dentistId) : undefined,
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      isControlledSubstance: req.query.isControlledSubstance !== undefined ? 
        req.query.isControlledSubstance === 'true' : undefined,
      medicationName: req.query.medicationName,
      sortBy: req.query.sortBy || 'prescriptionDate',
      sortOrder: req.query.sortOrder || 'DESC',
    };

    const result = await prescriptionService.getPrescriptions(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.prescriptions,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single prescription
   */
  getPrescription = asyncHandler(async (req, res) => {
    const prescription = await prescriptionService.getPrescriptionById(
      req.params.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'prescription',
      entityId: prescription.id,
      metadata: {
        prescriptionNumber: prescription.prescriptionNumber,
        patientId: prescription.patientId,
        isControlledSubstance: prescription.isControlledSubstance,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { prescription });
  });

  /**
   * Get patient's active prescriptions
   */
  getPatientPrescriptions = asyncHandler(async (req, res) => {
    const prescriptions = await prescriptionService.getPatientPrescriptions(
      req.params.patientId,
      req.user.clinicId
    );

    return successResponse(res, { prescriptions });
  });

  /**
   * Create prescription
   */
  createPrescription = asyncHandler(async (req, res) => {
    const prescription = await prescriptionService.createPrescription(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'prescription',
      entityId: prescription.id,
      newData: prescription,
      metadata: {
        prescriptionNumber: prescription.prescriptionNumber,
        patientId: prescription.patientId,
        medicationCount: prescription.items.length,
        isControlledSubstance: prescription.isControlledSubstance,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { prescription }, 'Prescription created successfully', 201);
  });

  /**
   * Update prescription
   */
  updatePrescription = asyncHandler(async (req, res) => {
    const oldPrescription = await prescriptionService.getPrescriptionById(
      req.params.id,
      req.user.clinicId
    );

    const prescription = await prescriptionService.updatePrescription(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'prescription',
      entityId: prescription.id,
      oldData: oldPrescription,
      newData: prescription,
      metadata: {
        prescriptionNumber: prescription.prescriptionNumber,
        statusChanged: oldPrescription.status !== prescription.status,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { prescription }, 'Prescription updated successfully');
  });

  /**
   * Add refill
   */
  addRefill = asyncHandler(async (req, res) => {
    const prescription = await prescriptionService.addRefill(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'prescription_refill',
      entityId: req.params.id,
      metadata: {
        prescriptionNumber: prescription.prescriptionNumber,
        quantity: req.body.quantity,
        pharmacy: req.body.pharmacyName,
      },
      req,
    }).catch(() => {});

    return successResponse(res, { prescription }, 'Refill added successfully');
  });

  /**
   * Cancel prescription
   */
  cancelPrescription = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const oldPrescription = await prescriptionService.getPrescriptionById(
      req.params.id,
      req.user.clinicId
    );

    await prescriptionService.cancelPrescription(
      req.params.id,
      reason,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'prescription',
      entityId: req.params.id,
      oldData: oldPrescription,
      newData: { status: 'cancelled', reason },
      metadata: {
        prescriptionNumber: oldPrescription.prescriptionNumber,
        cancellationReason: reason,
      },
      req,
    }).catch(() => {});

    return successResponse(res, null, 'Prescription cancelled successfully');
  });

  /**
   * Search medications
   */
  searchMedications = asyncHandler(async (req, res) => {
    const { search, limit } = req.query;
    const medications = await prescriptionService.searchMedications(search, parseInt(limit) || 20);
    return successResponse(res, { medications });
  });

  /**
   * Get prescription statistics
   */
  getStats = asyncHandler(async (req, res) => {
    const { fromDate, toDate } = req.query;
    const stats = await prescriptionService.getPrescriptionStats(
      req.user.clinicId,
      fromDate,
      toDate
    );
    return successResponse(res, { stats });
  });
}

module.exports = new PrescriptionController();
