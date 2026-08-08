const mongoose = require("mongoose");
const { categoryRepo } = require("../repositories");
const helper = require("../utils/helpers");

const requireId = (id) => {
  if (!id) throw "Category ID is required";
};

const findCategoryOrThrow = async (id) => {
  requireId(id);
  const category = await categoryRepo.findById(id);
  if (!category) throw "Category not found";
  return category;
};

exports.createCategory = async (data) => {
  let categories = [];

  if (data.categories && Array.isArray(data.categories)) {
    categories = data.categories;
  } else if (Array.isArray(data)) {
    categories = data;
  } else if (data && typeof data === "object" && data.name) {
    categories = [data];
  }

  const { isParent = false, parentId = null } = data;

  if (!categories.length) throw "Payload missing.";

  const cleanCategories = [];
  for (const c of categories) {
    const name = c.name || (typeof c === "string" ? c : "");
    if (!name || name.toString().trim() === "") continue;

    cleanCategories.push({
      name: name.toString().trim(),
      type: (c.type || "").toString().trim(),
      country: (c.country || "").toString().trim(),
    });
  }

  if (!cleanCategories.length) throw "No valid category names provided.";

  const created = [];
  const duplicates = [];
  const errors = [];

  for (const category of cleanCategories) {
    try {
      const existing = await categoryRepo.findExisting({
        name: category.name,
        type: category.type,
        isParent,
        parentId,
      });

      if (existing) {
        duplicates.push({
          name: category.name,
          type: category.type || "(empty)",
          reason: "Category with same name and type already exists",
        });
        continue;
      }

      const parentRef = isParent
        ? null
        : parentId && helper.isValidId(parentId)
          ? new mongoose.Types.ObjectId(parentId)
          : null;

      const result = await categoryRepo.create({
        name: category.name,
        type: category.type,
        country: category.country,
        isParent,
        parentId: parentRef,
        status: "active",
        isDeleted: false,
      });

      created.push({
        id: result.id,
        name: result.name,
        type: result.type || "(empty)",
        country: result.country,
        isParent: result.isParent,
        parentId: result.parentId,
      });
    } catch (err) {
      errors.push({
        name: category.name,
        type: category.type || "(empty)",
        error: err.message,
      });
    }
  }

  if (created.length === 0 && duplicates.length > 0) {
    throw "Category already exists.";
  }

  return {
    created,
    duplicates,
    errors: errors.length > 0 ? errors : undefined,
    summary: {
      requested: cleanCategories.length,
      created: created.length,
      duplicates: duplicates.length,
      errors: errors.length,
    },
  };
};

exports.categoryDetail = async (data) => {
  return findCategoryOrThrow(data.id);
};

exports.updateCategory = async (data) => {
  const categoryId = data.id;
  if (!categoryId) throw "Category ID missing";

  const dataToUpdate = data["0"] || {};
  if (!dataToUpdate || Object.keys(dataToUpdate).length === 0) {
    throw "No update data provided";
  }

  const updateData = {};

  if (dataToUpdate.name) {
    const nameArr = Array.isArray(dataToUpdate.name)
      ? dataToUpdate.name
      : [dataToUpdate.name];
    updateData.name = nameArr;
    updateData.nameKey = nameArr[0].toLowerCase();
  }

  if (dataToUpdate.type) {
    updateData.type = Array.isArray(dataToUpdate.type)
      ? dataToUpdate.type
      : [dataToUpdate.type];
  }

  if (dataToUpdate.country) {
    const countryArr = Array.isArray(dataToUpdate.country)
      ? dataToUpdate.country
      : [dataToUpdate.country];
    updateData.country = countryArr;
    updateData.countryKey = countryArr.map((c) => c.toLowerCase()).join(",");
  }

  const result = await categoryRepo.updateOne(categoryId, updateData);
  if (result.matchedCount === 0) throw "Category not found.";
  return result;
};

exports.getAllCategory = async (data) => {
  const { search, sortBy, page = 1, count = 10, status, type, isParent, parentId } = data;
  return categoryRepo.findAllWithPagination({ search, sortBy, page, count, status, type, isParent, parentId });
};

exports.getSubCategory = async (data) => {
  const { search, sortBy, page = 1, count = 10, status, type, parentId, category } = data;
  return categoryRepo.findSubCategories({ search, sortBy, page, count, status, type, parentId, category });
};

exports.changeStatus = async (data) => {
  const { id, status } = data;
  requireId(id);
  if (!status) throw "Status is required";

  const category = await findCategoryOrThrow(id);

  if (status === "inactive") {
    const keycheck = category.isParent === true ? "subcategory" : "category";
    const linkedActivity = await categoryRepo.findLinkedActivity(id);
    if (linkedActivity) {
      throw `Can't deactivate: this ${keycheck} is still in use.`;
    }
  }

  await categoryRepo.changeStatus(id, status);
};

exports.deleteCategory = async (data) => {
  const { id } = data;
  requireId(id);

  const deletecheck = await categoryRepo.softDelete(id);
  if (deletecheck.modifiedCount === 0) {
    throw "Category not found or already deleted";
  }
};
