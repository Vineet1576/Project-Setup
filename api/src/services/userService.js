const { userRepo, roleRepo } = require("../repositories");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const constants = require("../utils/constants");
const Emails = require("../Emails/templates");
const mongoose = require("mongoose");
const helper = require("../utils/helpers");
const notificationService = require("./notificationService");

const db = require("../models");

const signToken = (payload, expiresIn) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || "7d",
  });

const USER_LOGIN_PRESERVE = ["role", "planId", "subscriptionId"];

const validateAge = (dob) => {
  if (!dob) return;
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

exports.registerUser = async (data) => {
  const { firstName, lastName, email, password, dob, mobileno, latitude, longitude, nearbyAlertsOnly } = data;

  validateAge(dob);

  const normalizedEmail = helper.trimAndLowercase(email);
  data.email = normalizedEmail;
  data.fullName = `${helper.trimAndLowercase(firstName)} ${helper.trimAndLowercase(lastName)}`;
  const newPassword = password || helper.generatePassword();

  const existingUser = await userRepo.findByEmail(normalizedEmail);
  if (existingUser) throw "Email already exists";

  data.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
  data.isExpire = false;
  data.currentLocation = processLocation(latitude, longitude) || data.currentLocation;
  data.nearbyAlertsOnly = nearbyAlertsOnly || false;
  data = helper.omit(data, ["latitude", "longitude"]);

  const created = await userRepo.create(data);

  notificationService.createNotification({
    userId: created.id,
    type: "system",
    title: "Account created",
    message: "Your account has been created successfully.",
  });

  Emails.userVerifyLink({ email: created.email, fullName: created.fullName, id: created.id, password: newPassword });
  Emails.welcome_user_email({ email: created.email, fullName: created.fullName });

  if (created.companyRole === "member") {
    const adminRole = await roleRepo.findByName("admin");
    if (adminRole) {
      const adminUser = await userRepo.findOne({ role: adminRole.id, isDeleted: false }, { sort: { createdAt: 1 } });
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
      metadata: { userId: created.id },
    });
  } else {
    notificationService.notifyAdmins({
      type: "system",
      title: "New user registration",
      message: `${created.fullName} (${created.email}) has registered.`,
      metadata: { userId: created.id },
    });
  }

  return { message: "User created successfully.", userId: created.id, companyRole: created.companyRole };
};

exports.registerUserApp = async (data) => {
  const { firstName = "", lastName = "", email, deviceTokens, password, role, mobileno, dob, latitude, longitude, nearbyAlertsOnly } = data;

  if (!email) throw "Email is required";
  validateAge(dob);

  const normalizedEmail = helper.trimAndLowercase(email);
  const newPassword = password || helper.generatePassword();

  let fullName = helper.trimAndLowercase(firstName) || normalizedEmail.split("@")[0];
  if (helper.trimAndLowercase(lastName)) fullName += ` ${helper.trimAndLowercase(lastName)}`;

  const existingUser = await userRepo.findByEmail(normalizedEmail);

  if (existingUser && existingUser.isVerified === "N") {
    const verificationOtp = helper.generateVerificationCode(4);
    await userRepo.updateById(existingUser.id, {
      verificationOtp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    Emails.verificationOtp({
      userId: existingUser.id, email: existingUser.email, fullName: existingUser.fullName,
      otp: verificationOtp, user: existingUser,
    });
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

  const created = await userRepo.create(payload);
  Emails.verificationOtp({ userId: created.id, email: created.email, fullName: created.fullName, otp: verificationOtp, user: created });

  notificationService.createNotification({
    userId: created.id,
    type: "system",
    title: "Account created",
    message: "Your account has been created successfully. Please verify your email.",
  });

  notificationService.notifyAdmins({
    type: "system",
    title: "New app registration",
    message: `${created.fullName} (${created.email}) registered via app.`,
    metadata: { userId: created.id },
  });

  return {
    id: created.id, firstName: created.firstName, lastName: created.lastName,
    email: created.email, currentLocation: created.currentLocation || null,
    nearbyAlertsOnly: created.nearbyAlertsOnly || false, companyRole: created.companyRole || null,
  };
};

exports.adminLogin = async (data) => {
  const { latitude, longitude } = data;
  if (!data.password) throw "password is required";

  const user = await userRepo.findByEmail(data.email);
  if (!user) throw constants.onBoarding.INVALID_EMAIL;
  if (user.role?.loginPannel === "front" || user.role?.loginPannel === "organization")
    throw "Permission denied: Admin login required.";
  if (user.status === "deactive") throw "Account is not active.";
  if (!bcrypt.compareSync(data.password, user.password)) throw constants.onBoarding.WRONG_PASSWORD;

  const location = processLocation(latitude, longitude);
  const updateData = { lastLoginDate: new Date() };
  if (location) {
    updateData.currentLocation = location;
    updateData.locationUpdatedAt = new Date();
  }
  await userRepo.updateById(user.id, updateData);

  const token = signToken({ id: user.id, role: user.role?.id, roleName: user.role?.name || "" });
  return { ...helper.omit(user, ["password", "verificationCode"]), access_token: token };
};

exports.userLogin = async (data) => {
  const email = helper.trimAndLowercase(data.email);
  const password = data.password;

  const user = await userRepo.findByEmail(email, {
    populate: userRepo.USER_LOGIN_POPULATE,
    preserveObjects: USER_LOGIN_PRESERVE,
  });
  if (!user) throw new Error(constants.onBoarding.WRONG_CREDENTIALS);

  const roleName =
    user.role?.name ||
    (await roleRepo.findById(user.role?.id || user.role))?.name;
  if (roleName !== 'user') throw new Error("Admin staff not allowed to login on user portal");

  if (user.isVerified === "N") throw new Error(constants.onBoarding.USER_NOT_VERIFIED);
  if (user.status === "deactive" || user.status === "inactive") throw new Error(constants.onBoarding.USERNAME_INACTIVE);
  if (user.approvalStatus === "pending") throw new Error("Account is under admin review");
  if (user.approvalStatus === "rejected") throw new Error("Account is rejected by admin");
  if (await !bcrypt.compareSync(password, user.password)) throw new Error(constants.onBoarding.WRONG_PASSWORD);

  const updateData = { lastLoginDate: new Date(), userlogin: true };

  if (data.device_token?.trim()) {
    await userRepo.pushDeviceToken(user.id, data.device_token);
  }

  await userRepo.updateById(user.id, updateData);

  const token = signToken({
    id: user.id, role: user.role?.id || user.role, roleName: user.role?.name || "",
    type: "user", email: user.email, loginType: "user",
  });

  return { ...helper.omit(user, ["password", "verificationCode"]), access_token: token };
};

exports.userLoginApp = async (data) => {
  const email = helper.trimAndLowercase(data.email);
  const password = data.password;
  const deviceToken = data.device_token?.trim() || null;

  if (!email) throw new Error("Email is required");
  if (!password) throw new Error("Password is required");

  const user = await userRepo.findByEmail(email, {
    populate: userRepo.USER_LOGIN_POPULATE,
    preserveObjects: USER_LOGIN_PRESERVE,
  });
  if (!user) throw new Error("Email does not exist");
  if (user.role?.name === "Guide" && user.approvalStatus === "pending") throw new Error("Account is under company review");
  if (user.role?.name === "admin") throw new Error("Only app users can login here");
  if (user.status === "deactive") throw new Error("Account is deactivated");
  if (!bcrypt.compareSync(password, user.password)) throw new Error("Incorrect password.");
  if (!data.currentLocation) throw new Error("Current Location is required.");

  if (deviceToken) {
    await userRepo.pushDeviceToken(user.id, deviceToken);
    await userRepo.updateById(user.id, { islogin: data.islogin, lastLoginDate: new Date() });
    const token = signToken({ id: user.id, role: user.role?.id || user.role, roleName: user.role?.name || "" });
    return { ...helper.omit(user, ["password", "verificationCode"]), access_token: token };
  }

  if (user.isVerified === "N") {
    const otp = helper.generateVerificationCode(4);
    await userRepo.updateById(user.id, {
      verificationOtp: otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await Emails.verificationOtp({ email, otp, userId: user.id, fullName: user.fullName });
    return helper.omit(user, ["password", "verificationCode"]);
  }

  await userRepo.updateById(user.id, { lastLoginDate: new Date() });
  const token = signToken({ id: user.id, role: user.role?.id || user.role, roleName: user.role?.name || "" });
  return { ...helper.omit(user, ["password", "verificationCode"]), access_token: token };
};

exports.autoLogin = async (data) => {
  const { id } = data;

  const user = await userRepo.findById(id, {
    select: "-password -verificationCode -deviceTokens -isDeleted -preferences",
    populate: userRepo.USER_LOGIN_POPULATE,
    preserveObjects: USER_LOGIN_PRESERVE,
  });

  if (!user) throw "Invalid credentials.";
  if (user.status === "deactive") throw constants.onBoarding.USERNAME_INACTIVE;

  await userRepo.updateById(id, { lastLoginDate: new Date() });

  const token = signToken({
    id: user.id, role: user.role?.id || user.role, roleName: user.role?.name || "",
    type: "user", email: user.email, loginType: "auto",
  });

  return { ...user, access_token: token, type: "user", loginType: "user" };
};

exports.userProfile = async (data) => {
  const { id } = data;

  const user_data = await userRepo.findById(id, {
    select: "-password -verificationCode -deviceTokens",
    populate: userRepo.USER_LOGIN_POPULATE,
    preserveObjects: USER_LOGIN_PRESERVE,
  });

  if (!user_data) throw constants.onBoarding.USER_NOT_FOUND;

  return user_data;
};

exports.updateProfile = async (data) => {
  let { id, ...updateData } = data;

  const isUser = await userRepo.findById(id);
  if (!isUser) throw new Error("User not found");

  const updatedFirstName = helper.trimAndLowercase(updateData.firstName);
  const updatedLastName = helper.trimAndLowercase(updateData.lastName);

  if (updatedFirstName || updatedLastName) {
    updateData.firstName = updatedFirstName;
    updateData.lastName = updatedLastName;
    updateData.fullName = `${updatedFirstName} ${updatedLastName}`.trim();
  }

  return userRepo.updateById(id, helper.omit(updateData, ["id"]));
};

exports.getAllUsers = async (data) => {
  return userRepo.findAllWithPagination(data);
};

exports.changePassword = async (data) => {
  const { newPassword, currentPassword, id, identity } = data;
  if (!newPassword) throw "New password is required";

  const loggedInId = id || identity._id;
  const user = await userRepo.findById(loggedInId);
  if (!user) throw "Account not found";
  if (!currentPassword) throw "Current password is required";
  if (!user.password) throw "Password not set for this account";
  if (!bcrypt.compareSync(currentPassword, user.password)) throw "Current password is incorrect";
  if (bcrypt.compareSync(newPassword, user.password)) throw "New password cannot be same as current password";

  await userRepo.updatePassword(user.id, bcrypt.hashSync(newPassword, 10));
  Emails.passwordChangedEmail({ email: user.email, fullName: user.fullName, password: newPassword });
};

exports.adminForgotPassword = async (data) => {
  const user = await userRepo.findByEmail(data.email);
  if (!user) return null;

  const verificationCode = helper.generateVerificationCode(6);
  await userRepo.updateById(user.id, { verificationCode });

  await Emails.forgotPasswordEmail({
    email: user.email, verificationCode, fullName: user.fullName,
    id: user.id, userId: user.id, time: new Date(), role: user.role,
  });
  return user;
};

exports.forgotPasswordUserApp = async (data) => {
  const user = await userRepo.findByEmail(data.email);
  if (!user) return null;

  const verificationCode = helper.generateVerificationCode(6);
  await userRepo.updateById(user.id, { verificationCode });

  if (data.registerFrom === "app") {
    const verificationCodeApp = helper.generateVerificationCode(4);
    await userRepo.updateById(user.id, { verificationOtp: verificationCodeApp });
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

  const user = await userRepo.findByEmail(data.email);
  if (!user) throw constants.onBoarding.ACCOUNT_NOT_FOUND;

  if (data.registerFrom === "app") {
    const verificationCode = await helper.generateVerificationCode(4);
    await userRepo.updateById(user.id, { verificationOtp: verificationCode, isExpire: false });
    await Emails.verificationOtp({ email: user.email, otp: verificationCode, fullName: user.fullName, id: user.id, userId: user.id });
    return { id: user.id };
  }

  const verificationCode = await helper.generateVerificationCode(6);
  await userRepo.updateById(user.id, { verificationCode, isExpire: false });

  await Emails.forgotPasswordEmail({
    email: user.email, verificationCode, firstName: user.fullName,
    id: user.id, userId: user.id, time: new Date(), role: user.role, isExpire: user.isExpire,
  });
};

exports.resetPassword = async (data) => {
  const { email, id, password } = data;
  if (!password) throw constants.onBoarding.PAYLOAD_MISSING;

  const user = email
    ? await userRepo.findByEmail(email)
    : await userRepo.findById(id);
  if (!user) throw "User not found";

  const hashedPassword = await bcrypt.hash(password, 10);
  await userRepo.updateById(user.id, { password: hashedPassword, verificationCode: "", isExpire: true });
};

exports.addUser = async (data) => {
  const date = new Date();
  data.email = helper.trimAndLowercase(data.email);

  if (!data.email || !data.firstName) throw constants.onBoarding.PAYLOAD_MISSING;

  const existing = await userRepo.findByEmail(data.email);
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

  data.setPassword = true;
  data.isExpire = false;

  const savedUser = await userRepo.create(data);

  const role = await roleRepo.findById(savedUser.role);
  await Emails.add_user_email({
    email: savedUser.email, firstName: savedUser.firstName, lastName: savedUser.lastName,
    fullName: savedUser.fullName, password: temp_pass, id: savedUser.id,
    role: role?.name || "", isApproved: savedUser.isApproved,
  });

  return helper.omit(savedUser, ["password"]);
};

exports.changeApprovalStatus = async (data) => {
  await userRepo.updateById(data.id, { approvalStatus: data.approvalStatus });
};

exports.changeStatus = async (data) => {
  const { id, status } = data;
  if (!id) throw "User ID is required";
  if (!status) throw "Status is required";
  const user = await userRepo.findById(id);
  if (!user) throw constants.onBoarding.USER_NOT_FOUND;
  await userRepo.updateById(id, { status });
};

exports.deleteUser = async (data) => {
  const user = await userRepo.findById(data.id);
  if (!user) throw constants.onBoarding.USER_NOT_FOUND;
  await userRepo.softDelete(data.id);
};

exports.verifyUser = async (data) => {
  const { id } = data;
  const user = await userRepo.findById(id, { populate: { path: "role", select: "name" } });
  if (!user) throw constants.onBoarding.INVALID_ID;

  if (user.isVerified === "N") await userRepo.updateById(id, { isVerified: "Y" });

  const isSubAdmin = /^sub-admin$/i.test(user.role?.name || "");
  const baseUrl = isSubAdmin ? process.env.ADMIN_WEB_URL : process.env.FRONT_WEB_URL;
  const path = user.isExpire ? "login" : "autologin";
  const params = user.isExpire ? "isVerified=true" : `isVerified=true&id=${id}`;
  return `${baseUrl}/${path}?${params}`;
};

exports.resendVerificationEmail = async (data) => {
  const { email } = data;
  if (!email) throw "Email required";

  const user = await userRepo.findOne({ email, isDeleted: false, isVerified: "N" });
  if (!user) throw "User not exist or email already verified";

  const otp = helper.generateVerificationCode(4);
  await userRepo.updateById(user.id, {
    verificationOtp: otp,
    otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  await Emails.verificationOtp({
    email: user.email,
    otp,
    userId: user.id,
    id: user.id,
    fullName: user.fullName,
  });
};

exports.verifyOtp = async (data) => {
  const { otp, email, device_token } = data;
  if (!otp || !email) throw "Payload missing";

  const normalizedEmail = helper.trimAndLowercase(email);
  const user = await userRepo.findOne(
    { email: normalizedEmail, isDeleted: false },
    {
      select: "-password -sleepMode -currentLocation -waiver -experience -category -subCategory -emailNotificationsEnabled -smsNotificationsEnabled -isNotificationEnabled -nearbyAlertsOnly -isExpire",
      populate: { path: "role", select: "name" },
    },
  );

  if (!user) throw "Invalid user.";
  if (user.verificationOtp !== otp) throw "Otp is incorrect.";

  await userRepo.updateById(user.id, { isVerified: "Y", verificationOtp: null });

  if (device_token) {
    await userRepo.pushDeviceToken(user.id, device_token);
  }

  const existingDevice = await db.deviceToken?.findOne({ email: normalizedEmail, isDeleted: false });
  if (!existingDevice) {
    await db.deviceToken?.create({ email: normalizedEmail, isDeleted: false });
  } else {
    await db.deviceToken?.findOneAndUpdate(
      { _id: existingDevice._id },
      { createdAt: new Date() },
    );
  }

  const token = signToken({
    id: user.id, fullName: user.fullName, role: user.role?.id,
    roleName: user.role?.name || "",
  });
  const refreshToken = signToken({ id: user.id });

  return { ...user, access_token: token, verificationOtp: null, isVerified: "Y", refresh_token: refreshToken };
};

exports.logout = async (data) => {
  const { identity, fcm_token, device_token } = data;
  await userRepo.pullDeviceToken(identity.id, device_token || fcm_token);
};
