const constants = require('../utils/constants');
const response = require('../utils/response');
const feedbackService = require('../services/feedbackService');

module.exports = {
  add: async (req, res, next) => {
    try {
      const data = req.body;
      data.addedBy = req.identity?.id;
      const created = await feedbackService.add(data);
      return response.success({ created }, constants.Feedback.CREATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  detail: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      const detail = await feedbackService.detail({ id });
      return response.success({ detail }, constants.Feedback.DETAIL_FETCHED, req, res);
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id, ...data } = req.body;
      const existed = await feedbackService.update({ id, ...data });
      return response.success({ data: existed }, constants.Feedback.UPDATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.body;
      await feedbackService.delete({ id });
      return response.success(null, constants.Feedback.DELETED, req, res);
    } catch (err) {
      next(err);
    }
  },

  listing: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query;
      const result = await feedbackService.listing(params);
      return response.success(result, constants.Feedback.LISTING, req, res);
    } catch (err) {
      next(err);
    }
  },

  changeStatus: async (req, res, next) => {
    try {
      const { id, status } = req.body;
      await feedbackService.changeStatus({ id, status });
      return response.success(null, constants.Feedback.STATUS_CHANGED, req, res);
    } catch (err) {
      next(err);
    }
  },

  reply: async (req, res, next) => {
    try {
      const { id, message } = req.body;
      await feedbackService.reply({ id, message, addedBy: req.identity?.id });
      return response.success(null, constants.Feedback.REPLIED, req, res);
    } catch (err) {
      next(err);
    }
  },
};