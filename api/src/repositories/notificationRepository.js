const mongoose = require('mongoose');
const db = require('../models');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const Notification = db.notifications;
const fields = [
  'userId',
  'type',
  'title',
  'message',
  'metadata',
  'read',
  'readAt',
  'dismissed',
  'dismissedAt',
];

const serializeNotif = (doc) => serialize(doc, fields);

exports.create = async (data) => {
  const doc = await Notification.create({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    metadata: data.metadata || {},
  });
  return serializeNotif(doc);
};

exports.createMany = async (items) => {
  const docs = await Notification.insertMany(items);
  return serializeList(docs, fields);
};

exports.findOneAndUpdate = async (filter, data, options = {}) => {
  const doc = await Notification.findOneAndUpdate(
    filter,
    { $set: data },
    { new: true, lean: true, ...options },
  );
  return serializeNotif(doc);
};

exports.updateMany = async (filter, data) => {
  return Notification.updateMany(filter, { $set: data });
};

exports.countDocuments = async (filter) => {
  return Notification.countDocuments(filter);
};

exports.findAllWithPagination = async (userId, params) => {
  const { page = 1, count = 10, type, read } = params;

  const match = { userId, dismissed: false };
  if (type) match.type = type;
  if (read !== undefined) match.read = read === 'true';

  const result = await paginateWrapper(
    Notification,
    { page: Number(page), limit: Number(count), match },
    {
      sort: { createdAt: -1 },
      project: {
        _id: 1,
        userId: 1,
        type: 1,
        title: 1,
        message: 1,
        metadata: 1,
        read: 1,
        readAt: 1,
        createdAt: 1,
      },
    },
  );

  const unreadCount = await Notification.countDocuments({ userId, read: false, dismissed: false });

  return { data: result.data, total: result.pagination.total, unreadCount };
};
