const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const serialize = (doc, extraFields = [], options = {}) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const base = {
    id: obj._id ? obj._id.toString() : undefined,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
  const preserveObjects = options.preserveObjects || [];
  for (const key of extraFields) {
    if (obj[key] !== undefined) {
      const val = obj[key];
      if (preserveObjects.includes(key)) {
        if (Array.isArray(val)) {
          base[key] = val.map((item) =>
            item && typeof item === 'object' && item._id
              ? serialize(item, Object.keys(item), options)
              : item,
          );
        } else if (val && typeof val === 'object' && val._id) {
          base[key] = serialize(val, Object.keys(val), options);
        } else {
          base[key] = val;
        }
      } else if (val && typeof val === 'object' && val._id) {
        base[key] = val._id.toString();
      } else if (Array.isArray(val) && val.length > 0 && val[0] && val[0]._id) {
        base[key] = val.map((i) => (i?._id ? i._id.toString() : i));
      } else {
        base[key] = val;
      }
    }
  }
  return base;
};

const serializeList = (docs, extraFields) =>
  docs ? docs.map((d) => serialize(d, extraFields)).filter(Boolean) : [];

const paginateWrapper = async (Model, filters, options = {}) => {
  const { paginate } = require('../utils/paginate');
  const {
    searchFields = [],
    sort = { createdAt: -1 },
    project = {},
    lookups = [],
    unwindFields = [],
    dateField = 'createdAt',
  } = options;

  const result = await paginate(Model, {
    page: filters.page,
    limit: filters.limit,
    match: filters.match || {},
    sort,
    project,
    lookups,
    search: filters.search,
    searchFields,
    startDate: filters.startDate,
    endDate: filters.endDate,
    dateField,
    unwindFields,
  });

  return {
    data: result.data,
    pagination: result.pagination,
  };
};

const findById =
  (Model) =>
  async (id, options = {}) => {
    if (!id || !isValidObjectId(id)) return null;
    const query = Model.findOne({
      _id: id,
      ...(options.isDeleted !== undefined
        ? { isDeleted: options.isDeleted }
        : { isDeleted: false }),
    });
    if (options.select) query.select(options.select);
    if (options.populate) query.populate(options.populate);
    const doc = await query.lean();
    return serialize(doc, options.fields);
  };

const updateById =
  (Model) =>
  async (id, data, options = {}) => {
    if (!id || !isValidObjectId(id)) return null;
    const doc = await Model.findByIdAndUpdate(id, data, { new: true, ...options }).lean();
    return serialize(doc, options.fields);
  };

const softDeleteById = (Model) => async (id) => {
  return updateById(Model)(id, { isDeleted: true });
};

module.exports = {
  isValidObjectId,
  serialize,
  serializeList,
  paginateWrapper,
  findById,
  updateById,
  softDeleteById,
};
