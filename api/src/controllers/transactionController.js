const transactionService = require('../services/transactionService');
const response = require('../utils/response');
const helper = require('../utils/helpers');

module.exports = {
  list: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query;
      const result = await transactionService.list(params);

      return response.success(result, 'Transactions fetched successfully', req, res);
    } catch (err) {
      next(err);
    }
  },

  sendInvoice: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.body;
      if (!id) throw helper.createAppError('Transaction ID is required', 400);

      const result = await transactionService.sendInvoice(id);

      return response.success(result, 'Invoice sent successfully', req, res);
    } catch (err) {
      next(err);
    }
  },

  download: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      if (!id) throw helper.createAppError('Transaction ID is required', 400);

      const { filePath, fileName } = await transactionService.getInvoice(id);

      return res.download(filePath, fileName);
    } catch (err) {
      next(err);
    }
  },
};
