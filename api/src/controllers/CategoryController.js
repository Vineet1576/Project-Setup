const constants = require("../utils/constants");
const response = require("../utils/response");
const helper = require("../utils/helpers");
const categoryService = require("../services/categoryService");

module.exports = {
  createCategory: async (req, res, next) => {
    try {
      const result = await categoryService.createCategory(req.body);
      const statusCode = result.created.length > 0 ? 201 : 200;
      return res.status(statusCode).json({
        success: true,
        message: constants.category.CREATED,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  categoryDetail: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      if (!id) throw helper.createAppError("Category ID is required", 400);

      const category = await categoryService.categoryDetail({ id });
      return response.success(
        category,
        constants.onBoarding.FETCHED_SUCCESS,
        req,
        res,
      );
    } catch (err) {
      next(err);
    }
  },

  updateCategory: async (req, res, next) => {
    try {
      const result = await categoryService.updateCategory(req.body);
      return res.status(200).json({
        success: true,
        message: "Category updated successfully.",
        modifiedCount: result.modifiedCount,
      });
    } catch (err) {
      next(err);
    }
  },

  getAllCategory: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query;
      const result = await categoryService.getAllCategory(params);
      return res.status(200).json({
        success: true,
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

  getSubCategory: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query;
      const result = await categoryService.getSubCategory(params);
      return res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  changeStatus: async (req, res, next) => {
    try {
      const { id, status } = req.body;
      if (!id) throw helper.createAppError("ID is required", 400);

      await categoryService.changeStatus({ id, status });
      return response.success(
        null,
        constants.category.STATUS_CHANGED,
        req,
        res,
      );
    } catch (err) {
      next(err);
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      if (!id) throw helper.createAppError("Category ID is required", 400);

      await categoryService.deleteCategory({ id });
      return response.success(null, constants.category.DELETED, req, res);
    } catch (err) {
      next(err);
    }
  },
};
