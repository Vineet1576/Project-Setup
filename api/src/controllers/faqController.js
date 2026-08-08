const constants = require("../utils/constants");
const response = require("../utils/response");
const faqService = require("../services/faqService");

module.exports = {
  categories: async (req, res, next) => {
    try {
      const categories = await faqService.getAllCategories();
      return response.success({ categories }, constants.FAQ.CATEGORIES_FETCHED, req, res);
    } catch (err) {
      next(err);
    }
  },
  listing: async (req, res, next) => {
    try {
      const result = await faqService.getAllFaqs();
      return response.success(
        { data: result },
        constants.FAQ.FETCHED,
        req,
        res,
      );
    } catch (err) {
      next(err);
    }
  },

  adminListing: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query;
      const result = await faqService.getAdminFaqs(params);
      return res.status(200).json({
        success: true,
        message: constants.FAQ.FETCHED,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.limit ? Math.ceil(result.total / result.limit) : 1,
      });
    } catch (err) {
      next(err);
    }
  },

  detail: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      const faq = await faqService.getFaqDetail({ id });
      return response.success(faq, constants.FAQ.FETCHED, req, res);
    } catch (err) {
      next(err);
    }
  },

  addFaq: async (req, res, next) => {
    try {
      const faq = await faqService.createFaq(req.body);
      return response.success(faq, constants.FAQ.CREATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  updateFaq: async (req, res, next) => {
    try {
      const faq = await faqService.updateFaq(req.body);
      return response.success(faq, constants.FAQ.UPDATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  deleteFaq: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      await faqService.deleteFaq({ id });
      return response.success(null, constants.FAQ.DELETED, req, res);
    } catch (err) {
      next(err);
    }
  },

  changeStatus: async (req, res, next) => {
    try {
      const { id, status } = req.body;
      await faqService.changeFaqStatus({ id, status });
      return response.success(null, constants.FAQ.STATUS_CHANGED, req, res);
    } catch (err) {
      next(err);
    }
  },
};
