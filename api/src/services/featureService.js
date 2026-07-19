const db = require('../models');
const constants = require('../utils/constants');
const helper = require('../utils/helpers');
const { paginate } = require('../utils/paginate');

const findFeatureOrThrow = async (id) => {
  const feature = await db.features.findOne({ _id: id, isDeleted: false });
  if (!feature) throw constants.FEATURE.NOT_FOUND;
  return feature;
};

exports.addFeatures = async (data) => {
  const names = data.name.map((item) => item.name);

  const existingFeatures = await db.features.find({
    isDeleted: false,
    name: { $in: names },
  });

  if (existingFeatures.length > 0) throw constants.FEATURE.ALREADY_EXIST;

  await db.features.insertMany(
    names.map((name) => ({ name, addedBy: data.addedBy })),
  );
};

exports.findSingleFeature = async ({ id }) => {
  return findFeatureOrThrow(id);
};

exports.editFeature = async (data) => {
  const { id, ...rest } = data;
  await findFeatureOrThrow(id);

  if (rest.name) {
    const nameCheck = await db.features.findOne({
      name: rest.name,
      isDeleted: false,
      _id: { $ne: id },
    });
    if (nameCheck) throw constants.FEATURE.ALREADY_EXIST;
  }

  await db.features.updateOne({ _id: id, isDeleted: false }, rest);
};

exports.deleteFeature = async ({ id }) => {
  await findFeatureOrThrow(id);

  const isFeaturePlanExits = await db.plan.find({
    features: { $in: id },
    isDeleted: false,
  });
  if (isFeaturePlanExits.length > 0) throw constants.FEATURE.NOT_IN_PLAN;

  await db.features.updateOne({ _id: id }, { $set: { isDeleted: true } });
};

exports.changeFeatureStatus = async ({ id, status }) => {
  await findFeatureOrThrow(id);
  await db.features.updateOne({ _id: id }, { $set: { status } });
};

exports.getAllFeatures = async (data) => {
  let { search, sortBy, status, page = 1, count = 10, isDeleted = false } = data;

  const match = {};
  match.isDeleted = isDeleted === 'true';

  if (status) match.status = status;

  const sortOption = helper.parseSortParam(sortBy);

  const result = await paginate(db.features, {
    page: Number(page),
    limit: Number(count),
    match,
    sort: sortOption,
    lookups: [
      {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'addedBy_Details',
      },
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
    search: search || undefined,
    searchFields: ['name'],
  });

  return { data: result.data, total: result.pagination.total };
};
