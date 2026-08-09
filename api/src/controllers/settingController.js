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

  crypto: async (req, res) => {
    try {
      const settings = await settingService.getSettings();
      const config = (settings && settings.config) || {};
      return res.status(200).json({
        CRYPTO_SECURE_ENCRYPTION: config.CRYPTO_SECURE_ENCRYPTION || 'false',
        SECRET_KEY: config.SECRET_KEY || '',
        ENCRYPTION_IV: config.ENCRYPTION_IV || '',
      });
    } catch {
      return res.status(200).json({
        CRYPTO_SECURE_ENCRYPTION: 'false',
        SECRET_KEY: '',
        ENCRYPTION_IV: '',
      });
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
