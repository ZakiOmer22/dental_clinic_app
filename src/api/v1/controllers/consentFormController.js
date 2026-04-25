const consentFormService = require('../../../services/consentFormService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class ConsentFormController {
  /**
   * Get all consent forms (templates)
   */
  getConsentForms = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'DESC',
    };

    const result = await consentFormService.getConsentForms(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.forms,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single consent form
   */
  getConsentForm = asyncHandler(async (req, res) => {
    const form = await consentFormService.getConsentFormById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'consent_form',
      entityId: form.id,
      req,
    }).catch(() => {});

    return successResponse(res, { form });
  });

  /**
   * Create template
   */
  createConsentForm = asyncHandler(async (req, res) => {
    const form = await consentFormService.createConsentForm(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'consent_form',
      entityId: form.id,
      newData: form,
      req,
    }).catch(() => {});

    return successResponse(res, { form }, 'Consent form created', 201);
  });

  /**
   * Update template (creates NEW VERSION)
   */
  updateConsentForm = asyncHandler(async (req, res) => {
    const oldForm = await consentFormService.getConsentFormById(req.params.id, req.user.clinicId);

    const form = await consentFormService.updateConsentForm(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'consent_form',
      entityId: form.id,
      oldData: oldForm,
      newData: form,
      req,
    }).catch(() => {});

    return successResponse(res, { form }, 'Consent form updated');
  });

  /**
   * Assign form to patient
   */
  assignToPatient = asyncHandler(async (req, res) => {
    const { patientId } = req.body;

    const assigned = await consentFormService.assignToPatient(
      req.params.id,
      patientId,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { assigned }, 'Form assigned');
  });

  /**
   * Sign form
   */
  signConsentForm = asyncHandler(async (req, res) => {
    const { signature } = req.body;

    const signed = await consentFormService.signConsentForm(
      req.params.id,
      signature,
      req.user,
      req
    );

    return successResponse(res, { signed }, 'Form signed successfully');
  });
}

module.exports = new ConsentFormController();