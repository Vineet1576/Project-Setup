const db = require("../models");
const Roles = db.roles;
const helper = require("../utils/helpers");
const constants = require("../utils/constants");
const { paginate } = require("../utils/paginate");

const findRoleOrThrow = async (id) => {
  if (!id) throw new Error(constants.COMMON.ID_REQUIRED);
  if (!helper.isValidId(id)) throw new Error(constants.COMMON.INVALID_ID);
  const role = await Roles.findOne({ _id: id, isDeleted: false });
  if (!role) throw new Error(constants.ROLES.NOT_FOUND);
  return role;
};

const checkDuplicateName = async (name, excludeId) => {
  const normalized = helper.trimAndLowercase(name);
  const query = { name: normalized, isDeleted: false };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Roles.findOne(query);
  if (existing) throw new Error(constants.ROLES.ALREADY_EXIST);
  return normalized;
};

exports.createRole = async (req) => {
  const { name, displayName, description, permissions } = req.body;
  const normalizedName = await checkDuplicateName(name);

  const role = await Roles.create({
    name: normalizedName,
    displayName,
    description,
    permissions: permissions || [],
    addedBy: req.identity?._id,
  });

  return role;
};

exports.roleDetail = async (req) => {
  const { id } = req.decryptedParams || req.query;
  return findRoleOrThrow(id);
};

exports.updateRole = async (req) => {
  const { id, name, displayName, description, permissions } = req.body;
  const role = await findRoleOrThrow(id);

  if (name) role.name = await checkDuplicateName(name, id);
  if (displayName) role.displayName = displayName;
  if (description !== undefined) role.description = description;
  if (permissions) role.permissions = permissions;

  await role.save();
  return role;
};

exports.getAllRoles = async (req) => {
  const { page, limit, search, startDate, endDate } =
    req.decryptedParams || req.query;

  const match = { isDeleted: false };

  return paginate(Roles, {
    page,
    limit,
    match,
    search,
    searchFields: ["name", "displayName", "description"],
    sort: { createdAt: -1 },
    startDate,
    endDate,
  });
};

exports.changeStatus = async (req) => {
  const { id, status } = req.body;
  const role = await findRoleOrThrow(id);

  if (role.isSystemRole && status === "deactive") {
    throw new Error(constants.ROLES.CANNOT_DEACTIVATE_SYSTEM);
  }

  role.status = status || "active";
  await role.save();
  return role;
};

exports.deleteRole = async (req) => {
  const { id } = req.body;
  const role = await findRoleOrThrow(id);

  if (role.isSystemRole) {
    throw new Error(constants.ROLES.CANNOT_DELETE_SYSTEM);
  }

  role.isDeleted = true;
  await role.save();
  return role;
};

exports.frontendRolesList = async () => {
  const roles = await Roles.find({ isDeleted: false, status: "active" })
    .select("name displayName")
    .sort({ displayName: 1 })
    .lean();

  return roles;
};
