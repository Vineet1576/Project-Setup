const { feedbackRepo } = require("../repositories");
const constants = require("../utils/constants");
const Emails = require("../Emails/templates");
const helper = require("../utils/helpers");

const findFeedbackOrThrow = async (id) => {
  if (!id) throw constants.Feedback.ID_REQUIRED;
  const detail = await feedbackRepo.findById(id);
  if (!detail) throw constants.Feedback.NOT_FOUND;
  return detail;
};

exports.add = async (data) => {
  if (!data.email) throw constants.CON;

  data.fullName = [data.firstName?.trim() || "", data.lastName?.trim() || ""]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  data.email = data.email.toLowerCase();
  data.message = data.message?.trim() || "";

  const created = await feedbackRepo.create(data);
  if (!created) throw constants.Feedback.NOT_CREATED;

  Emails.feedbackToAdmin({
    email: data.email,
    name: data.fullName,
    message: data.message,
    adminEmail: process.env.ADMINEMAIL,
  });

  Emails.feedbackThankYou({
    email: data.email,
    fullName: data.fullName,
    message: data.message,
    topic: data.topic,
  });

  return created;
};

exports.detail = async ({ id }) => {
  const detail = await findFeedbackOrThrow(id);
  const replies = await feedbackRepo.findRepliesByParentId(id);
  return { ...detail, replies };
};

exports.update = async ({ id, ...data }) => {
  await findFeedbackOrThrow(id);
  if (data.email) data.email = data.email.toLowerCase();

  return feedbackRepo.findOneAndUpdate(id, data);
};

exports.delete = async ({ id }) => {
  if (!id) throw constants.Feedback.ID_REQUIRED;
  const result = await feedbackRepo.softDelete(id);
  if (!result.modifiedCount) throw constants.Feedback.NOT_FOUND;
};

exports.listing = async (data) => {
  const { search, page = 1, count = 10, sortBy, status, topic, email } = data;
  const result = await feedbackRepo.findAllWithPagination({ search, page, count, sortBy, status, topic, email });

  const parentIds = (result.data || []).map((f) => f._id || f.id);
  const replies = parentIds.length ? await feedbackRepo.findRepliesByParentIds(parentIds) : [];
  const repliesByParent = {};
  for (const r of replies) {
    const pid = String(r.parentFeedback || "");
    if (!repliesByParent[pid]) repliesByParent[pid] = [];
    repliesByParent[pid].push(r);
  }

  result.data = (result.data || []).map((f) => ({
    ...f,
    replies: repliesByParent[String(f._id || f.id)] || [],
  }));

  return result;
};

exports.changeStatus = async ({ id, status }) => {
  await findFeedbackOrThrow(id);

  await feedbackRepo.findOneAndUpdate(id, { status });
};

exports.reply = async ({ id, message, addedBy }) => {
  const existed = await findFeedbackOrThrow(id);
  if (!existed.email) throw constants.Feedback.NOT_FOUND_EMAIL;

  const fullName = existed.fullName || [existed.firstName, existed.lastName].filter(Boolean).join(" ") || "-";

  await feedbackRepo.create({
    parentFeedback: id,
    email: existed.email,
    fullName,
    topic: existed.topic || "Reply",
    message: message?.trim() || "",
    status: "read",
    addedBy,
  });

  if (existed.status !== "read") {
    await feedbackRepo.findOneAndUpdate(id, { status: "read" });
  }

  await Emails.feedbackReply({
    email: existed.email,
    fullName,
    message,
  });
};