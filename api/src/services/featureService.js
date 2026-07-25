const { featureRepo } = require("../repositories");
const constants = require("../utils/constants");

const findFeatureOrThrow = async (id) => {
  const feature = await featureRepo.findById(id);
  if (!feature) throw constants.FEATURE.NOT_FOUND;
  return feature;
};

exports.addFeatures = async (data) => {
  const names = data.name.map((item) => item.name);

  const existingFeatures = await featureRepo.findByNameIn(names);
  if (existingFeatures.length > 0) throw constants.FEATURE.ALREADY_EXIST;

  await featureRepo.insertMany(
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
    const nameCheck = await featureRepo.findByNameExcluding(rest.name, id);
    if (nameCheck) throw constants.FEATURE.ALREADY_EXIST;
  }

  await featureRepo.updateOne(id, rest);
};

exports.deleteFeature = async ({ id }) => {
  await findFeatureOrThrow(id);

  const isFeaturePlanExits = await featureRepo.findPlansUsingFeature(id);
  if (isFeaturePlanExits.length > 0) throw constants.FEATURE.NOT_IN_PLAN;

  await featureRepo.softDelete(id);
};

exports.changeFeatureStatus = async ({ id, status }) => {
  await findFeatureOrThrow(id);
  await featureRepo.changeStatus(id, status);
};

exports.getAllFeatures = async (data) => {
  let { search, sortBy, status, page = 1, count = 10, isDeleted = false } = data;
  return featureRepo.findAllWithPagination({ search, sortBy, status, page, count, isDeleted });
};
