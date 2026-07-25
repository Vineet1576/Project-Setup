const mongoose = require('mongoose');
const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const Plan = db.plan;
const fields = [
  'name',
  'plan_type',
  'dispensary',
  'venues',
  'maxDispensaries',
  'numberOfDays',
  'numberOfDispenseries',
  'numberOfNotifications',
  'pricing',
  'features',
  'isActive',
  'stripe_price_id',
  'stripe_product_id',
  'isChecked',
  'currencyType',
  'description',
  'trial_period_days',
  'addedBy',
  'status',
  'isDeleted',
  'recommended',
  'tournament',
  'type',
  'series',
  'seriesTournaments',
  'seriesFeaturedLimit',
  'tournamentFeaturedLimit',
  'planFor',
];

const serializePlan = (doc) => serialize(doc, fields);

exports.findById = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Plan.findOne({ _id: id, isDeleted: false }).lean();
  return serializePlan(doc);
};

exports.findOne = async (filter) => {
  const doc = await Plan.findOne(filter).lean();
  return serializePlan(doc);
};

exports.findDetail = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Plan.findOne({ _id: id, isDeleted: false })
    .populate('dispensary')
    .populate('features')
    .lean();
  if (!doc) return null;
  return { ...doc, id: doc._id.toString(), _id: undefined };
};

exports.create = async (data) => {
  const doc = await Plan.create(data);
  return serializePlan(doc);
};

exports.updateOne = async (id, data) => {
  if (!id || !isValidObjectId(id)) return null;
  await Plan.updateOne({ _id: id }, { $set: data });
};

exports.softDelete = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const result = await Plan.updateOne(
    { _id: id.trim() },
    { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } },
  );
  return result;
};

exports.findUsersByPlanId = async (planId) => {
  return db.users.find({ planId, isDeleted: false }).lean();
};

exports.findAllWithPagination = async (filters) => {
  const {
    search,
    plan_type,
    page,
    count,
    dispensary,
    status,
    isDeleted,
    sortBy,
    userId,
    planFor,
    type,
  } = filters;

  const match = {};
  match.isDeleted = isDeleted === 'true';
  if (status) match.status = status;
  if (type) match.type = type.toLowerCase();
  if (planFor) match.planFor = planFor;
  if (plan_type) match.plan_type = plan_type;
  if (dispensary) match.dispensary = new mongoose.Types.ObjectId(dispensary);

  const sortOption = helper.parseSortParam(sortBy, 'updatedAt');

  const result = await paginateWrapper(
    Plan,
    { page: Number(page), limit: Number(count), search: search || undefined, match },
    {
      sort: sortOption,
      searchFields: ['name'],
      lookups: [
        {
          from: 'dispensaries',
          localField: 'dispensary',
          foreignField: '_id',
          as: 'dispensaryDetails',
        },
        { from: 'features', localField: 'features', foreignField: '_id', as: 'features_details' },
      ],
      unwindFields: ['$dispensaryDetails'],
      project: {
        name: 1,
        pricing: 1,
        plan_type: 1,
        stripe_price_id: 1,
        stripe_plan_id: 1,
        features: '$features_details',
        recommended: 1,
        numberOfDays: 1,
        numberOfDispenseries: 1,
        numberOfNotifications: 1,
        currencyType: 1,
        trial_period_days: 1,
        description: 1,
        isActive: 1,
        status: 1,
        isDeleted: 1,
        createdAt: 1,
        updatedAt: 1,
        dispensary: '$dispensaryDetails',
        type: 1,
        series: 1,
        seriesTournaments: 1,
        seriesFeaturedLimit: 1,
        tournamentFeaturedLimit: 1,
      },
    },
  );

  return result;
};
