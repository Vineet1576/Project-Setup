const db = require("../models");
const { paginate } = require("../utils/paginate");
const { emitToUser } = require("./socket");

exports.createNotification = async ({ userId, type, title, message, metadata }) => {
  if (!userId || !type || !title || !message) return null;

  const notification = await db.notifications.create({
    userId, type, title, message, metadata: metadata || {},
  });

  const data = notification.toObject();
  emitToUser(userId, "new_notification", data);

  return data;
};

exports.getUserNotifications = async (userId, params) => {
  const { page = 1, count = 10, type, read } = params;

  const match = { userId, dismissed: false };
  if (type) match.type = type;
  if (read !== undefined) match.read = read === "true";

  const result = await paginate(db.notifications, {
    page: Number(page),
    limit: Number(count),
    match,
    sort: { createdAt: -1 },
    project: {
      _id: 1, userId: 1, type: 1, title: 1, message: 1,
      metadata: 1, read: 1, readAt: 1, createdAt: 1,
    },
  });

  const unreadCount = await db.notifications.countDocuments({
    userId, read: false, dismissed: false,
  });

  return { data: result.data, total: result.pagination.total, unreadCount };
};

exports.markAsRead = async (userId, notificationId) => {
  const notification = await db.notifications.findOneAndUpdate(
    { _id: notificationId, userId, dismissed: false },
    { $set: { read: true, readAt: new Date() } },
    { new: true, lean: true },
  );

  if (notification) {
    emitToUser(userId, "notification_read", { userId, notificationId });
  }

  return notification;
};

exports.markAllAsRead = async (userId, type) => {
  const match = { userId, read: false, dismissed: false };
  if (type) match.type = type;

  const result = await db.notifications.updateMany(match, {
    $set: { read: true, readAt: new Date() },
  });

  emitToUser(userId, "notifications_all_read", { userId });
  return { modifiedCount: result.modifiedCount };
};

exports.dismissNotification = async (userId, notificationId) => {
  const notification = await db.notifications.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { dismissed: true, dismissedAt: new Date() } },
    { new: true, lean: true },
  );

  if (notification) {
    emitToUser(userId, "notification_dismissed", { userId, notificationId });
  }

  return notification;
};

exports.getUnreadCount = async (userId) => {
  return db.notifications.countDocuments({
    userId, read: false, dismissed: false,
  });
};

exports.notifyAdmins = async ({ type, title, message, metadata }) => {
  const adminRole = await db.roles.findOne({ name: "admin", isDeleted: false });
  if (!adminRole) return;
  const admins = await db.users
    .find({ role: adminRole._id, isDeleted: false, status: "active" })
    .lean();
  for (const admin of admins) {
    await exports.createNotification({
      userId: admin._id, type, title, message, metadata,
    });
  }
};

exports.broadcastToAll = async ({ type, title, message, metadata }) => {
  const userIds = await db.users
    .find({ isDeleted: false, status: "active" })
    .distinct("_id");

  const notifications = await db.notifications.insertMany(
    userIds.map((userId) => ({
      userId, type, title, message, metadata: metadata || {},
    })),
  );

  for (const notification of notifications) {
    emitToUser(notification.userId, "new_notification", notification.toObject());
  }

  return { sent: notifications.length };
};
