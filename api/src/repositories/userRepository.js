const mongoose = require('mongoose');
const db = require('../models');
const helper = require('../utils/helpers');
const { serialize, serializeList, paginateWrapper, isValidObjectId } = require('./repositoryUtils');

const User = db.users;
const fields = [
  'firstName',
  'lastName',
  'fullName',
  'email',
  'password',
  'dialCode',
  'mobileno',
  'image',
  'address',
  'city',
  'state',
  'country',
  'pinCode',
  'dob',
  'gender',
  'isVerified',
  'verificationCode',
  'verificationCodeExpiresAt',
  'role',
  'status',
  'isDeleted',
  'approvalStatus',
  'isExpire',
  'lastLoginDate',
  'firstJoinDate',
  'addedBy',
  'deactivatedAt',
  'currentLocation',
  'planId',
  'subscriptionId',
  'companyRole',
  'deviceTokens',
  'verificationOtp',
  'otpExpiresAt',
  'userlogin',
  'islogin',
  'nearbyAlertsOnly',
];

const serializeUser = (doc, options = {}) => serialize(doc, fields, options);

exports.USER_LOGIN_POPULATE = [
  { path: 'role', select: 'name' },
  {
    path: 'planId',
    select: 'name plan_type pricing numberOfDays maxDispensaries',
  },
  {
    path: 'subscriptionId',
    select: 'plan_id stripe_price_id userId status valid_upto interval',
  },
];

exports.findById = async (id, options = {}) => {
  if (!id || !isValidObjectId(id)) return null;
  let query = User.findOne({ _id: id, isDeleted: false });
  if (options.select) query = query.select(options.select);
  if (options.populate) query = query.populate(options.populate);
  const doc = await query.lean();
  return serializeUser(doc, { preserveObjects: options.preserveObjects });
};

exports.findByEmail = async (email, options = {}) => {
  if (!email) return null;
  let query = User.findOne({ email: helper.trimAndLowercase(email), isDeleted: false })
    .select('+password');
  if (options.populate) query = query.populate(options.populate);
  else query = query.populate('role');
  const doc = await query.lean();
  return serializeUser(doc, { preserveObjects: options.preserveObjects });
};

exports.findByEmailRaw = async (email) => {
  if (!email) return null;
  return User.findOne({ email: helper.trimAndLowercase(email), isDeleted: false });
};

exports.create = async (data) => {
  const doc = await User.create(data);
  return serializeUser(doc);
};

exports.updateById = async (id, data, options = {}) => {
  if (!id || !isValidObjectId(id)) return null;
  const doc = await User.findByIdAndUpdate(id, data, { new: true, ...options }).lean();
  return serializeUser(doc);
};

exports.softDelete = async (id) => {
  return exports.updateById(id, { isDeleted: true });
};

exports.updatePassword = async (id, hashedPassword) => {
  if (!id || !isValidObjectId(id)) return null;
  await User.updateOne({ _id: id }, { password: hashedPassword });
};

exports.updateOne = async (filter, update) => {
  return User.updateOne(filter, update);
};

exports.pushDeviceToken = async (id, token) => {
  await User.updateOne({ _id: id }, { $addToSet: { deviceTokens: token } });
};

exports.pullDeviceToken = async (id, token) => {
  if (!id || !isValidObjectId(id)) return;
  const update = { $set: { userlogin: false } };
  if (token) update.$pull = { deviceTokens: token };
  await User.updateOne({ _id: id, isDeleted: false }, update);
};

exports.findOne = async (filter, options = {}) => {
  let query = User.findOne(filter);
  if (options.select) query = query.select(options.select);
  if (options.populate) query = query.populate(options.populate);
  if (options.sort) query = query.sort(options.sort);
  const doc = await query.lean();
  return serializeUser(doc, { preserveObjects: options.preserveObjects });
};

exports.findAllWithPagination = async (filters) => {
  const {
    search,
    sortBy,
    page,
    count,
    status,
    role,
    userId,
    approvalStatus,
    category,
    subCategory,
    startDate,
    endDate,
  } = filters;

  const match = { isDeleted: false };
  if (userId) match._id = { $ne: userId };
  if (category) {
    match.category = { $in: category.split(',').map((id) => new mongoose.Types.ObjectId(id)) };
  }
  if (subCategory) {
    match.subCategory = {
      $in: subCategory.split(',').map((id) => new mongoose.Types.ObjectId(id)),
    };
  }
  if (role) match.role = new mongoose.Types.ObjectId(role);
  if (status) match.status = status;
  if (approvalStatus) match.approvalStatus = approvalStatus;

  const sortOption = helper.parseSortParam(sortBy);

  const result = await paginateWrapper(
    User,
    { page, limit: count, search, match, startDate, endDate },
    {
      sort: sortOption,
      searchFields: ['fullName', 'email', 'companyName', 'companyEmail'],
      project: {
        id: '$_id',
        bio: 1,
        price: 1,
        email: 1,
        city: 1,
        state: 1,
        dialCode: 1,
        isApproved: 1,
        mobileNo: 1,
        firstName: 1,
        preferences: 1,
        lastName: 1,
        companyName: 1,
        companyEmail: 1,
        experience: 1,
        fullName: 1,
        address: 1,
        image: 1,
        country: 1,
        pinCode: 1,
        status: 1,
        approvalStatus: 1,
        role: 1,
        roleName: '$roleDetail.name',
        createdAt: 1,
        updatedAt: 1,
        birthday: 1,
        addedBy: 1,
        isDeleted: 1,
        permissions: 1,
        countryId: 1,
        stateId: 1,
      },
      lookups: [
        { from: 'roles', localField: 'role', foreignField: '_id', as: 'roleDetail' },
        { from: 'users', localField: 'addedBy', foreignField: '_id', as: 'addedByDetail' },
      ],
      unwindFields: ['$roleDetail', '$addedByDetail'],
    },
  );

  return { data: result.data, total: result.pagination.total };
};

exports.distinctIds = async (filter) => {
  return User.find(filter).distinct('_id');
};
