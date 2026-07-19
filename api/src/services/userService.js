const db = require("../models");
const Users = db.users;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const constants = require("../utils/constants");
const Emails = require("../Emails/templates");
const mongoose = require("mongoose");
const helper = require("../utils/helpers");
const { paginate } = require("../utils/paginate");
const notificationService = require("./notificationService");

const signToken = (payload, expiresIn) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || "7d",
  });

const validateAge = (dob) => {
  if (!dob) throw "Date of birth is required";
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) throw "Invalid date of birth format";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()))
    age--;
  if (age < 21) throw "You must be at least 21 years old to register";
};

const processLocation = (latitude, longitude) => {
  if (latitude && longitude) {
    return {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
  }
  return undefined;
};

const findUserByEmail = async (email) => {
  return Users.findOne({
    email: helper.trimAndLowercase(email),
    isDeleted: false,
  });
};

exports.registerUser = async (data) => {
  const { firstName, lastName, email, password, dob, mobileno, latitude, longitude, nearbyAlertsOnly } = data;

  validateAge(dob);

  const normalizedEmail = helper.trimAndLowercase(email);
  data.email = normalizedEmail;
  data.fullName = `${helper.trimAndLowercase(firstName)} ${helper.trimAndLowercase(lastName)}`;
  const newPassword = password || helper.generatePassword();

  const existingUser = await db.users.findOne({ email: normalizedEmail, isDeleted: false });
  if (existingUser) throw "Email already exists";

  data.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
  data.isExpire = false;
  data.currentLocation = processLocation(latitude, longitude) || data.currentLocation;
  data.nearbyAlertsOnly = nearbyAlertsOnly || false;
  data = helper.omit(data, ["latitude", "longitude"]);

  const created = await db.users.create(data);

  notificationService.createNotification({
    userId: created._id,
    type: "system",
    title: "Account created",
    message: "Your account has been created successfully.",
  });

  Emails.userVerifyLink({ email: created.email, fullName: created.fullName, id: created._id, password: newPassword });
  Emails.welcome_user_email({ email: created.email, fullName: created.fullName });

  if (created.companyRole === "member") {
    const adminRole = await db.roles.findOne({ name: "admin", isDeleted: false });
    if (adminRole) {
      const adminUser = await Users.findOne({ role: adminRole._id, isDeleted: false }).sort({ createdAt: 1 });
      if (adminUser) {
        Emails.accountApprovalEmail({
          adminEmail: adminUser.email, companyOwnerName: adminUser.fullName,
          userEmail: created.email, userName: created.fullName,
        });
      }
    }
    notificationService.notifyAdmins({
      type: "system",
      title: "New member registration",
      message: `${created.fullName} (${created.email}) registered and needs approval.`,
      metadata: { userId: created._id },
    });
  } else {
    notificationService.notifyAdmins({
      type: "system",
      title: "New user registration",
      message: `${created.fullName} (${created.email}) has registered.`,
      metadata: { userId: created._id },
    });
  }

  return { message: "User created successfully.", userId: created._id, companyRole: created.companyRole };
};

exports.registerUserApp = async (data) => {
  const { firstName = "", lastName = "", email, deviceTokens, password, role, mobileno, dob, latitude, longitude, nearbyAlertsOnly } = data;

  if (!email) throw "Email is required";
  validateAge(dob);

  const normalizedEmail = helper.trimAndLowercase(email);
  const newPassword = password || helper.generatePassword();

  let fullName = helper.trimAndLowercase(firstName) || normalizedEmail.split("@")[0];
  if (helper.trimAndLowercase(lastName)) fullName += ` ${helper.trimAndLowercase(lastName)}`;

  const existingUser = await db.users.findOne({ email: normalizedEmail, isDeleted: false });

  if (existingUser && existingUser.isVerified === "N") {
    const verificationOtp = helper.generateVerificationCode(4);
    existingUser.verificationOtp = verificationOtp;
    existingUser.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await existingUser.save();
    Emails.verificationOtp({ userId: existingUser._id, email: existingUser.email, fullName: existingUser.fullName, otp: verificationOtp, user: existingUser });
    return { user: existingUser, isExisting: true };
  }

  if (existingUser) throw "Email already exists";

  const payload = {
    email: normalizedEmail,
    firstName, lastName, dob, fullName, mobileno,
    password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10)),
    isExpire: false,
    nearbyAlertsOnly: nearbyAlertsOnly || false,
  };

  if (role) payload.role = mongoose.Types.ObjectId.createFromHexString(role);
  if (deviceTokens) payload.deviceTokens = Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens];

  const location = processLocation(latitude, longitude);
  if (location) {
    payload.currentLocation = location;
    payload.locationUpdatedAt = new Date();
  }

  const verificationOtp = helper.generateVerificationCode(4);
  payload.verificationOtp = verificationOtp;
  payload.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const created = await db.users.create(payload);
  Emails.verificationOtp({ userId: created._id, email: created.email, fullName: created.fullName, otp: verificationOtp, user: created });

  notificationService.createNotification({
    userId: created._id,
    type: "system",
    title: "Account created",
    message: "Your account has been created successfully. Please verify your email.",
  });

  notificationService.notifyAdmins({
    type: "system",
    title: "New app registration",
    message: `${created.fullName} (${created.email}) registered via app.`,
    metadata: { userId: created._id },
  });

  return { id: created._id, firstName: created.firstName, lastName: created.lastName, email: created.email, currentLocation: created.currentLocation || null, nearbyAlertsOnly: created.nearbyAlertsOnly || false, companyRole: created.companyRole || null };
};

exports.adminLogin = async (data) => {
  const { latitude, longitude } = data;
  if (!data.password) throw "password is required";

  const user = await Users.findOne({ email: helper.trimAndLowercase(data.email), isDeleted: false }).populate("role");
  if (!user) throw constants.onBoarding.INVALID_EMAIL;
  if (user.role?.loginPannel === "front" || user.role?.loginPannel === "organization")
    throw "Permission denied: Admin login required.";
  if (user.status === "deactive") throw "Account is not active.";
  if (!bcrypt.compareSync(data.password, user.password)) throw constants.onBoarding.WRONG_PASSWORD;

  const location = processLocation(latitude, longitude);
  if (location) {
    user.currentLocation = location;
    user.locationUpdatedAt = new Date();
  }

  user.lastLoginDate = new Date();
  await user.save();

  const token = signToken({ id: user.id, role: user.role?._id, roleName: user.role?.name || "" });
  const adminData = user.toObject();
  adminData.access_token = token;
  return adminData;
};

exports.userLogin = async (data) => {
  const email = helper.trimAndLowercase(data.email);
  const password = data.password;

  const user = await Users.findOne({ email, isDeleted: false })
    .populate("role", "name")
    .populate("planId", "name plan_type pricing numberOfDays maxDispensaries");

  if (!user) throw new Error(constants.onBoarding.WRONG_CREDENTIALS);

  const role = await db.roles.findById(user.role).populate("addedBy");
  if (!role.addedBy || role.addedBy.name !== "organization")
    throw new Error("Admin staff not allowed to login on user portal");

  if (user.isVerified === "N") throw new Error(constants.onBoarding.USER_NOT_VERIFIED);
  if (user.status === "deactive" || user.status === "inactive") throw new Error(constants.onBoarding.USERNAME_INACTIVE);
  if (user.approvalStatus === "pending") throw new Error("Account is under admin review");
  if (user.approvalStatus === "rejected") throw new Error("Account is rejected by admin");
  if (!bcrypt.compareSync(password, user.password)) throw new Error(constants.onBoarding.WRONG_PASSWORD);

  user.lastLoginDate = new Date();

  if (data.device_token?.trim()) {
    if (!user.deviceTokens.includes(data.device_token)) {
      user.deviceTokens.push(data.device_token);
    }
  }

  user.userlogin = true;
  await user.save();

  const token = signToken(
    { id: user._id, role: user.role?._id, roleName: user.role?.name || "", type: "user", email: user.email, loginType: "user" },
  );

  return { ...helper.omit(user.toObject(), ["password", "verificationCode"]), access_token: token };
};

exports.userLoginApp = async (data) => {
  const email = helper.trimAndLowercase(data.email);
  const password = data.password;
  const deviceToken = data.device_token?.trim() || null;

  if (!email) throw new Error("Email is required");
  if (!password) throw new Error("Password is required");

  const user = await Users.findOne({ email, isDeleted: false }).populate("role");

  if (!user) throw new Error("Email does not exist");
  if (user.role?.name === "Guide" && user.approvalStatus === "pending") throw new Error("Account is under company review");
  if (user.role?.name === "admin") throw new Error("Only app users can login here");
  if (user.status === "deactive") throw new Error("Account is deactivated");
  if (!bcrypt.compareSync(password, user.password)) throw new Error("Incorrect password.");
  if (!data.currentLocation) throw new Error("Current Location is required.");

  if (deviceToken) {
    if (!user.deviceTokens.includes(deviceToken)) user.deviceTokens.push(deviceToken);
    user.islogin = data.islogin;
    user.lastLoginDate = new Date();
    await user.save();
    const token = signToken({ id: user._id, role: user.role._id, roleName: user.role.name || "" });
    return { ...user.toObject(), access_token: token };
  }

  if (user.isVerified === "N") {
    const otp = helper.generateVerificationCode(4);
    user.verificationOtp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await Emails.verificationOtp({ email, otp, userId: user._id, fullName: user.fullName });
    return helper.omit(user.toObject(), ["password"]);
  }

  user.lastLoginDate = new Date();
  await user.save();
  const token = signToken({ id: user._id, role: user.role._id, roleName: user.role.name || "" });
  return { ...user.toObject(), access_token: token };
};

exports.autoLogin = async (data) => {
  const { id } = data;

  const user = await Users.findById(id)
    .select("-password -verificationCode -deviceTokens -isDeleted -preferences")
    .populate("role", "name")
    .lean({ virtuals: true });

  if (!user) throw "Invalid credentials.";
  if (user.status === "deactive") throw constants.onBoarding.USERNAME_INACTIVE;

  await Users.updateOne({ _id: id }, { lastLoginDate: new Date() });

  const token = signToken(
    { id: user._id, role: user.role?._id, roleName: user.role?.name || "", type: "user", email: user.email, loginType: "auto" },
  );

  return { ...user, access_token: token, type: "user", loginType: "user" };
};

exports.userProfile = async (data) => {
  const { id } = data;

  const user_data = await Users.findOne({ _id: id })
    .select("-password -verificationCode -deviceTokens")
    .populate("role", "name")
    .populate("planId", "name plan_type pricing numberOfDays maxDispensaries")
    .populate("Subscription_id", "plan_id stripe_price_id userId status valid_upto")
    .lean();

  if (!user_data) throw constants.onBoarding.USER_NOT_FOUND;

  const roleName = user_data.role?.name || "";
  if (!/^sub-admin$/i.test(roleName)) {
    const locationDetails = helper.getStateAndCountryDetails(user_data.country || "", user_data.state || "");
    user_data.stateName = locationDetails.stateName;
    user_data.countryName = locationDetails.countryName;
  }

  return user_data;
};

exports.updateProfile = async (data) => {
  let { id, ...updateData } = data;

  const isUser = await Users.findById(id);
  if (!isUser) throw new Error("User not found");

  const updatedFirstName = helper.trimAndLowercase(updateData.firstName);
  const updatedLastName = helper.trimAndLowercase(updateData.lastName);

  if (updatedFirstName || updatedLastName) {
    updateData.firstName = updatedFirstName;
    updateData.lastName = updatedLastName;
    updateData.fullName = `${updatedFirstName} ${updatedLastName}`.trim();
  }

  return Users.findByIdAndUpdate(id, helper.omit(updateData, ["id"]), { new: true });
};

exports.getAllUsers = async (data) => {
  const { search, sortBy, page = 1, count = 10, status, role, userId, approvalStatus, category, subCategory } = data;

  const match = { isDeleted: false };

  if (userId) match._id = { $ne: new mongoose.Types.ObjectId(userId) };
  if (category) match.category = { $in: category.split(",").map((id) => new mongoose.Types.ObjectId(id)) };
  if (subCategory) match.subCategory = { $in: subCategory.split(",").map((id) => new mongoose.Types.ObjectId(id)) };
  if (role) match.role = new mongoose.Types.ObjectId(role);
  if (status) match.status = status;
  if (approvalStatus) match.approvalStatus = approvalStatus;

  const result = await paginate(Users, {
    page, limit: count, match,
    sort: helper.parseSortParam(sortBy),
    project: {
      id: "$_id", bio: 1, price: 1, email: 1, city: 1, state: 1,
      dialCode: 1, isApproved: 1, mobileNo: 1, firstName: 1, preferences: 1,
      lastName: 1, companyName: 1, companyEmail: 1, experience: 1, fullName: 1,
      address: 1, image: 1, country: 1, pinCode: 1, status: 1, approvalStatus: 1,
      role: 1, roleName: "$roleDetail.name", createdAt: 1, updatedAt: 1, birthday: 1,
      addedBy: 1,
      addedByName: { $cond: { if: { $ifNull: ["$addedByDetail.fullName", false] }, then: "$addedByDetail.fullName", else: "$addedByDetail.name" } },
      addedByEmail: "$addedByDetail.email", isDeleted: 1, permissions: 1, countryId: 1, stateId: 1,
    },
    lookups: [
      { from: "roles", localField: "role", foreignField: "_id", as: "roleDetail" },
      { from: "users", localField: "addedBy", foreignField: "_id", as: "addedByDetail" },
    ],
    search,
    searchFields: ["fullName", "email", "companyName", "companyEmail"],
    unwindFields: ["$roleDetail", "$addedByDetail"],
  });

  return { data: result.data, total: result.pagination.total };
};

exports.changePassword = async (data) => {
  const { newPassword, currentPassword, id, identity } = data;
  if (!newPassword) throw "New password is required";

  const loggedInId = id || identity._id;
  const user = await Users.findOne({ _id: loggedInId, isDeleted: false });
  if (!user) throw "Account not found";
  if (!currentPassword) throw "Current password is required";
  if (!user.password) throw "Password not set for this account";
  if (!bcrypt.compareSync(currentPassword, user.password)) throw "Current password is incorrect";
  if (bcrypt.compareSync(newPassword, user.password)) throw "New password cannot be same as current password";

  await Users.findByIdAndUpdate(user._id, { password: bcrypt.hashSync(newPassword, 10) }, { new: true });

  Emails.passwordChangedEmail({ email: user.email, fullName: user.fullName, password: newPassword });
};

exports.adminForgotPassword = async (data) => {
  const user = await findUserByEmail(data.email);
  if (!user) return null;

  const verificationCode = helper.generateVerificationCode(6);
  await Users.updateOne({ _id: user.id }, { verificationCode });

  await Emails.forgotPasswordEmail({
    email: user.email, verificationCode, fullName: user.fullName,
    id: user.id, userId: user.id, time: new Date(), role: user.role,
  });
  return user;
};

exports.forgotPasswordUserApp = async (data) => {
  const user = await findUserByEmail(data.email);
  if (!user) return null;

  const verificationCode = helper.generateVerificationCode(6);
  await Users.updateOne({ _id: user.id }, { verificationCode });

  if (data.registerFrom === "app") {
    const verificationCodeApp = helper.generateVerificationCode(4);
    await Users.updateOne({ _id: user.id }, { verificationOtp: verificationCodeApp });
    Emails.verificationOtp({ email: user.email, otp: verificationCodeApp, fullName: user.fullName, id: user.id, userId: user.id });
  } else {
    await Emails.forgotPasswordEmail({
      email: user.email, verificationCode, fullName: user.fullName,
      id: user.id, userId: user.id, time: new Date(), role: user.role,
    });
  }

  return user;
};

exports.forgotPasswordUser = async (data) => {
  if (!data.email) throw constants.onBoarding.PAYLOAD_MISSING;

  const user = await findUserByEmail(data.email);
  if (!user) throw constants.onBoarding.ACCOUNT_NOT_FOUND;

  if (data.registerFrom === "app") {
    const verificationCode = await helper.generateVerificationCode(4);
    await Users.updateOne({ _id: user._id }, { verificationOtp: verificationCode, isExpire: false });
    await Emails.verificationOtp({ email: user.email, otp: verificationCode, fullName: user.fullName, id: user._id, userId: user._id });
    return { id: user._id };
  }

  const verificationCode = await helper.generateVerificationCode(6);
  await Users.updateOne({ _id: user._id }, { verificationCode, isExpire: false });

  await Emails.forgotPasswordEmail({
    email: user.email, verificationCode, firstName: user.fullName,
    id: user._id, userId: user._id, time: new Date(), role: user.role, isExpire: user.isExpire,
  });
};

exports.resetPassword = async (data) => {
  const { email, id, password } = data;
  if (!password) throw constants.onBoarding.PAYLOAD_MISSING;

  const user = await Users.findOne({ $or: [{ email: helper.trimAndLowercase(email) }, { _id: id }] });
  if (!user) throw "User not found";

  const hashedPassword = await bcrypt.hash(password, 10);
  await Users.updateOne({ _id: user._id }, { password: hashedPassword, verificationCode: "", isExpire: true });
};

exports.addUser = async (data) => {
  const date = new Date();
  data.email = helper.trimAndLowercase(data.email);

  if (!data.email || !data.firstName) throw constants.onBoarding.PAYLOAD_MISSING;

  const existing = await Users.findOne({ isDeleted: false, email: data.email });
  if (existing) throw constants.onBoarding.EMAIL_EXIST;

  data.date_registered = date;
  data.createdAt = date;
  data.updatedAt = date;
  data.isVerified = "Y";
  data.isApproved = true;
  data.status = "active";
  data.approvalStatus = "approved";

  const password = helper.generatePassword();
  const temp_pass = data.password ?? password;
  data.password = bcrypt.hashSync(data.password || password, bcrypt.genSaltSync(10));

  if (data.firstName || data.lastName) {
    data.fullName = `${data.firstName} ${data.lastName || ""}`.trim();
  }

  const location = processLocation(data.latitude, data.longitude);
  if (location) {
    data.currentLocation = location;
    data.locationUpdatedAt = new Date();
  }

  data.nearbyAlertsOnly = data.nearbyAlertsOnly === true;
  data = helper.omit(data, ["latitude", "longitude"]);

  const newUser = new Users(data);
  newUser.setPassword = true;
  newUser.isExpire = false;
  const savedUser = await newUser.save();

  const role = await db.roles.findById(savedUser.role);
  await Emails.add_user_email({
    email: savedUser.email, firstName: savedUser.firstName, lastName: savedUser.lastName,
    fullName: savedUser.fullName, password: temp_pass, id: savedUser.id,
    role: role?.name || "", isApproved: savedUser.isApproved,
  });

  return helper.omit(savedUser.toObject(), ["password"]);
};

exports.changeApprovalStatus = async (data) => {
  await Users.updateOne({ _id: data.id }, { approvalStatus: data.approvalStatus });
};

exports.deleteUser = async (data) => {
  const user = await Users.findOne({ _id: data.id });
  if (!user) throw constants.onBoarding.USER_NOT_FOUND;
  await Users.findByIdAndUpdate(data.id, { isDeleted: true }, { new: true });
};

exports.verifyUser = async (data) => {
  const { id } = data;
  const user = await Users.findById(id).populate("role", "name").lean();
  if (!user) throw constants.onBoarding.INVALID_ID;

  if (user.isVerified === "N") await Users.updateOne({ _id: id }, { isVerified: "Y" });

  const isSubAdmin = /^sub-admin$/i.test(user.role?.name || "");
  const baseUrl = isSubAdmin ? process.env.ADMIN_WEB_URL : process.env.FRONT_WEB_URL;
  const path = user.isExpire ? "login" : "autologin";
  const params = user.isExpire ? "isVerified=true" : `isVerified=true&id=${id}`;
  return `${baseUrl}/${path}?${params}`;
};

exports.resendVerificationEmail = async (data) => {
  const { email } = data;
  if (!email) throw "Email required";

  const user = await Users.findOne({ email, isDeleted: false, isVerified: "N" });
  if (!user) throw "User not exist or email already verified";

  await Emails.loginCredentials({
    email: user.email, firstName: user.firstName, lastName: user.lastName,
    fullName: user.fullName, id: user.id, role: user.role, isVerified: user.isVerified,
  });
};

exports.verifyOtp = async (data) => {
  const { otp, email, device_token } = data;
  if (!otp || !email) throw "Payload missing";

  const normalizedEmail = helper.trimAndLowercase(email);
  const user = await Users.findOne({ email: normalizedEmail, isDeleted: false })
    .select("-password -sleepMode -currentLocation -waiver -experience -category -subCategory -emailNotificationsEnabled -smsNotificationsEnabled -isNotificationEnabled -nearbyAlertsOnly -isExpire")
    .populate("role", "name")
    .lean();

  if (!user) throw "Invalid user.";
  if (user.verificationOtp !== otp) throw "Otp is incorrect.";

  await Users.updateOne({ _id: user.id }, { isVerified: "Y", verificationOtp: null });

  if (device_token) {
    await Users.updateOne({ _id: user.id }, { $addToSet: { deviceTokens: device_token } });
  }

  const existingDevice = await db.deviceToken.findOne({ email: normalizedEmail, isDeleted: false });
  if (!existingDevice) {
    await db.deviceToken.create({ email: normalizedEmail, isDeleted: false });
  } else {
    existingDevice.createdAt = new Date();
    await existingDevice.save();
  }

  const token = signToken({ id: user._id, fullName: user.fullName, role: user.role?._id, roleName: user.role?.name || "" });
  const refreshToken = signToken({ id: user._id });

  return { ...user, access_token: token, verificationOtp: null, isVerified: "Y", refresh_token: refreshToken };
};

exports.logout = async (data) => {
  const { identity, fcm_token, device_token } = data;
  const tokenToRemove = device_token || fcm_token;

  const updateObject = {};
  if (tokenToRemove) updateObject.$pull = { deviceTokens: tokenToRemove };
  updateObject.$set = { userlogin: false };

  await Users.updateOne({ _id: identity.id, isDeleted: false }, updateObject);
};
