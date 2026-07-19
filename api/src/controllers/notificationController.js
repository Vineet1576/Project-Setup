const notificationService = require("../services/notificationService");
const helper = require("../utils/helpers");
const Validations = require("../validations");

module.exports = {
  list: async (req, res, next) => {
    try {
      const validation = await Validations.Notification.list(req);
      if (validation && !validation.success) {
        throw helper.createAppError(validation.message, 400);
      }

      const result = await notificationService.getUserNotifications(
        req.identity.id,
        req.query,
      );

      return res.status(200).json({
        success: true,
        message: "Notifications fetched successfully",
        data: result.data,
        total: result.total,
        unreadCount: result.unreadCount,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.count) || 10,
      });
    } catch (err) {
      next(err);
    }
  },

  markRead: async (req, res, next) => {
    try {
      const validation = await Validations.Notification.markRead(req);
      if (validation && !validation.success) {
        throw helper.createAppError(validation.message, 400);
      }

      const notification = await notificationService.markAsRead(
        req.identity.id,
        req.body.id,
      );

      if (!notification) {
        throw helper.createAppError("Notification not found", 404);
      }

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (err) {
      next(err);
    }
  },

  markAllRead: async (req, res, next) => {
    try {
      const validation = await Validations.Notification.markAllRead(req);
      if (validation && !validation.success) {
        throw helper.createAppError(validation.message, 400);
      }

      const result = await notificationService.markAllAsRead(
        req.identity.id,
        req.body.type,
      );

      return res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        modifiedCount: result.modifiedCount,
      });
    } catch (err) {
      next(err);
    }
  },

  dismiss: async (req, res, next) => {
    try {
      const validation = await Validations.Notification.markDismiss(req);
      if (validation && !validation.success) {
        throw helper.createAppError(validation.message, 400);
      }

      const notification = await notificationService.dismissNotification(
        req.identity.id,
        req.body.id,
      );

      if (!notification) {
        throw helper.createAppError("Notification not found", 404);
      }

      return res.status(200).json({
        success: true,
        message: "Notification dismissed",
      });
    } catch (err) {
      next(err);
    }
  },

  unreadCount: async (req, res, next) => {
    try {
      const count = await notificationService.getUnreadCount(req.identity.id);

      return res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (err) {
      next(err);
    }
  },

  broadcast: async (req, res, next) => {
    try {
      const { type, title, message, metadata } = req.body;
      if (!type || !title || !message) {
        throw helper.createAppError("type, title and message are required", 400);
      }

      const result = await notificationService.broadcastToAll({
        type: type || "admin_broadcast",
        title,
        message,
        metadata,
      });

      return res.status(200).json({
        success: true,
        message: "Broadcast sent successfully",
        sent: result.sent,
      });
    } catch (err) {
      next(err);
    }
  },
};
