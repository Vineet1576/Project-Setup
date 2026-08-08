const response = require("../utils/response");
const dashboardService = require("../services/dashboardService");

const toValidDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

module.exports = {
  getStats: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query || {};
      const stats = await dashboardService.getAdminStats({
        startDate: toValidDate(params.startDate),
        endDate: toValidDate(params.endDate),
      });
      return response.success(stats, "Dashboard stats fetched successfully", req, res);
    } catch (err) {
      next(err);
    }
  },
};
