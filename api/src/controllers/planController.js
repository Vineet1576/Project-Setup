const constants = require('../utils/constants');
const response = require('../utils/response');
const Validations = require('../validations');
const planService = require('../services/planService');

module.exports = {
  createPlan: async (req, res, next) => {
    try {
      const validation_result = await Validations.Plan.addPlan(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }

      const data = { ...req.body, addedBy: req.identity.id };
      const newPlan = await planService.createPlan(data);

      if (newPlan) {
        return response.success({ newPlan }, constants.PLAN.CREATED, req, res);
      }
      return response.success(null, constants.PLAN.CREATE, req, res);
    } catch (err) {
      if (err.type && err.type.startsWith('Stripe')) {
        return res.status(400).json({
          success: false,
          message: `Stripe error: ${err.message}`,
        });
      }
      next(err);
    }
  },

  planDetail: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      const userId = req.identity?.id;
      const plan = await planService.planDetail({ id, userId });
      return response.success({ plan }, constants.PLAN.Fetch, req, res);
    } catch (err) {
      next(err);
    }
  },

  getAllPlans: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query;
      const result = await planService.getAllPlans(params);
      return response.success(result, constants.PLAN.Fetch, req, res);
    } catch (err) {
      next(err);
    }
  },

  updatePlan: async (req, res, next) => {
    try {
      const validation_result = await Validations.Plan.updatePlan(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }

      const data = { ...req.body, updatedBy: req.identity.id };
      await planService.updatePlan(data);
      return response.success(null, constants.PLAN.UPDATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  changeStatus: async (req, res, next) => {
    try {
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ success: false, message: 'id and status are required' });
      }
      await planService.changeStatus({ id, status });
      return response.success(null, 'Plan status updated successfully', req, res);
    } catch (err) {
      next(err);
    }
  },

  deletePlan: async (req, res, next) => {
    try {
      let id;
      if (req.decryptedParams && req.decryptedParams.id) {
        id = req.decryptedParams.id;
      } else if (req.query && req.query.id) {
        id = req.query.id;
      } else {
        throw 'Plan ID is required (provide as query parameter ?id=xxx)';
      }

      const result = await planService.deletePlan({ id });
      return response.success(result, constants.PLAN.DELETED, req, res);
    } catch (err) {
      next(err);
    }
  },
};
