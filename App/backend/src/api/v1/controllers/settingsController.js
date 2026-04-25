const settingsService = require('../../../services/settingsService');
const asyncHandler = require('../../../../utils/asyncHandler');
const { successResponse } = require('../../../../utils/responseHandler');
const { logAction } = require('../../../../utils/auditLogger');

class SettingsController {
  /**
   * Get clinic settings
   */
  getSettings = asyncHandler(async (req, res) => {
    const settings = await settingsService.getSettings(req.user.clinicId);

    return successResponse(res, { settings });
  });

  /**
   * Update settings
   */
  updateSettings = asyncHandler(async (req, res) => {
    const oldSettings = await settingsService.getSettings(req.user.clinicId);

    const settings = await settingsService.updateSettings(
      req.user.clinicId,
      req.body,
      req.user.id
    );

    await logAction({
      user: { id: req.user.id, clinicId: req.user.clinicId },
      action: 'UPDATE',
      entity: 'settings',
      oldData: oldSettings,
      newData: settings,
      req,
    }).catch(() => {});

    return successResponse(res, { settings }, 'Settings updated');
  });
}

module.exports = new SettingsController();