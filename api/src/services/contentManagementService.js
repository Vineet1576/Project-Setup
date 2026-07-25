const { contentManagementRepo } = require("../repositories");
const constants = require("../utils/constants");
const helper = require("../utils/helpers");

const findContentOrThrow = async (params) => {
  const content = await contentManagementRepo.findByTitleOrIdOrSlug(params);
  if (!content) throw constants.CONTENT_MANAGEMENT.NOT_FOUND;
  return content;
};

exports.listing = async (data) => {
  const { search, page = 1, count = 10, sortBy, title, status } = data;
  return contentManagementRepo.findAllWithPagination({ search, page, count, sortBy, title, status });
};

exports.addContent = async (data) => {
  if (!data.title || !data.title.trim()) throw "Title is required";

  data.title = data.title.toLowerCase().trim();
  data.slug = await helper.generateSlug(data.title);

  const existingData = await contentManagementRepo.findByTitleOrIdOrSlug({ slug: data.slug });
  if (existingData) throw constants.CONTENT_MANAGEMENT.ALREADY_EXIST;

  data.heading = data.heading ? data.heading.trim() : data.title;
  data.type = data.title;

  data.image = Array.isArray(data.image)
    ? data.image.map((img) => img.trim())
    : [];
  data.description = data.description ? data.description.trim() : "";
  data.meta_title = data.meta_title ? data.meta_title.trim() : "";
  data.meta_description = data.meta_description
    ? data.meta_description.trim()
    : "";
  data.meta_key = data.meta_key ? data.meta_key.trim() : "";
  data.keywords = Array.isArray(data.keywords)
    ? data.keywords.map((k) => k.trim())
    : [];
  data.videos = Array.isArray(data.videos)
    ? data.videos.map((v) => ({
        url: v.url ? v.url.trim() : "",
        title: v.title ? v.title.trim() : "",
      }))
    : [];

  return contentManagementRepo.create(data);
};

exports.editContent = async (data) => {
  const { id } = data;
  if (!id) throw "id is required";

  if (data.title) data.type = data.title.toLowerCase();

  await findContentOrThrow({ id });
  await contentManagementRepo.updateOne(id, data);
};

exports.getContent = async ({ title, id, slug }) => {
  const content = await contentManagementRepo.findByTitleOrIdOrSlug({ title, id, slug });
  if (!content) throw constants.CONTENT_MANAGEMENT.TITLE_MISSING;
  return content;
};

exports.statusUpdate = async ({ status, title, id }) => {
  const existed = await findContentOrThrow({ title, id });
  await contentManagementRepo.updateOne(existed.id, { status });
};
