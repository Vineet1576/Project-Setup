const constants = require("../utils/constants");
const response = require("../utils/response");
const contentManagementService = require("../services/contentManagementService");

module.exports = {
  listing: async (req, res, next) => {
    try {
      const params = req.query;
      const result = await contentManagementService.listing(params);
      return res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  addContent: async (req, res, next) => {
    try {
      const data = { ...req.body, addedBy: req.identity.id };
      const created = await contentManagementService.addContent(data);
      return response.success(
        { create: created },
        constants.CONTENT_MANAGEMENT.ADDED,
        req,
        res,
      );
    } catch (err) {
      next(err);
    }
  },

  editContent: async (req, res, next) => {
    try {
      const data = { ...req.body, ...req.query, updatedBy: req.identity.id };
      await contentManagementService.editContent(data);
      return response.success(
        null,
        constants.CONTENT_MANAGEMENT.UPDATED,
        req,
        res,
      );
    } catch (err) {
      next(err);
    }
  },

  getContent: async (req, res, next) => {
    try {
      const { title, id, slug } = req.decryptedParams || req.body || req.query;
      const content = await contentManagementService.getContent({
        title,
        id,
        slug,
      });
      return res.status(200).json({
        success: true,
        message: constants.CONTENT_MANAGEMENT.FETCHED,
        data: content,
      });
    } catch (err) {
      next(err);
    }
  },

  statusUpdate: async (req, res, next) => {
    try {
      const { status, title, id } = req.body;
      await contentManagementService.statusUpdate({ status, title, id });
      return res.status(200).json({
        success: true,
        message: constants.COMMON.STATUS_CHANGED,
      });
    } catch (err) {
      next(err);
    }
  },
};
