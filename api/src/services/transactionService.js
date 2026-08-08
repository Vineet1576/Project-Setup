const { transactionRepo } = require("../repositories");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const helper = require("../utils/helpers");
const { generateCustomInvoicePDF } = require("../utils/invoices");
const { customerPlanInvoiceEmail } = require("../Emails/stripeEmails");
const db = require("../models");

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
  planDetails,
  stripe_fee,
  net_amount,
}) => {
  if (!userId) return null;

  return transactionRepo.create({
    userId,
    purchased_planId,
    amount,
    status: status || "pending",
    currency: currency || "usd",
    stripe_session_id,
    stripe_payment_id: stripe_payment_id || "",
    invoiceUrl: invoiceUrl || "",
    subscriptionId,
    type,
    planDetails,
    stripe_fee,
    net_amount,
  });
};

exports.list = async (params) => {
  return transactionRepo.findAllWithPagination(params);
};

exports.analytics = async (params = {}) => {
  const match = { isDeleted: false };
  if (params.status) match.status = params.status;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totals, thisMonth, statusCounts, planTotals] = await Promise.all([
    db.transactions.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCharged: { $sum: "$amount" },
          totalFees: { $sum: "$stripe_fee" },
          totalNet: { $sum: "$net_amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    db.transactions.aggregate([
      { $match: { ...match, createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalCharged: { $sum: "$amount" },
          totalFees: { $sum: "$stripe_fee" },
          totalNet: { $sum: "$net_amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    db.transactions.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    db.transactions.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "plans",
          localField: "purchased_planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$plan.name",
          totalCharged: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalCharged: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const row = (rows) => (rows && rows[0]) || { totalCharged: 0, totalFees: 0, totalNet: 0, count: 0 };
  const all = row(totals);
  const month = row(thisMonth);

  const statusMap = {};
  for (const s of statusCounts) statusMap[s._id || "other"] = s.count;

  const totalNet = (all.totalCharged || 0) - (all.totalFees || 0);
  const monthNet = (month.totalCharged || 0) - (month.totalFees || 0);

  return {
    totalCharged: Number((all.totalCharged || 0).toFixed(2)),
    totalStripeFees: Number((all.totalFees || 0).toFixed(2)),
    totalNetAmount: Number(totalNet.toFixed(2)),
    totalTransactions: all.count || 0,
    thisMonth: {
      charged: Number((month.totalCharged || 0).toFixed(2)),
      fees: Number((month.totalFees || 0).toFixed(2)),
      net: Number(monthNet.toFixed(2)),
      count: month.count || 0,
    },
    statusCounts: {
      success: statusMap.success || 0,
      pending: statusMap.pending || 0,
      failed: statusMap.failed || 0,
      cancelled: statusMap.cancelled || 0,
    },
    topPlans: planTotals.map((p) => ({
      name: p._id || "Unknown",
      totalCharged: Number((p.totalCharged || 0).toFixed(2)),
      count: p.count || 0,
    })),
  };
};

exports.sendInvoice = async (transactionId) => {
  const transaction = await transactionRepo.findInvoiceTransaction(transactionId);
  if (!transaction) throw "Transaction not found";

  const plan = await db.plan
    .findOne({ _id: transaction.purchased_planId, isDeleted: false })
    .lean();

  const subscriber = await db.users.findOne({ _id: transaction.userId, isDeleted: false }).lean();
  if (!subscriber) throw "Subscriber not found";

  const directoryPath = path.join(__dirname, "../../public/invoices");
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
        customerName: subscriber.fullName || subscriber.name || "Customer",
        customerEmail: subscriber.email,
        planName: plan?.name || "N/A",
        amount: Number(transaction.amount || 0).toFixed(2),
        currency: (transaction.currency || "usd").toUpperCase(),
        type: transaction.type || plan?.type,
      });

      await fs.mkdir(directoryPath, { recursive: true });
      await fs.writeFile(filePath, buffer);
      savedUrl = publicUrl;

      await transactionRepo.findByIdAndUpdate(transaction._id, {
        $set: { invoiceUrl: savedUrl },
      });
    } catch (err) {
      console.error("Invoice PDF generation failed:", err);
    }
  }

  await customerPlanInvoiceEmail({
    name: subscriber.fullName || subscriber.name || "Customer",
    email: subscriber.email,
    planName: plan?.name || "N/A",
    planPrice: Number(transaction.amount || 0),
    currency: transaction.currency,
    invoiceNumber: transaction.invoiceId || transaction.stripe_session_id || transaction._id,
    invoiceDate: transaction.createdAt
      ? new Date(transaction.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "N/A",
    invoiceUrl: savedUrl,
  });

  return { sent: true, email: subscriber.email, invoiceUrl: savedUrl };
};

exports.getInvoice = async (transactionId) => {
  const transaction = await transactionRepo.findInvoiceTransaction(transactionId);
  if (!transaction) throw "Transaction not found";

  const fileName = `invoice_${transaction.stripe_session_id || transaction._id}.pdf`;
  const filePath = path.join(__dirname, "../../public/invoices", fileName);

  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  if (!exists) throw "Invoice file not found. Please generate it first.";

  return { filePath, fileName };
};
