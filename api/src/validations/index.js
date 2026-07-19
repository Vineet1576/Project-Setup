const UserValidations = require('./userValidation');
const RoleValidations = require('./roleValidation');

const Feature = {
  addFeature: async (req) => ({ success: true }),
  editFeature: async (req) => ({ success: true }),
  idCheck: async (req) => ({ success: true }),
};

const Plan = {
  addPlan: async (req) => ({ success: true }),
  updatePlan: async (req) => ({ success: true }),
};

const Subscriptions = {
  purchaseSubscriptionPlan: async (req) => ({ success: true }),
  idCheck: async (req) => ({ success: true }),
};

const Notification = require('./notificationValidation');

module.exports = { UserValidations, RoleValidations, Feature, Plan, Subscriptions, Notification };
