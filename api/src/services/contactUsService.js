const db = require("../models");
const constants = require("../utils/constants");
const Emails = require("../Emails/templates");
const helper = require("../utils/helpers");
const { paginate } = require("../utils/paginate");

const requireId = (id) => {
  if (!id) throw constants.ContactUs.ID_REQUIRED;
};

const findContactOrThrow = async (id) => {
  requireId(id);
  const detail = await db.contactUs.findById(id).lean();
  if (!detail) throw constants.ContactUs.NOT_FOUND;
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

  const created = await db.contactUs.create(data);
  if (!created) throw constants.ContactUs.NOT_CREATED;

  Emails.contactUsToAdmin({
    email: data.email,
    name: data.fullName,
    message: data.message,
    adminEmail: process.env.ADMINEMAIL,
  });

  return created;
};

exports.detail = async ({ id }) => {
  return findContactOrThrow(id);
};

exports.update = async ({ id, ...data }) => {
  await findContactOrThrow(id);
  if (data.email) data.email = data.email.toLowerCase();

  const existed = await db.contactUs.findOneAndUpdate({ _id: id }, data, {
    new: true,
    lean: true,
  });
  return existed;
};

exports.delete = async ({ id }) => {
  requireId(id);
  const result = await db.contactUs.updateOne(
    { _id: id, isDeleted: false },
    { isDeleted: true },
  );
  if (!result.modifiedCount) throw constants.ContactUs.NOT_FOUND;
};

exports.listing = async (data) => {
  const { search, page = 1, count = 10, sortBy, status } = data;
  const match = { isDeleted: false };

  if (status) match.status = status;

  const sortOption = helper.parseSortParam(sortBy);

  const result = await paginate(db.contactUs, {
    page: Number(page),
    limit: Number(count),
    match,
    sort: sortOption,
    project: {
      _id: 1,
      title: 1,
      description: 1,
      link: 1,
      firstName: 1,
      lastName: 1,
      fullName: 1,
      email: 1,
      message: 1,
      createdAt: 1,
      updatedAt: 1,
      isDeleted: 1,
      status: 1,
      addedBy: 1,
    },
    search: search || undefined,
    searchFields: ["fullName", "email"],
  });

  return {
    data: result.data,
    total: result.pagination.total,
  };
};

exports.changeStatus = async ({ id, status }) => {
  const existed = await findContactOrThrow(id);

  await db.contactUs.findOneAndUpdate(
    { _id: id },
    { status },
    { new: true, lean: true },
  );

  if (status === "read") {
    await Emails.sendContactUsStatusUpdate({
      status,
      email: existed.email,
      fullName: existed.fullName,
      message: existed.message,
    });
  }
};
