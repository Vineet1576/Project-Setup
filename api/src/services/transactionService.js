const { transactionRepo } = require("../repositories");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const helper = require("../utils/helpers");
const { generateCustomInvoicePDF } = require("../utils/invoices");
const { customerPlanPurchaseEmail } = require("../Emails/stripeEmails");
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
  });
};

exports.list = async (params) => {
  return transactionRepo.findAllWithPagination(params);
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

  await customerPlanPurchaseEmail({
    name: subscriber.fullName || subscriber.name || "Customer",
    email: subscriber.email,
    planName: plan?.name || "N/A",
    planPrice: Number(transaction.amount || 0),
    planValidity: transaction.createdAt
      ? new Date(transaction.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "N/A",
    invoiceUrl: savedUrl,
    type: transaction.type || plan?.type,
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
