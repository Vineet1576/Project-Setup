const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const FAQ = db.faqs;
const fields = ['category', 'question', 'answer', 'order', 'status', 'isDeleted'];

const serializeFaq = (doc) => serialize(doc, fields);

exports.findById = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await FAQ.findOne({ _id: id, isDeleted: false }).lean();
  return serializeFaq(doc);
};

exports.create = async (data) => {
  const doc = await FAQ.create(data);
  return serializeFaq(doc);
};

exports.updateOne = async (id, data) => {
  if (!id || !isValidObjectId(id)) return null;
  return FAQ.updateOne({ _id: id, isDeleted: false }, { $set: data });
};

exports.softDelete = async (id) => {
  if (!id || !isValidObjectId(id)) return { modifiedCount: 0 };
  return FAQ.updateOne({ _id: id, isDeleted: false }, { isDeleted: true });
};

exports.changeStatus = async (id, status) => {
  if (!id || !isValidObjectId(id)) return null;
  await FAQ.updateOne({ _id: id }, { status });
};

exports.findAllActive = async () => {
  const docs = await FAQ.find({ isDeleted: false, status: 'active' })
    .sort({ category: 1, order: 1, createdAt: 1 })
    .lean();
  return serializeList(docs, fields);
};

exports.countAll = async () => {
  return FAQ.countDocuments({ isDeleted: false, status: 'active' });
};

exports.insertMany = async (items) => {
  const docs = await FAQ.insertMany(items);
  return serializeList(docs, fields);
};

exports.findAllWithPagination = async (filters) => {
  const { search, sortBy, status, category, page = 1, count = 10, isDeleted } = filters;
  const match = {};
  match.isDeleted = isDeleted === 'true';
  if (status) match.status = status;
  if (category) match.category = category;

  const result = await paginateWrapper(
    FAQ,
    { page: Number(page), limit: Number(count), search: search || undefined, match },
    {
      sort: helper.parseSortParam(sortBy),
      searchFields: ['category', 'question', 'answer'],
      project: {
        id: '$_id',
        category: 1,
        question: 1,
        answer: 1,
        order: 1,
        status: 1,
        isDeleted: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  );

  return {
    data: result.data,
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
  };
};

exports.distinctCategories = async () => {
  const categories = await FAQ.distinct('category', { isDeleted: false });
  return categories
    .map((c) => (c || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};
