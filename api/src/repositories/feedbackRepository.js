const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const Feedback = db.feedback;
const fields = [
  'title',
  'description',
  'firstName',
  'lastName',
  'fullName',
  'email',
  'mobileNo',
  'image',
  'address',
  'message',
  'topic',
  'status',
  'addedBy',
  'parentFeedback',
  'isDeleted',
];

const serializeFeedback = (doc) => serialize(doc, fields);

exports.findById = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Feedback.findById(id).lean();
  return serializeFeedback(doc);
};

exports.findRepliesByParentId = async (parentId) => {
  if (!parentId || !isValidObjectId(parentId)) return [];
  const docs = await Feedback.find({ parentFeedback: parentId, isDeleted: false })
    .sort({ createdAt: 1 })
    .lean();
  return serializeList(docs, fields);
};

exports.findRepliesByParentIds = async (parentIds) => {
  const ids = (parentIds || []).filter(isValidObjectId);
  if (!ids.length) return [];
  const docs = await Feedback.find({ parentFeedback: { $in: ids }, isDeleted: false })
    .sort({ createdAt: 1 })
    .lean();
  return serializeList(docs, fields);
};

exports.create = async (data) => {
  const doc = await Feedback.create(data);
  return serializeFeedback(doc);
};

exports.findOneAndUpdate = async (id, data) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Feedback.findOneAndUpdate({ _id: id }, data, { new: true, lean: true });
  return serializeFeedback(doc);
};

exports.softDelete = async (id) => {
  if (!id || !isValidObjectId(id)) return { modifiedCount: 0 };
  return Feedback.updateOne({ _id: id, isDeleted: false }, { isDeleted: true });
};

exports.findAllWithPagination = async (filters) => {
  const { search, page = 1, count = 10, sortBy, status, topic, email } = filters;
  const match = { isDeleted: false, parentFeedback: null };
  if (status) match.status = status;
  if (topic) match.topic = topic;
  if (email) match.email = email.toLowerCase();

  const result = await paginateWrapper(
    Feedback,
    { page: Number(page), limit: Number(count), search: search || undefined, match },
    {
      sort: helper.parseSortParam(sortBy),
      searchFields: ['fullName', 'email'],
      project: {
        _id: 1,
        title: 1,
        description: 1,
        link: 1,
        firstName: 1,
        lastName: 1,
        fullName: 1,
        email: 1,
        message: 1,
        topic: 1,
        createdAt: 1,
        updatedAt: 1,
        isDeleted: 1,
        status: 1,
        addedBy: 1,
      },
    },
  );

  return { data: result.data, total: result.pagination.total };
};