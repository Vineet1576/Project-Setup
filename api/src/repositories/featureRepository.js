const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const Feature = db.features;
const fields = ['name', 'addedBy', 'status', 'isDeleted'];

const serializeFeature = (doc) => serialize(doc, fields);

exports.findById = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Feature.findOne({ _id: id, isDeleted: false }).lean();
  return serializeFeature(doc);
};

exports.findByNameIn = async (names) => {
  const docs = await Feature.find({ isDeleted: false, name: { $in: names } }).lean();
  return serializeList(docs, fields);
};

exports.findByNameExcluding = async (name, excludeId) => {
  const query = { name, isDeleted: false };
  if (excludeId && isValidObjectId(excludeId)) query._id = { $ne: excludeId };
  const doc = await Feature.findOne(query).lean();
  return serializeFeature(doc);
};

exports.insertMany = async (items) => {
  const docs = await Feature.insertMany(items);
  return serializeList(docs, fields);
};

exports.updateOne = async (id, data) => {
  if (!id || !isValidObjectId(id)) return null;
  await Feature.updateOne({ _id: id, isDeleted: false }, data);
};

exports.softDelete = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  await Feature.updateOne({ _id: id }, { $set: { isDeleted: true } });
};

exports.changeStatus = async (id, status) => {
  if (!id || !isValidObjectId(id)) return null;
  await Feature.updateOne({ _id: id }, { $set: { status } });
};

exports.findPlansUsingFeature = async (featureId) => {
  if (!featureId || !isValidObjectId(featureId)) return [];
  return db.plan.find({ features: { $in: featureId }, isDeleted: false }).lean();
};

exports.findAllWithPagination = async (filters) => {
  const { search, sortBy, status, page, count, isDeleted } = filters;
  const match = {};
  match.isDeleted = isDeleted === 'true';
  if (status) match.status = status;

  const result = await paginateWrapper(
    Feature,
    { page: Number(page), limit: Number(count), search: search || undefined, match },
    {
      sort: helper.parseSortParam(sortBy),
      searchFields: ['name'],
      lookups: [
        { from: 'users', localField: 'addedBy', foreignField: '_id', as: 'addedBy_Details' },
      ],
      unwindFields: ['$addedBy_Details'],
      project: {
        id: 1,
        name: { $toLower: '$name' },
        status: 1,
        addedBy: 1,
        createdBy: 1,
        isDeleted: 1,
        createdAt: 1,
        updatedAt: 1,
        addedBy_Details: 1,
      },
    },
  );

  return { data: result.data, total: result.pagination.total };
};
