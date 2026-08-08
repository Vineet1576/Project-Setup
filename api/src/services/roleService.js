const { roleRepo } = require("../repositories");
const helper = require("../utils/helpers");
const constants = require("../utils/constants");

const findRoleOrThrow = async (id) => {
  if (!id) throw new Error(constants.COMMON.ID_REQUIRED);
  const role = await roleRepo.findById(id);
  if (!role) throw new Error(constants.ROLES.NOT_FOUND);
  return role;
};

const checkDuplicateName = async (name, excludeId) => {
  const normalized = helper.trimAndLowercase(name);
  const existing = await roleRepo.findByName(normalized, excludeId);
  if (existing) throw new Error(constants.ROLES.ALREADY_EXIST);
  return normalized;
};

exports.createRole = async (req) => {
  const { name, displayName, description, permissions } = req.body;
  const normalizedName = await checkDuplicateName(name);

  return roleRepo.create({
    name: normalizedName,
    displayName,
    description,
    permissions: permissions || [],
    addedBy: req.identity?._id,
  });
};

exports.roleDetail = async (req) => {
  const { id } = req.decryptedParams || req.query;
  return findRoleOrThrow(id);
};

exports.updateRole = async (req) => {
  const { id, name, displayName, description, permissions } = req.body;
  await findRoleOrThrow(id);

  const updateData = {};
  if (name) updateData.name = await checkDuplicateName(name, id);
  if (displayName) updateData.displayName = displayName;
  if (description !== undefined) updateData.description = description;
  if (permissions) updateData.permissions = permissions;

  return roleRepo.update(id, updateData);
};

exports.getAllRoles = async (req) => {
  const { page, limit, search, startDate, endDate, status } =
    req.decryptedParams || req.query;

  return roleRepo.findAll({ page, limit, search, startDate, endDate, status });
};

exports.changeStatus = async (req) => {
  const { id, status } = req.body;
  const role = await findRoleOrThrow(id);

  if (role.isSystemRole && status === "inactive") {
    throw new Error(constants.ROLES.CANNOT_DEACTIVATE_SYSTEM);
  }

  return roleRepo.changeStatus(id, status || "active");
};

exports.deleteRole = async (req) => {
  const { id } = req.body;
  const role = await findRoleOrThrow(id);

  if (role.isSystemRole) {
    throw new Error(constants.ROLES.CANNOT_DELETE_SYSTEM);
  }

  return roleRepo.softDelete(id);
};

exports.frontendRolesList = async () => {
  return roleRepo.findAllActive();
};
