const { faqRepo } = require("../repositories");
const constants = require("../utils/constants");

const findFaqOrThrow = async (id) => {
  if (!id) throw constants.FAQ.ID_REQUIRED;
  const faq = await faqRepo.findById(id);
  if (!faq) throw constants.FAQ.NOT_FOUND;
  return faq;
};

exports.createFaq = async (data) => {
  const category = (data.category || "").trim();
  const question = (data.question || "").trim();
  const answer = (data.answer || "").trim();
  if (!category || !question || !answer) throw constants.FAQ.PAYLOAD_MISSING;

  return faqRepo.create({
    category,
    question,
    answer,
    order: Number(data.order) || 0,
    status: data.status === "inactive" ? "inactive" : "active",
    isDeleted: false,
  });
};

exports.updateFaq = async (data) => {
  const { id } = data;
  const existing = await findFaqOrThrow(id);

  const updateData = {};
  if (data.category !== undefined) updateData.category = String(data.category).trim();
  if (data.question !== undefined) updateData.question = String(data.question).trim();
  if (data.answer !== undefined) updateData.answer = String(data.answer).trim();
  if (data.order !== undefined) updateData.order = Number(data.order) || 0;
  if (data.status !== undefined) updateData.status = data.status;

  if (!updateData.category || !updateData.question || !updateData.answer) {
    throw constants.FAQ.PAYLOAD_MISSING;
  }

  await faqRepo.updateOne(id, updateData);
  return { ...existing, ...updateData };
};

exports.deleteFaq = async ({ id }) => {
  await findFaqOrThrow(id);
  const result = await faqRepo.softDelete(id);
  if (result.modifiedCount === 0) throw constants.FAQ.NOT_FOUND;
};

exports.changeFaqStatus = async ({ id, status }) => {
  await findFaqOrThrow(id);
  if (!status) throw constants.FAQ.PAYLOAD_MISSING;
  await faqRepo.changeStatus(id, status);
};

exports.getFaqDetail = async ({ id }) => {
  return findFaqOrThrow(id);
};

exports.getAdminFaqs = async (data) => {
  const { search, sortBy, status, category, page = 1, count = 10, isDeleted = false } = data;
  return faqRepo.findAllWithPagination({ search, sortBy, status, category, page, count, isDeleted });
};

exports.getAllFaqs = async () => {
  const faqs = await faqRepo.findAllActive();

  const groups = [];
  const map = {};
  for (const faq of faqs) {
    const key = faq.category || "General";
    if (!map[key]) {
      map[key] = { category: key, items: [] };
      groups.push(map[key]);
    }
    map[key].items.push({
      question: faq.question,
      answer: faq.answer,
    });
  }

  return groups;
};

exports.getAllCategories = async () => {
  return faqRepo.distinctCategories();
};
