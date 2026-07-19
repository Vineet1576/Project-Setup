const constants = require('../utils/constants');
const response = require('../utils/response');
const Validations = require('../validations/index');
const userServices = require('../services/userService');
const { encryptData, decryptData } = require('../utils/response');
const Emails = require('../Emails/templates');
const db = require('../models');
const helper = require('../utils/helpers');

module.exports = {
  registerUser: async (req, res, next) => {
    try {
      const validation_result = await Validations.UserValidations.register(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const user = await userServices.registerUser(req.body);
      const message =
        user.companyRole === 'member'
          ? 'Your account has been successfully created. Please wait for accocunt approval from Admin.'
          : 'Your account has been registered successfully. Please check your email for account verification';
      return response.success(user, message, req, res);
    } catch (err) {
      next(err);
    }
  },

  registerUserApp: async (req, res, next) => {
    try {
      const user = await userServices.registerUserApp(req.body);
      return response.success(user, 'User registered successfully', req, res);
    } catch (err) {
      next(err);
    }
  },

  adminLogin: async (req, res, next) => {
    try {
      const validation_result = await Validations.UserValidations.adminLogin(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const adminData = await userServices.adminLogin(req.body);
      return response.success(adminData, constants.onBoarding.LOGIN_SUCCESS, req, res);
    } catch (err) {
      next(err);
    }
  },

  userLogin: async (req, res, next) => {
    try {
      const validation_result = await Validations.UserValidations.userLogin(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const userData = await userServices.userLogin(req.body);
      return response.success(userData, constants.onBoarding.LOGIN_SUCCESS, req, res);
    } catch (err) {
      next(err);
    }
  },

  userLoginApp: async (req, res, next) => {
    try {
      const validation_result = await Validations.UserValidations.userLogin(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const userData = await userServices.userLoginApp(req.body);
      return response.success(userData, constants.onBoarding.LOGIN_SUCCESS, req, res);
    } catch (err) {
      next(err);
    }
  },

  autoLogin: async (req, res, next) => {
    try {
      const { id } = req.body;
      if (!id) {
        throw helper.createAppError('User ID is required', 400);
      }
      const userData = await userServices.autoLogin({ id });
      return response.success(userData, constants.onBoarding.LOGIN_SUCCESS, req, res);
    } catch (err) {
      next(err);
    }
  },

  userProfile: async (req, res, next) => {
    try {
      const validation_result = await Validations.UserValidations.userProfile(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const { id } = req.decryptedParams || req.query;
      if (!id) {
        throw helper.createAppError('User ID is required', 400);
      }
      const user_data = await userServices.userProfile({ id });
      return response.success(user_data, constants.onBoarding.FETCHED_SUCCESS, req, res);
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const validation_result = await Validations.UserValidations.updateProfile(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const id = req.identity?._id || req.body.id;
      const updatedUser = await userServices.updateProfile({ id, ...req.body });
      if (updatedUser) {
        return response.success(null, constants.onBoarding.UPDATED, req, res);
      } else {
        throw helper.createAppError(constants.onBoarding.ERROR, 400);
      }
    } catch (err) {
      next(err);
    }
  },

  getAllUsers: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query;
      const result = await userServices.getAllUsers(params);
      return response.success(result, 'Successfully fetched', req, res);
    } catch (err) {
      next(err);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const validation_result = await Validations.UserValidations.changePassword(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      await userServices.changePassword({
        ...req.body,
        identity: req.identity,
      });
      return response.success(null, constants.onBoarding.PASSWORD_CHANGED, req, res);
    } catch (err) {
      next(err);
    }
  },

  forgotPasswordAdmin: async (req, res, next) => {
    try {
      const validation_result = await Validations.UserValidations.forgotPassword(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const result = await userServices.adminForgotPassword(req.body);
      if (result) {
        return res.status(200).json({
          success: true,
          message: constants.onBoarding.VERIFICATION_CODE_SENT,
          id: result ? result.id : null,
        });
      } else {
        throw helper.createAppError(constants.onBoarding.EMAIL_NOT_FOUND, 400);
      }
    } catch (err) {
      next(err);
    }
  },

  forgotPasswordUser: async (req, res, next) => {
    try {
      const result = await userServices.forgotPasswordUser(req.body);
      return res.status(200).json({
        success: true,
        message: constants.onBoarding.VERIFICATION_CODE_SENT,
        id: result ? result.id : null,
      });
    } catch (err) {
      next(err);
    }
  },

  forgotPasswordUserApp: async (req, res, next) => {
    try {
      const result = await userServices.forgotPasswordUserApp(req.body);
      if (result) {
        return response.success(result, constants.onBoarding.VERIFICATION_CODE_SENT, req, res);
      } else {
        throw helper.createAppError(constants.onBoarding.ACCOUNT_NOT_FOUND, 400);
      }
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      await userServices.resetPassword(req.body);
      return response.success(null, constants.onBoarding.PASSWORD_RESET, req, res);
    } catch (err) {
      next(err);
    }
  },

  addUser: async (req, res, next) => {
    try {
      const validation_result = await Validations.UserValidations.addUser(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }
      const user = await userServices.addUser(req.body);
      const { deviceToken } = req.body;
      if (deviceToken) {
        const db = require('../models');
        await db.users.findByIdAndUpdate(user._id, {
          $addToSet: { deviceTokens: deviceToken },
        });
      }
      return response.success(user, constants.onBoarding.USER_ADDED, req, res);
    } catch (err) {
      next(err);
    }
  },

  changeApprovalStatus: async (req, res, next) => {
    try {
      const { id, approvalStatus } = req.body;
      if (!id || !approvalStatus) {
        throw helper.createAppError('id and approvalStatus are required', 400);
      }
      await userServices.changeApprovalStatus({ id, approvalStatus });
      return response.success(null, constants.onBoarding.APPROVALSTATUS, req, res);
    } catch (err) {
      next(err);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      if (!id) {
        throw helper.createAppError('User ID is required', 400);
      }
      await userServices.deleteUser({ id });
      return response.success(null, constants.onBoarding.USER_DELETED, req, res);
    } catch (err) {
      next(err);
    }
  },

  verifyUser: async (req, res, next) => {
    try {
      const { id } = req.decryptedParams || req.query;
      if (!id) {
        throw helper.createAppError('Id is required', 400);
      }
      const url = await userServices.verifyUser({ id });
      return res.redirect(url);
    } catch (err) {
      next(err);
    }
  },

  resendVerificationEmail: async (req, res, next) => {
    try {
      const { email } = req.decryptedParams || req.query;
      if (!email) {
        throw helper.createAppError('Email required', 400);
      }
      await userServices.resendVerificationEmail({ email });
      return response.success(null, 'Verify link sent to your registered email.', req, res);
    } catch (err) {
      next(err);
    }
  },

  verifyOtp: async (req, res, next) => {
    try {
      const data = req.body;
      if (!data.otp || !data.email) {
        throw helper.createAppError('Payload missing', 400);
      }
      const result = await userServices.verifyOtp(data);
      return response.success(result, 'Account verified successfully.', req, res);
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      await userServices.logout({
        identity: req.identity,
        ...req.body,
      });
      return res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  },

  checkResetLink: async (req, res, next) => {
    try {
      const { data } = req.query;
      if (!data) return res.send(Emails.expiredLinkHtml);

      const decrypted = decryptData(data);
      const { userId, code, expiresAt } = decrypted;

      const user = await db.users.findById(userId).select('+verificationCode');
      if (!user) return res.send(Emails.expiredLinkHtml);

      if (user.verificationCode !== code || user.isExpire || Date.now() > expiresAt) {
        return res.send(Emails.expiredLinkHtml);
      }

      await db.users.updateOne({ _id: userId }, { isExpire: true });

      const tempToken = encryptData({ userId, purpose: 'reset-password' });

      const redirectUrl = `${process.env.FRONT_WEB_URL || ''}/reset-password?token=${tempToken}`;
      return res.redirect(redirectUrl);
    } catch (err) {
      return res.send(Emails.expiredLinkHtml);
    }
  },
};
