const constants = require('../utils/constants');
const response = require('../utils/response');
const contactUsService = require('../services/contactUsService');

module.exports = {
  add: async (req, res, next) => {
    try {
      const data = req.body;
      data.addedBy = req.identity?.id;
      const created = await contactUsService.add(data);
      return response.success({ created }, constants.ContactUs.CREATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  detail: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      const detail = await contactUsService.detail({ id });
      return response.success({ detail }, constants.ContactUs.DETAIL_FETCHED, req, res);
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id, ...data } = req.body;
      const existed = await contactUsService.update({ id, ...data });
      return response.success({ data: existed }, constants.ContactUs.UPDATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.body;
      await contactUsService.delete({ id });
      return response.success(null, constants.ContactUs.DELETED, req, res);
    } catch (err) {
      next(err);
    }
  },

  listing: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query;
      const result = await contactUsService.listing(params);
      return response.success(result, constants.ContactUs.LISTING, req, res);
    } catch (err) {
      next(err);
    }
  },

  changeStatus: async (req, res, next) => {
    try {
      const { id, status } = req.body;
      await contactUsService.changeStatus({ id, status });
      return response.success(null, constants.ContactUs.STATUS_CHANGED, req, res);
    } catch (err) {
      next(err);
    }
  },
};
