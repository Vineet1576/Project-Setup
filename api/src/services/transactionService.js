const db = require('../models');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { paginate } = require('../utils/paginate');
const helper = require('../utils/helpers');
const { generateCustomInvoicePDF } = require('../utils/invoices');
const { customerPlanPurchaseEmail } = require('../Emails/stripeEmails');

exports.create = async ({
  userId,
  purchased_planId,
  amount,
  status,
  currency,
  stripe_session_id,
  stripe_payment_id,
  invoiceUrl,
  subscriptionId,
  type,
}) => {
  if (!userId) return null;

  return db.transactions.create({
    userId,
    purchased_planId,
    amount,
    status: status || 'pending',
    currency: currency || 'usd',
    stripe_session_id,
    stripe_payment_id: stripe_payment_id || '',
    invoiceUrl: invoiceUrl || '',
    subscriptionId,
    type,
  });
};

exports.list = async (params) => {
  const { page = 1, count = 10, sortBy, userId, search, status, isDeleted = false } = params;

  const match = { isDeleted: Boolean(isDeleted) };
  if (status) match.status = status;
  if (userId) match.userId = new mongoose.Types.ObjectId(userId);

  const sortOption = helper.parseSortParam(sortBy, 'updatedAt');

  const result = await paginate(db.transactions, {
    page: Number(page),
    limit: Number(count),
    match,
    sort: sortOption,
    search,
    searchFields: ['stripe_session_id', 'status', 'currency'],
    lookups: [
      {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userDetails',
      },
      {
        from: 'venues',
        localField: 'userId',
        foreignField: '_id',
        as: 'venueDetails',
      },
      {
        from: 'plans',
        localField: 'purchased_planId',
        foreignField: '_id',
        as: 'planDetails',
      },
    ],
    unwindFields: ['$userDetails', '$venueDetails', '$planDetails'],
  });

  const data = result.data.map((item) => {
    const subscriber = item.userDetails || item.venueDetails;
    return {
      _id: item._id,
      userId: item.userId,
      purchased_planId: item.purchased_planId,
      amount: item.amount,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      planDetails: item.planDetails,
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

exports.sendInvoice = async (transactionId) => {
  const transaction = await db.transactions
    .findOne({ _id: new mongoose.Types.ObjectId(transactionId), isDeleted: false })
    .lean();

  if (!transaction) throw 'Transaction not found';

  const plan = await db.plan
    .findOne({ _id: transaction.purchased_planId, isDeleted: false })
    .lean();

  const subscriber = await db.users.findOne({ _id: transaction.userId, isDeleted: false }).lean();

  if (!subscriber) throw 'Subscriber not found';

  const directoryPath = path.join(__dirname, '../../public/invoices');
  const fileName = `invoice_${transaction.stripe_session_id || transaction._id}.pdf`;
  const filePath = path.join(directoryPath, fileName);
  const publicUrl = `${process.env.BACK_WEB_URL}/invoices/${fileName}`;

  let savedUrl = transaction.invoiceUrl;
  const fileExists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) {
    try {
      const buffer = await generateCustomInvoicePDF({
        invoiceNumber: transaction.stripe_session_id || `INV-${Date.now()}`,
        customerName: subscriber.fullName || subscriber.name || 'Customer',
        customerEmail: subscriber.email,
        planName: plan?.name || 'N/A',
        amount: Number(transaction.amount || 0).toFixed(2),
        currency: (transaction.currency || 'usd').toUpperCase(),
        type: transaction.type || plan?.type,
      });

      await fs.mkdir(directoryPath, { recursive: true });
      await fs.writeFile(filePath, buffer);
      savedUrl = publicUrl;

      await db.transactions.findByIdAndUpdate(transaction._id, {
        $set: { invoiceUrl: savedUrl },
      });
    } catch (err) {
      console.error('Invoice PDF generation failed:', err);
    }
  }

  await customerPlanPurchaseEmail({
    name: subscriber.fullName || subscriber.name || 'Customer',
    email: subscriber.email,
    planName: plan?.name || 'N/A',
    planPrice: Number(transaction.amount || 0),
    planValidity: transaction.createdAt
      ? new Date(transaction.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : 'N/A',
    invoiceUrl: savedUrl,
    type: transaction.type || plan?.type,
  });

  return { sent: true, email: subscriber.email, invoiceUrl: savedUrl };
};

exports.getInvoice = async (transactionId) => {
  const transaction = await db.transactions
    .findOne({ _id: new mongoose.Types.ObjectId(transactionId), isDeleted: false })
    .lean();

  if (!transaction) throw 'Transaction not found';

  const fileName = `invoice_${transaction.stripe_session_id || transaction._id}.pdf`;
  const filePath = path.join(__dirname, '../../public/invoices', fileName);

  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  if (!exists) throw 'Invoice file not found. Please generate it first.';

  return { filePath, fileName };
};
