const { settingRepo } = require('../repositories');
const constants = require('../utils/constants');

exports.getSettings = async () => {
  let settings = await settingRepo.getGlobal();
  if (!settings) {
    settings = await settingRepo.upsertGlobal({}, null);
  }
  return settings;
};

exports.updateSettings = async (data = {}, userId) => {
  const update = {};
  if (data.site && typeof data.site === 'object') update.site = data.site;
  if (data.email && typeof data.email === 'object') update.email = data.email;
  if (data.stripe && typeof data.stripe === 'object') update.stripe = data.stripe;
  if (data.config && typeof data.config === 'object') update.config = data.config;
  if (!Object.keys(update).length) throw constants.SETTINGS.PAYLOAD_MISSING;

  const settings = await settingRepo.upsertGlobal(update, userId);
  if (!settings) throw constants.SETTINGS.NOT_FOUND;
  return settings;
};
