const referralService = require('../../../services/referralService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class ReferralController {
  /**
   * Get all referrals
   */
  getReferrals = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      patientId: req.query.patientId ? parseInt(req.query.patientId) : undefined,
      status: req.query.status,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'DESC',
    };

    const result = await referralService.getReferrals(req.user.clinicId, filters);

    return paginatedResponse(
      res,
      result.referrals,
      filters.page,
      filters.limit,
      result.pagination.total
    );
  });

  /**
   * Get single referral
   */
  getReferral = asyncHandler(async (req, res) => {
    const referral = await referralService.getReferralById(req.params.id, req.user.clinicId);

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'VIEW',
      entity: 'referral',
      entityId: referral.id,
      req,
    }).catch(() => {});

    return successResponse(res, { referral });
  });

  /**
   * Create referral
   */
  createReferral = asyncHandler(async (req, res) => {
    const referral = await referralService.createReferral(
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'CREATE',
      entity: 'referral',
      entityId: referral.id,
      newData: referral,
      req,
    }).catch(() => {});

    return successResponse(res, { referral }, 'Referral created', 201);
  });

  /**
   * Update referral
   */
  updateReferral = asyncHandler(async (req, res) => {
    const oldReferral = await referralService.getReferralById(req.params.id, req.user.clinicId);

    const referral = await referralService.updateReferral(
      req.params.id,
      req.body,
      req.user.id,
      req.user.clinicId
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'referral',
      entityId: referral.id,
      oldData: oldReferral,
      newData: referral,
      req,
    }).catch(() => {});

    return successResponse(res, { referral }, 'Referral updated');
  });

  /**
   * Update status
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const referral = await referralService.updateStatus(
      req.params.id,
      status,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { referral }, 'Status updated');
  });

  /**
   * Add feedback (from referred doctor)
   */
  addFeedback = asyncHandler(async (req, res) => {
    const { feedback } = req.body;

    const referral = await referralService.addFeedback(
      req.params.id,
      feedback,
      req.user.id,
      req.user.clinicId
    );

    return successResponse(res, { referral }, 'Feedback added');
  });
}

module.exports = new ReferralController();