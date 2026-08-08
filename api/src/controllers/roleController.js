const db = require('../models');
const response = require('../utils/response');
const constants = require('../utils/constants');
const Validations = require('../validations/index');
const helper = require('../utils/helpers');
const roleService = require('../services/roleService');

module.exports = {
  createRoles: async (req, res, next) => {
    try {
      const validation_result = await Validations.RoleValidations.createRole(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      await roleService.createRole(req);
      return response.success(null, constants.roles.CREATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  roleDetail: async (req, res, next) => {
    try {
      const role = await roleService.roleDetail(req);
      return response.success(role, constants.onBoarding.FETCHED_SUCCESS, req, res);
    } catch (err) {
      next(err);
    }
  },

  updateRole: async (req, res, next) => {
    try {
      if (!req.body.id || !req.body.name || !req.body.permissions) {
        throw helper.createAppError(constants.onBoarding.PAYLOAD_MISSING, 400);
      }

      const organizationId = req.identity?._id;

      const result = await db.organization
        .findById(organizationId)
        .populate('role', 'name')
        .lean();

      if (
        result?.role?.name === 'Venue Manager' ||
        result?.role?.name === 'organization' ||
        result?.role?.name === 'business user'
      ) {
        const permissionId = await db.permission
          .findOne({ addedBy: organizationId, isDeleted: false })
          .select('_id');

        if (permissionId) {
          await db.permission.updateOne(
            { _id: permissionId._id },
            { permissions: req.body.permissions },
          );
        } else {
          const newPermission = await db.permission.create({
            permissions: req.body.permissions,
            addedBy: organizationId,
          });
          await db.organization.updateOne(
            { _id: organizationId },
            { permissions: newPermission._id },
          );
        }
      }

      await roleService.updateRole(req);
      return response.success(null, constants.roles.UPDATED, req, res);
    } catch (err) {
      next(err);
    }
  },

  getAllRoles: async (req, res, next) => {
    try {
      const result = await roleService.getAllRoles(req);
      return response.success(result, constants.onBoarding.FETCHED_SUCCESS, req, res);
    } catch (err) {
      next(err);
    }
  },

  changeStatus: async (req, res, next) => {
    try {
      await roleService.changeStatus(req);
      return response.success(null, constants.ROLES.STATUS_CHANGED, req, res);
    } catch (err) {
      next(err);
    }
  },

  deleteRole: async (req, res, next) => {
    try {
      req.body.id = req.query.id || req.body.id;
      await roleService.deleteRole(req);
      return response.success(null, constants.roles.DELETED, req, res);
    } catch (err) {
      next(err);
    }
  },

  frontendRolesList: async (req, res, next) => {
    try {
      const roles = await roleService.frontendRolesList();
      return response.success({ roles }, constants.onBoarding.FETCHED_SUCCESS, req, res);
    } catch (err) {
      next(err);
    }
  },
};
