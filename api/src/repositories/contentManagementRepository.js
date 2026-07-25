const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const CMS = db.contentManagement;
const fields = [
  'title',
  'image',
  'slug',
  'description',
  'meta_title',
  'meta_description',
  'meta_key',
  'keywords',
  'videos',
  'type',
  'status',
  'addedBy',
  'updatedBy',
  'isDeleted',
  'heading',
];

const serializeCMS = (doc) => serialize(doc, fields);

exports.findOne = async (query) => {
  const doc = await CMS.findOne(query).populate('updatedBy', 'fullName email name image').lean();
  return serialize(doc, [...fields, 'updatedBy']);
};

exports.findByTitleOrIdOrSlug = async ({ title, id, slug } = {}) => {
  const query = {};
  if (title) query.title = title;
  if (id) query._id = id;
  if (slug) query.slug = slug;
  if (!Object.keys(query).length) return null;
  const doc = await CMS.findOne(query).populate('updatedBy', 'fullName email name image').lean();
  return serialize(doc, [...fields, 'updatedBy']);
};

exports.create = async (data) => {
  const doc = await CMS.create(data);
  return serializeCMS(doc);
};

exports.updateOne = async (id, data) => {
  if (!id || !isValidObjectId(id)) return null;
  await CMS.updateOne({ _id: id }, data);
};

exports.findAllWithPagination = async (filters) => {
  const { search, page, count, sortBy, title, status } = filters;
  const match = { isDeleted: false };
  if (title) match.title = title;
  if (status) match.status = status;

  const result = await paginateWrapper(
    CMS,
    { page: Number(page), limit: Number(count), search: search || undefined, match },
    {
      sort: helper.parseSortParam(sortBy),
      searchFields: ['title', 'keywords', 'meta_title', 'meta_key', 'meta_description'],
      project: {
        id: '$_id',
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
    },
  );

  return { data: result.data, total: result.pagination.total };
};
