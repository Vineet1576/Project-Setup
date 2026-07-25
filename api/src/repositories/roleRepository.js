const mongoose = require('mongoose');
const db = require('../models');
const { paginate } = require('../utils/paginate');

const Role = db.roles;

const serialize = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    name: obj.name,
    displayName: obj.displayName,
    description: obj.description,
    permissions: obj.permissions,
    isSystemRole: obj.isSystemRole,
    status: obj.status,
    isDeleted: obj.isDeleted,
    addedBy: obj.addedBy ? obj.addedBy.toString() : null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const serializeList = (docs) => docs.map(serialize).filter(Boolean);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.findById = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Role.findOne({ _id: id, isDeleted: false }).lean();
  return serialize(doc);
};

exports.findByName = async (name, excludeId) => {
  const query = { name, isDeleted: false };
  if (excludeId && isValidObjectId(excludeId)) query._id = { $ne: excludeId };
  const doc = await Role.findOne(query).lean();
  return serialize(doc);
};

exports.create = async (data) => {
  const doc = await Role.create({
    name: data.name,
    displayName: data.displayName,
    description: data.description,
    permissions: data.permissions || [],
    addedBy: data.addedBy,
  });
  return serialize(doc);
};

exports.update = async (id, data) => {
  if (!id || !isValidObjectId(id)) return null;
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.status !== undefined) updateData.status = data.status;

  const doc = await Role.findByIdAndUpdate(id, updateData, { new: true }).lean();
  return serialize(doc);
};

exports.softDelete = async (id) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Role.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
  return serialize(doc);
};

exports.changeStatus = async (id, status) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await Role.findByIdAndUpdate(
    id,
    { status: status || 'active' },
    { new: true },
  ).lean();
  return serialize(doc);
};

exports.findAllActive = async () => {
  const docs = await Role.find({ isDeleted: false, status: 'active' })
    .select('name displayName')
    .sort({ displayName: 1 })
    .lean();
  return serializeList(docs);
};

exports.findAll = async (filters = {}) => {
  const match = { isDeleted: false };

  const result = await paginate(Role, {
    page: filters.page,
    limit: filters.limit,
    match,
    search: filters.search,
    searchFields: ['name', 'displayName', 'description'],
    sort: { createdAt: -1 },
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  return {
    data: serializeList(result.data),
    pagination: result.pagination,
  };
};
