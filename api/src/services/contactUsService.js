const { contactUsRepo } = require("../repositories");
const constants = require("../utils/constants");
const Emails = require("../Emails/templates");
const helper = require("../utils/helpers");

const findContactOrThrow = async (id) => {
  if (!id) throw constants.ContactUs.ID_REQUIRED;
  const detail = await contactUsRepo.findById(id);
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

  const created = await contactUsRepo.create(data);
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

  return contactUsRepo.findOneAndUpdate(id, data);
};

exports.delete = async ({ id }) => {
  if (!id) throw constants.ContactUs.ID_REQUIRED;
  const result = await contactUsRepo.softDelete(id);
  if (!result.modifiedCount) throw constants.ContactUs.NOT_FOUND;
};

exports.listing = async (data) => {
  const { search, page = 1, count = 10, sortBy, status } = data;
  return contactUsRepo.findAllWithPagination({ search, page, count, sortBy, status });
};

exports.changeStatus = async ({ id, status }) => {
  const existed = await findContactOrThrow(id);

  await contactUsRepo.findOneAndUpdate(id, { status });

  if (status === "read") {
    await Emails.sendContactUsStatusUpdate({
      status,
      email: existed.email,
      fullName: existed.fullName,
      message: existed.message,
    });
  }
};
