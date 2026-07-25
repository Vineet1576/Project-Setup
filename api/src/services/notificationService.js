const { notificationRepo, roleRepo, userRepo } = require("../repositories");
const { emitToUser } = require("./socket");

exports.createNotification = async ({ userId, type, title, message, metadata }) => {
  if (!userId || !type || !title || !message) return null;

  const notification = await notificationRepo.create({
    userId, type, title, message, metadata: metadata || {},
  });

  emitToUser(userId, "new_notification", notification);
  return notification;
};

exports.getUserNotifications = async (userId, params) => {
  return notificationRepo.findAllWithPagination(userId, params);
};

exports.markAsRead = async (userId, notificationId) => {
  const notification = await notificationRepo.findOneAndUpdate(
    { _id: notificationId, userId, dismissed: false },
    { read: true, readAt: new Date() },
  );

  if (notification) {
    emitToUser(userId, "notification_read", { userId, notificationId });
  }

  return notification;
};

exports.markAllAsRead = async (userId, type) => {
  const match = { userId, read: false, dismissed: false };
  if (type) match.type = type;

  const result = await notificationRepo.updateMany(match, { read: true, readAt: new Date() });

  emitToUser(userId, "notifications_all_read", { userId });
  return { modifiedCount: result.modifiedCount };
};

exports.dismissNotification = async (userId, notificationId) => {
  const notification = await notificationRepo.findOneAndUpdate(
    { _id: notificationId, userId },
    { dismissed: true, dismissedAt: new Date() },
  );

  if (notification) {
    emitToUser(userId, "notification_dismissed", { userId, notificationId });
  }

  return notification;
};

exports.getUnreadCount = async (userId) => {
  return notificationRepo.countDocuments({ userId, read: false, dismissed: false });
};

exports.notifyAdmins = async ({ type, title, message, metadata }) => {
  const adminRole = await roleRepo.findByName("admin");
  if (!adminRole) return;

  const admins = await userRepo.findOne({ role: adminRole.id, isDeleted: false, status: "active" });
  if (!admins) return;

  const adminList = await userRepo.findAllWithPagination({ role: adminRole.id, status: "active" });
  // fetch admins directly for notification broadcast
  const db = require("../models");
  const adminUsers = await db.users
    .find({ role: adminRole.id, isDeleted: false, status: "active" })
    .lean();

  for (const admin of adminUsers) {
    await exports.createNotification({
      userId: admin._id, type, title, message, metadata,
    });
  }
};

exports.broadcastToAll = async ({ type, title, message, metadata }) => {
  const db = require("../models");
  const userIds = await db.users
    .find({ isDeleted: false, status: "active" })
    .distinct("_id");

  const notifications = await notificationRepo.createMany(
    userIds.map((userId) => ({
      userId, type, title, message, metadata: metadata || {},
    })),
  );

  for (const notification of notifications) {
    emitToUser(notification.userId, "new_notification", notification);
  }

  return { sent: notifications.length };
};
