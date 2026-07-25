const mongoose = require('mongoose');
const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const Category = db.category;
const fields = [
  'name',
  'type',
  'nameKey',
  'country',
  'image',
  'countryKey',
  'isParent',
  'parentId',
  'status',
  'isDeleted',
  'addedBy',
  'deleteAt',
];

const serializeCategory = (doc) => serialize(doc, fields);

exports.findById = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Category.findById(id).lean();
  return serializeCategory(doc);
};

exports.findOne = async (filter) => {
  const doc = await Category.findOne(filter).lean();
  return serializeCategory(doc);
};

exports.create = async (data) => {
  const doc = await Category.create(data);
  return serializeCategory(doc);
};

exports.updateOne = async (id, data) => {
  if (!id || !isValidObjectId(id)) return null;
  const result = await Category.updateOne({ _id: id }, { $set: data });
  return result;
};

exports.softDelete = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  return Category.updateOne({ _id: id, isDeleted: false }, { isDeleted: true });
};

exports.softDeleteCategorized = async (id) => {
  if (!id || !isValidObjectId(id)) return { modifiedCount: 0 };
  return Category.updateOne({ _id: id, isDeleted: false }, { isDeleted: true });
};

exports.findExisting = async ({ name, type, isParent, parentId }) => {
  const query = {
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    type: { $regex: new RegExp(`^${type}$`, 'i') },
    isDeleted: false,
    isParent,
  };
  if (isParent) {
    query.parentId = null;
  } else if (parentId && isValidObjectId(parentId)) {
    query.parentId = new mongoose.Types.ObjectId(parentId);
  } else {
    query.parentId = null;
  }
  const doc = await Category.findOne(query).lean();
  return serializeCategory(doc);
};

exports.findAllWithPagination = async (filters) => {
  const { search, sortBy, page, count, status, type, isParent, parentId } = filters;
  const match = { isDeleted: false };
  if (status) match.status = status === 'deactive' ? 'inactive' : status;
  if (type) match.type = type;
  if (isParent !== undefined) match.isParent = isParent === 'true';
  if (parentId) match.parentId = parentId;

  const result = await paginateWrapper(
    Category,
    {
      page: Number(page),
      limit: Number(count),
      search: search && search.trim() !== '' ? search.trim() : undefined,
      match,
    },
    {
      sort: helper.parseSortParam(sortBy),
      searchFields: ['name', 'type', 'country'],
      project: {
        name: 1,
        nameKey: 1,
        isParent: 1,
        parentId: 1,
        type: 1,
        country: 1,
        image: 1,
        countryKey: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  );

  return {
    data: result.data.map((cat) => ({ ...cat, id: cat._id })),
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
  };
};

exports.findSubCategories = async (filters) => {
  const { search, sortBy, page, count, status, type, parentId, category } = filters;
  const match = { isDeleted: false, isParent: true };
  if (search) match.$or = [{ nameKey: { $regex: search.toLowerCase(), $options: 'i' } }];
  if (type) match.type = type;
  if (status) match.status = status;
  if (parentId) {
    const ids = parentId.split(',');
    match.parentId = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
  }
  if (category) match.parentId = new mongoose.Types.ObjectId(category);

  const result = await paginateWrapper(
    Category,
    { page: Number(page), limit: Number(count), match },
    {
      sort: helper.parseSortParam(sortBy),
      lookups: [
        { from: 'categories', localField: 'parentId', foreignField: '_id', as: 'parentData' },
      ],
      unwindFields: ['$parentData'],
      project: {
        id: '$_id',
        name: 1,
        nameKey: 1,
        isParent: 1,
        parentId: 1,
        parentData: 1,
        image: 1,
        type: 1,
        country: 1,
        countryKey: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        isDeleted: 1,
      },
    },
  );

  return { data: result.data, total: result.pagination.total };
};

exports.changeStatus = async (id, status) => {
  if (!id || !isValidObjectId(id)) return null;
  await Category.updateOne({ _id: id }, { status });
};

exports.findLinkedActivity = async (id) => {
  const activity = await db.activity?.findOne({ category: id, status: 'active' }).lean();
  return activity || null;
};
