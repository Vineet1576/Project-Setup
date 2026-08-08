const constants = require('../utils/constants');
const response = require('../utils/response');
const settingService = require('../services/settingService');

module.exports = {
  get: async (req, res, next) => {
    try {
      const settings = await settingService.getSettings();
      return response.success({ settings }, constants.SETTINGS.FETCHED, req, res);
    } catch (err) {
      next(err);
    }
  },

  public: async (req, res, next) => {
    try {
      const settings = await settingService.getSettings();
      const site = (settings && settings.site) || {};
      return response.success(
        { settings: { site } },
        constants.SETTINGS.FETCHED,
        req,
        res,
      );
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const data = { ...req.body };
      const settings = await settingService.updateSettings(data, req.identity.id);
      return response.success({ settings }, constants.SETTINGS.UPDATED, req, res);
    } catch (err) {
      next(err);
    }
  },
};
