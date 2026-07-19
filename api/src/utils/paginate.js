const mongoose = require("mongoose");

exports.paginate = async (
  Model,
  {
    page = 1,
    limit = 10,
    match = {},
    sort = { createdAt: -1 },
    project = {},
    lookups = [],
    search,
    searchFields = [],
    startDate,
    endDate,
    dateField = "createdAt",
    unwindFields = [],
  },
) => {
  const currentPage = Math.max(Number(page), 1);
  const docLimit = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (currentPage - 1) * docLimit;

  if (startDate || endDate) {
    match[dateField] = {};
    if (startDate) match[dateField].$gte = new Date(startDate);
    if (endDate) match[dateField].$lte = new Date(endDate);
  }

  if (search && searchFields.length) {
    match.$or = searchFields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    }));
  }

  const pipeline = [{ $match: match }];

  for (const lookup of lookups) {
    pipeline.push({ $lookup: lookup });
  }

  for (const unwindField of unwindFields) {
    pipeline.push({
      $unwind: { path: unwindField, preserveNullAndEmptyArrays: true },
    });
  }

  if (Object.keys(project).length) {
    pipeline.push({ $project: project });
  }

  pipeline.push({ $sort: sort });
  pipeline.push({
    $facet: {
      data: [{ $skip: skip }, { $limit: docLimit }],
      totalCount: [{ $count: "count" }],
    },
  });

  const [result] = await Model.aggregate(pipeline);
  const total = result.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(total / docLimit);

  return {
    data: result.data,
    pagination: {
      page: currentPage,
      limit: docLimit,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
    },
  };
};
