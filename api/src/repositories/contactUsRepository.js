const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const ContactUs = db.contactUs;
const fields = [
  'title',
  'description',
  'firstName',
  'lastName',
  'fullName',
  'email',
  'mobileNo',
  'image',
  'address',
  'message',
  'status',
  'addedBy',
  'isDeleted',
];

const serializeContact = (doc) => serialize(doc, fields);

exports.findById = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await ContactUs.findById(id).lean();
  return serializeContact(doc);
};

exports.create = async (data) => {
  const doc = await ContactUs.create(data);
  return serializeContact(doc);
};

exports.findOneAndUpdate = async (id, data) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await ContactUs.findOneAndUpdate({ _id: id }, data, { new: true, lean: true });
  return serializeContact(doc);
};

exports.softDelete = async (id) => {
  if (!id || !isValidObjectId(id)) return { modifiedCount: 0 };
  return ContactUs.updateOne({ _id: id, isDeleted: false }, { isDeleted: true });
};

exports.findAllWithPagination = async (filters) => {
  const { search, page, count, sortBy, status } = filters;
  const match = { isDeleted: false };
  if (status) match.status = status;

  const result = await paginateWrapper(
    ContactUs,
    { page: Number(page), limit: Number(count), search: search || undefined, match },
    {
      sort: helper.parseSortParam(sortBy),
      searchFields: ['fullName', 'email'],
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
    },
  );

  return { data: result.data, total: result.pagination.total };
};
