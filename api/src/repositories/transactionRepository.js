const mongoose = require('mongoose');
const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const Transaction = db.transactions;
const fields = [
  'userId',
  'purchased_planId',
  'amount',
  'currency',
  'status',
  'stripe_session_id',
  'stripe_payment_id',
  'invoiceUrl',
  'type',
  'subscriptionId',
  'transactionId',
  'invoiceId',
  'planDetails',
  'stripe_fee',
  'net_amount',
  'isDeleted',
];

const generateCustomId = (prefix) => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${dateStr}-${rand}`;
};

const serializeTx = (doc) => serialize(doc, fields);

exports.create = async (data) => {
  const doc = await Transaction.create({
    userId: data.userId,
    purchased_planId: data.purchased_planId,
    amount: data.amount,
    status: data.status || 'pending',
    currency: data.currency || 'usd',
    stripe_session_id: data.stripe_session_id,
    stripe_payment_id: data.stripe_payment_id || '',
    invoiceUrl: data.invoiceUrl || '',
    subscriptionId: data.subscriptionId,
    type: data.type,
    transactionId: data.transactionId || generateCustomId('TXN'),
    invoiceId: data.invoiceId || generateCustomId('INV'),
    planDetails: data.planDetails || {},
    stripe_fee: data.stripe_fee || 0,
    net_amount: data.net_amount || 0,
  });
  return serializeTx(doc);
};

exports.findOne = async (filter) => {
  const doc = await Transaction.findOne(filter).lean();
  return serializeTx(doc);
};

exports.findByIdAndUpdate = async (id, data) => {
  if (!id) return null;
  const doc = await Transaction.findByIdAndUpdate(id, data, { new: true }).lean();
  return serializeTx(doc);
};

exports.findInvoiceTransaction = async (transactionId) => {
  if (!transactionId) return null;
  return Transaction.findOne({
    _id: new mongoose.Types.ObjectId(transactionId),
    isDeleted: false,
  }).lean();
};

exports.findAllWithPagination = async (filters) => {
  const { page = 1, count = 10, sortBy, userId, search, status, isDeleted } = filters;

  const match = { isDeleted: Boolean(isDeleted) };
  if (status) match.status = status;
  if (userId) match.userId = new mongoose.Types.ObjectId(userId);

  const sortOption = helper.parseSortParam(sortBy, 'updatedAt');

  const result = await paginateWrapper(
    Transaction,
    { page: Number(page), limit: Number(count), search, match },
    {
      sort: sortOption,
      searchFields: ['transactionId', 'stripe_session_id', 'status', 'currency'],
      lookups: [
        { from: 'users', localField: 'userId', foreignField: '_id', as: 'userDetails' },
        { from: 'venues', localField: 'userId', foreignField: '_id', as: 'venueDetails' },
        { from: 'plans', localField: 'purchased_planId', foreignField: '_id', as: 'planLookup' },
      ],
      unwindFields: ['$userDetails', '$venueDetails', '$planLookup'],
    },
  );

  const data = result.data.map((item) => {
    const subscriber = item.userDetails || item.venueDetails;
    const storedPlan = item.planDetails && Object.keys(item.planDetails).length
      ? item.planDetails
      : null;

    return {
      _id: item._id,
      userId: item.userId,
      purchased_planId: item.purchased_planId,
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      transactionId: item.transactionId,
      invoiceId: item.invoiceId,
      invoiceUrl: item.invoiceUrl,
      stripe_fee: item.stripe_fee,
      net_amount: item.net_amount,
      interval: storedPlan?.interval || null,
      planDetails: storedPlan
        ? storedPlan
        : item.planLookup
          ? {
              _id: item.planLookup._id,
              name: item.planLookup.name,
              plan_type: item.planLookup.plan_type,
            }
          : null,
      subscriberInfo: subscriber
        ? {
            _id: subscriber._id,
            name: subscriber.fullName || subscriber.name,
            email: subscriber.email,
            image: subscriber.image,
            role: subscriber.role,
          }
        : null,
    };
  });

  return { total: result.pagination.total, data };
};
