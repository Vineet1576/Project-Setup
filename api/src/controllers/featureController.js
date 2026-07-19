const Validations = require('../validations');
const constants = require('../utils/constants');
const response = require('../utils/response');
const featureService = require('../services/featureService');
const excel = require('exceljs');

module.exports = {
  addFeatures: async (req, res, next) => {
    try {
      const validation_result = await Validations.Feature.addFeature(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const data = { ...req.body, addedBy: req.identity.id };
      await featureService.addFeatures(data);
      return res.status(200).json({
        success: true,
        message: constants.FEATURE.CREATED,
      });
    } catch (err) {
      next(err);
    }
  },

  findSingleFeature: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      const feature = await featureService.findSingleFeature({ id });
      return response.success(feature, constants.FEATURE.FETCHED, req, res);
    } catch (err) {
      next(err);
    }
  },

  editfeature: async (req, res, next) => {
    try {
      const validation_result = await Validations.Feature.editFeature(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const data = { ...req.body, updatedBy: req.identity.id };
      await featureService.editFeature(data);
      return response.success(null, constants.FEATURE.UPDATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  deleteFeature: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      await featureService.deleteFeature({ id });
      return response.success(null, constants.FEATURE.DELETED, req, res);
    } catch (err) {
      next(err);
    }
  },

  changeFeatureStatus: async (req, res, next) => {
    try {
      const validation_result = await Validations.Feature.idCheck(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const { id, status } = req.body;
      await featureService.changeFeatureStatus({ id, status });
      return response.success(null, constants.PLAN.STATUS_CHANGED, req, res);
    } catch (err) {
      next(err);
    }
  },

  getAllFeatures: async (req, res, next) => {
    try {
      let { decrypt, export_to_xls } = req.decryptedParams || req.query;
      const params = req.decryptedParams || req.query;

      const result = await featureService.getAllFeatures(params);

      if (export_to_xls === 'yes') {
        const Data = [];
        let counter = 1;
        for (const obj of result.data) {
          Data.push({
            name: obj?.name || '--',
            status: obj?.status,
            counter: counter,
          });
          counter++;
        }

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Feature');

        worksheet.columns = [
          { header: 'Serial No.', key: 'counter', width: 15, style: { alignment: { horizontal: 'center' } } },
          { header: 'Name', key: 'name', width: 25, style: { alignment: { horizontal: 'center' } } },
          { header: 'Status', key: 'status', width: 20, style: { alignment: { horizontal: 'center' } } },
        ];
        worksheet.addRows(Data);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Feature.xlsx');
        await workbook.xlsx.write(res);
        return res.status(200).end();
      }

      const data = {
        data: result.data,
        total: result.total,
      };

      if (!decrypt) {
        return response.success(data, constants.FEATURE.FETCHED, req, res);
      }

      return res.status(200).json({
        success: true,
        message: constants.FEATURE.FETCHED,
        data: data.data,
        total: data.total,
      });
    } catch (err) {
      next(err);
    }
  },
};
