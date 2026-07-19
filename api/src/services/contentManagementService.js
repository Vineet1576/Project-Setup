const db = require("../models");
const constants = require("../utils/constants");
const helper = require("../utils/helpers");
const { paginate } = require("../utils/paginate");

const buildQuery = ({ title, id, slug } = {}) => {
  const query = {};
  if (title) query.title = title;
  if (id) query._id = id;
  if (slug) query.slug = slug;
  return query;
};

const findContentOrThrow = async (params) => {
  const query = buildQuery(params);
  if (!Object.keys(query).length) throw constants.CONTENT_MANAGEMENT.NOT_FOUND;
  const content = await db.contentManagement.findOne(query);
  if (!content) throw constants.CONTENT_MANAGEMENT.NOT_FOUND;
  return content;
};

exports.listing = async (data) => {
  const { search, page = 1, count = 10, sortBy, title, status } = data;
  const match = { isDeleted: false };

  if (title) match.title = title;
  if (status) match.status = status;

  const sortOption = helper.parseSortParam(sortBy);

  const result = await paginate(db.contentManagement, {
    page: Number(page),
    limit: Number(count),
    match,
    sort: sortOption,
    project: {
      id: "$_id",
      title: 1,
      image: 1,
      slug: 1,
      description: 1,
      meta_title: 1,
      meta_description: 1,
      meta_key: 1,
      keywords: 1,
      type: 1,
      status: 1,
      updatedBy: 1,
      createdAt: 1,
      updatedAt: 1,
      isDeleted: 1,
      addedBy: 1,
    },
    search: search || undefined,
    searchFields: [
      "title",
      "keywords",
      "meta_title",
      "meta_key",
      "meta_description",
    ],
  });

  return {
    data: result.data,
    total: result.pagination.total,
  };
};

exports.addContent = async (data) => {
  if (!data.title || !data.title.trim()) throw "Title is required";

  data.title = data.title.toLowerCase().trim();
  data.slug = await helper.generateSlug(data.title);

  const existingData = await db.contentManagement.findOne({
    slug: data.slug,
    isDeleted: false,
  });
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

  const created = await db.contentManagement.create(data);
  return created;
};

exports.editContent = async (data) => {
  const { id } = data;
  if (!id) throw "id is required";

  if (data.title) data.type = data.title.toLowerCase();

  await findContentOrThrow({ id });
  await db.contentManagement.updateOne({ _id: id }, data);
};

exports.getContent = async ({ title, id, slug }) => {
  const content = await db.contentManagement
    .findOne(buildQuery({ title, id, slug }))
    .populate("updatedBy", "fullName email name image")
    .lean();

  if (!content) throw constants.CONTENT_MANAGEMENT.TITLE_MISSING;
  return content;
};

exports.statusUpdate = async ({ status, title, id }) => {
  const existed = await findContentOrThrow({ title, id });
  await db.contentManagement.updateOne({ _id: existed._id }, { $set: { status } });
};
