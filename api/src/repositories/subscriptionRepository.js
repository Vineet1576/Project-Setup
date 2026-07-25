const mongoose = require('mongoose');
const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const Subscription = db.subscriptions;
const ObjectId = mongoose.Types.ObjectId;
const fields = [
  'plan_id',
  'stripe_price_id',
  'unit_amount',
  'currency',
  'interval',
  'dispensary',
  'valid_upto',
  'userId',
  'stripe_subscription_id',
  'invoice_pdf',
  'status',
  'isDeleted',
  'venueId',
  'organizationId',
];

const serializeSub = (doc) => serialize(doc, fields);

exports.findById = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Subscription.findById(id).lean();
  return serializeSub(doc);
};

exports.findOne = async (filter, options = {}) => {
  let query = Subscription.findOne(filter);
  if (options.populate) query = query.populate(options.populate);
  const doc = await query.lean();
  return serializeSub(doc);
};

exports.findWithPopulate = async (filter) => {
  const doc = await Subscription.findOne(filter).populate('plan_id').lean();
  return doc ? { ...doc, id: doc._id?.toString() } : null;
};

exports.create = async (data) => {
  const doc = await Subscription.create(data);
  return serializeSub(doc);
};

exports.updateOne = async (filter, data) => {
  return Subscription.updateOne(filter, { $set: data });
};

exports.findByIdAndUpdate = async (id, data, options = {}) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Subscription.findByIdAndUpdate(id, data, { new: true, ...options }).lean();
  return serializeSub(doc);
};

exports.updateMany = async (filter, data) => {
  return Subscription.updateMany(filter, data);
};

exports.aggregateDetail = async (id) => {
  if (!id || !isValidObjectId(id)) return [];
  return Subscription.aggregate([
    { $match: { _id: new ObjectId(id), isDeleted: false } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    {
      $lookup: {
        from: 'venues',
        localField: 'userId',
        foreignField: '_id',
        as: 'venueDetails',
      },
    },
    { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$venueDetails', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'plans',
        localField: 'plan_id',
        foreignField: '_id',
        as: 'planDetails',
      },
    },
    { $unwind: { path: '$planDetails', preserveNullAndEmptyArrays: false } },
    {
      $lookup: {
        from: 'features',
        localField: 'planDetails.features',
        foreignField: '_id',
        as: 'featureDetails',
      },
    },
    {
      $project: {
        _id: 1,
        plan_id: 1,
        unit_amount: 1,
        currency: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        subscriberInfo: {
          $let: {
            vars: { info: { $ifNull: ['$userDetails', '$venueDetails'] } },
            in: {
              _id: '$$info._id',
              name: { $ifNull: ['$$info.fullName', '$$info.name'] },
              email: '$$info.email',
              image: '$$info.image',
              role: '$$info.role',
              isFreePlanBy: '$$info.freePlanBuy',
            },
          },
        },
        planDetail: {
          _id: '$planDetails._id',
          name: '$planDetails.name',
          features: '$featureDetails',
        },
      },
    },
  ]);
};

exports.findFeaturesByIds = async (ids) => {
  const features = await db.features
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
    .select('-addedBy -status -isDeleted -createdAt -updatedAt')
    .lean();
  return features;
};

exports.findAllWithPagination = async (filters) => {
  const { page, count, sortBy, userId, status, isDeleted, type, search } = filters;

  const match = { isDeleted: Boolean(isDeleted) };
  if (status) match.status = status;
  if (type) match['interval.type'] = type;
  if (userId && isValidObjectId(userId)) match.userId = new ObjectId(userId);

  const sortOption = helper.parseSortParam(sortBy, 'updatedAt');

  const excludeSubscriberFields = {
    password: 0,
    mobileno: 0,
    mobileNo: 0,
    isDeleted: 0,
    role: 0,
    description: 0,
    gallery: 0,
    note: 0,
    state: 0,
    country: 0,
    city: 0,
    currentLocation: 0,
    abnKey: 0,
    trading: 0,
    planId: 0,
    Subscription_id: 0,
    stripe_subscriptionId: 0,
    stripe_priceId: 0,
    customer_id: 0,
    stripe_invoices: 0,
    isVerified: 0,
    isExpire: 0,
    isOnline: 0,
    deviceTokens: 0,
    seriesTracking: 0,
    venueLogs: 0,
    purchasedPlans: 0,
    updatedAt: 0,
    emailVerificationCode: 0,
    emailVerificationExpiresAt: 0,
    verificationCode: 0,
    organizationAdded: 0,
    bio: 0,
    preferences: 0,
    permissions: 0,
    waiver: 0,
  };

  const result = await paginateWrapper(
    Subscription,
    { page: Number(page), limit: Number(count), match },
    {
      sort: sortOption,
      lookups: [
        {
          from: 'organizations',
          let: { orgId: '$userId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$orgId'] } } },
            { $project: excludeSubscriberFields },
          ],
          as: 'userDetails',
        },
        {
          from: 'venues',
          let: { venueId: '$userId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$venueId'] } } },
            { $project: excludeSubscriberFields },
          ],
          as: 'venueDetails',
        },
        { from: 'plans', localField: 'plan_id', foreignField: '_id', as: 'planDetails' },
      ],
      unwindFields: ['$userDetails', '$venueDetails', '$planDetails'],
    },
  );

  return result;
};
