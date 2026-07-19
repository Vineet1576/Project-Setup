const db = require("../models");
const mongoose = require("mongoose");
const helper = require("../utils/helpers");
const { paginate } = require("../utils/paginate");

const requireId = (id) => {
  if (!id) throw "Category ID is required";
};

const findCategoryOrThrow = async (id) => {
  requireId(id);
  const category = await db.category.findById(id);
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
      const existingQuery = {
        name: { $regex: new RegExp(`^${category.name}$`, "i") },
        type: { $regex: new RegExp(`^${category.type}$`, "i") },
        isDeleted: false,
        isParent,
      };

      if (isParent) {
        existingQuery.parentId = null;
      } else if (parentId && helper.isValidId(parentId)) {
        existingQuery.parentId = new mongoose.Types.ObjectId(parentId);
      } else {
        existingQuery.parentId = null;
      }

      const existing = await db.category.findOne(existingQuery);

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

      const categoryData = {
        name: category.name,
        type: category.type,
        country: category.country,
        isParent,
        parentId: parentRef,
        status: "active",
        isDeleted: false,
      };

      const result = await db.category.create(categoryData);
      created.push({
        id: result._id,
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

  const result = await db.category.updateOne(
    { _id: categoryId },
    { $set: updateData },
  );

  if (result.matchedCount === 0) throw "Category not found.";

  return result;
};

exports.getAllCategory = async (data) => {
  const { search, sortBy, page = 1, count = 10, status, type, isParent, parentId } = data;

  const match = { isDeleted: false };

  if (status) match.status = status === "deactive" ? "inactive" : status;
  if (type) match.type = type;
  if (isParent !== undefined) match.isParent = isParent === "true";
  if (parentId) match.parentId = parentId;

  const result = await paginate(db.category, {
    page: Number(page),
    limit: Number(count),
    match,
    sort: helper.parseSortParam(sortBy),
    project: { name: 1, nameKey: 1, isParent: 1, parentId: 1, type: 1, country: 1, image: 1, countryKey: 1, status: 1, createdAt: 1, updatedAt: 1 },
    search: search && search.trim() !== "" ? search.trim() : undefined,
    searchFields: ["name", "type", "country"],
  });

  return {
    data: result.data.map((cat) => ({ ...cat, id: cat._id })),
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
  };
};

exports.getSubCategory = async (data) => {
  const { search, sortBy, page = 1, count = 10, status, type, parentId, category } = data;

  const match = { isDeleted: false, isParent: true };

  if (search) {
    match.$or = [{ nameKey: { $regex: search.toLowerCase(), $options: "i" } }];
  }

  if (type) match.type = type;
  if (status) match.status = status;

  if (parentId) {
    const ids = parentId.split(",");
    match.parentId = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  if (category) {
    match.parentId = new mongoose.Types.ObjectId(category);
  }

  const result = await paginate(db.category, {
    page: Number(page),
    limit: Number(count),
    match,
    sort: helper.parseSortParam(sortBy),
    lookups: [
      {
        from: "categories",
        localField: "parentId",
        foreignField: "_id",
        as: "parentData",
      },
    ],
    unwindFields: ["$parentData"],
    project: {
      id: "$_id", name: 1, nameKey: 1, isParent: 1,
      parentId: 1, parentData: 1, image: 1,
      type: 1, country: 1, countryKey: 1,
      status: 1, createdAt: 1, updatedAt: 1,
      isDeleted: 1,
    },
  });

  return {
    data: result.data,
    total: result.pagination.total,
  };
};

exports.changeStatus = async (data) => {
  const { id, status } = data;
  requireId(id);
  if (!status) throw "Status is required";

  const category = await findCategoryOrThrow(id);

  if (status === "deactive") {
    const keycheck = category.isParent === true ? "subcategory" : "category";
    const linkedActivity = await db.activity.findOne({
      category: id,
      status: "active",
    });
    if (linkedActivity) {
      throw `Can't deactivate: this ${keycheck} is still in use.`;
    }
  }

  await db.category.updateOne({ _id: id }, { status });
};

exports.deleteCategory = async (data) => {
  const { id } = data;
  requireId(id);

  const deletecheck = await db.category.updateOne(
    { _id: id, isDeleted: false },
    { isDeleted: true },
  );

  if (deletecheck.modifiedCount === 0) {
    throw "Category not found or already deleted";
  }
};
