const SmtpController = require("./smtp");
const dotenv = require("dotenv");
const db = require("../models/index");
const fs = require("fs");
const path = require("path");
const Users = db.users;

dotenv.config({ debug: false });

const { BACK_WEB_URL, ADMIN_WEB_URL, FRONT_WEB_URL } = process.env;
const { encryptData } = require("../utils/response");

const baseStyle = {
  body: "font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0;",
  wrapper: "background-color: #f4f6f9; padding: 40px 16px;",
  card: "background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);",
  header: "background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 36px 30px; text-align: center;",
  logo: "max-width: 130px; width: 100%; display: block; margin: 0 auto;",
  content: "padding: 36px 30px;",
  h2: "margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1a1a2e;",
  text: "font-size: 15px; line-height: 26px; color: #555; margin: 8px 0;",
  btn: "display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 600; color: #fff; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); text-decoration: none; border-radius: 8px; margin: 16px 0;",
  footer: "padding: 20px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; background-color: #fafafa;",
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${process.env.PROJECT_NAME}</title>
</head>
<body style="${baseStyle.body}">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="${baseStyle.wrapper}">
    <tr>
      <td align="center">
        <table width="560" border="0" cellspacing="0" cellpadding="0" style="${baseStyle.card}">
          <tr>
            <td style="${baseStyle.header}">
              <img src="${BACK_WEB_URL}/img/logo.png" alt="${process.env.PROJECT_NAME} Logo" style="${baseStyle.logo}" />
            </td>
          </tr>
          ${content}
          <tr>
            <td style="${baseStyle.footer}">
              <p style="margin: 0 0 4px;">&copy; ${new Date().getFullYear()} ${process.env.PROJECT_NAME}. All rights reserved.</p>
              <p style="margin: 0;">If you have questions, contact our support team.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const expiredLinkHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expired - ${process.env.PROJECT_NAME}</title>
</head>
<body style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div style="background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 48px 40px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
    <div style="width: 72px; height: 72px; background: rgba(255,184,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFB800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
    <h1 style="color: #fff; font-size: 26px; margin: 0 0 12px; font-weight: 700;">Link Expired</h1>
    <p style="color: rgba(255,255,255,0.6); font-size: 15px; line-height: 1.6; margin: 0 0 32px;">The link you're trying to access is no longer valid. It may have expired or already been used.</p>
    <a href="${FRONT_WEB_URL}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #FFB800 0%, #FF9500 100%); color: #1a1a2e; font-weight: 700; text-decoration: none; border-radius: 10px; font-size: 15px;">Back to Dashboard</a>
  </div>
</body>
</html>`;

const forgotPasswordEmail = async (options) => {
  try {
    const {
      email,
      verificationCode,
      firstName,
      fullName: fullNameOpt,
      userId,
      isExpire,
    } = options;

    let userData = await db.organization.findById(userId);

    if (!userData) {
      userData = await Users.findById(userId).populate("role").select("role");
    }

    if (!userData) {
      console.error(
        `User with ID ${userId} not found in Venue or Users collection.`,
      );
      return;
    }

    let redirectUrl =
      process.env.FRONT_WEB_URL || "https://frontend.example.com";
    if (userData.role && userData.role.name) {
      if (["Admin", "staff"].includes(userData.role.name)) {
        redirectUrl = process.env.ADMIN_WEB_URL || "https://admin.example.com";
      }
    }

    let fullName = firstName || fullNameOpt || email;
    fullName = fullName
      .split(" ")
      .map((str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase())
      .join(" ");

    const encryptedData = await encryptData({
      userId,
      code: verificationCode,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      isExpire,
    });

    const message = baseTemplate(`
      <tr>
        <td style="${baseStyle.content}">
          <h2 style="${baseStyle.h2}">Reset Your Password</h2>
          <p style="${baseStyle.text}">Hi ${fullName},</p>
          <p style="${baseStyle.text}">We received a request to reset the password for your <strong>${process.env.PROJECT_NAME}</strong> account. Click the button below to set a new one.</p>
          <p style="${baseStyle.text}">This link will expire in <strong>24 hours</strong>.</p>
          <div style="text-align: center;">
            <a href="${BACK_WEB_URL}/users/ckeck?data=${encryptedData}" style="${baseStyle.btn}">Reset Password</a>
          </div>
          <p style="${baseStyle.text}; font-size: 13px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
        </td>
      </tr>
    `);

    await SmtpController.sendEmail(email, "Reset Your Password", message);
  } catch (err) {
    console.error("Error sending forgot password email:", err.message);
    throw err;
  }
};

const add_user_email = async (options) => {
  const {
    email,
    fullName: fullNameOpt,
    role: roleName = "Venue Owner",
    password,
    id: userId,
    valid_upto,
    plan,
  } = options;

  const fullName = fullNameOpt || email;

  const expiryDateFormatted = valid_upto
    ? new Date(valid_upto).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const verificationCode = Math.random().toString(36).substring(2, 12);
  await db.users.findByIdAndUpdate(userId, {
    loginVerificationCode: verificationCode,
    loginExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  const redirectUrl = ["staff", "Admin"].includes(roleName)
    ? process.env.ADMIN_WEB_URL
    : process.env.FRONT_WEB_URL;
  const featuresList =
    plan?.features
      ?.map((f) => `<li style="margin-bottom: 8px; color: #fff;">${f.name}</li>`)
      .join("") || "<li style='color: #fff;'>Standard features included</li>";

  const message = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${process.env.PROJECT_NAME}</title>
</head>
<body style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 36px 30px; text-align: center;">
              <img src="${process.env.BACK_WEB_URL}/img/logo.png" alt="${process.env.PROJECT_NAME} Logo" style="max-width: 130px; width: 100%; display: block; margin: 0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 30px;">
              <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #1a1a2e; text-align: center;">Welcome to ${process.env.PROJECT_NAME}!</h2>
              <p style="font-size: 16px; color: #1a1a2e; font-weight: 500; text-align: center; margin: 12px 0 20px;">Hi ${fullName},</p>
              <p style="font-size: 15px; line-height: 26px; color: #555; text-align: center; margin: 8px 0 24px;">
                Your <strong>${roleName}</strong> account has been created. Below are your login credentials.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fc; border-radius: 10px; padding: 20px; margin: 0 0 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="font-size: 14px; color: #888; margin: 0 0 8px;">Email Address</p>
                    <p style="font-size: 16px; color: #1a1a2e; font-weight: 600; margin: 0 0 16px;">${email}</p>
                    <div style="width: 40px; height: 1px; background: #e0e0e0; margin: 0 auto 16px;"></div>
                    <p style="font-size: 14px; color: #888; margin: 0 0 8px;">Password</p>
                    <p style="font-size: 16px; color: #1a1a2e; font-weight: 600; margin: 0;">${password}</p>
                  </td>
                </tr>
              </table>
              ${
                expiryDateFormatted
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 10px; padding: 20px; margin: 0 0 20px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Free Plan Activated</p>
                    <p style="font-size: 18px; color: #fff; font-weight: 700; margin: 0 0 2px;">Trial active until</p>
                    <p style="font-size: 14px; color: rgba(255,255,255,0.8); margin: 0;">${expiryDateFormatted}</p>
                  </td>
                </tr>
              </table>
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px; text-align: center;">Included Features</p>
              <ul style="margin: 0 0 24px; padding: 0 0 0 20px; font-size: 14px; line-height: 22px; color: #555;">
                ${featuresList}
              </ul>
              `
                  : ""
              }
              <div style="text-align: center;">
                <a href="${redirectUrl}/login" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 600; color: #fff; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); text-decoration: none; border-radius: 8px;">Go to Login</a>
              </div>
              <p style="font-size: 13px; color: #999; text-align: center; margin: 16px 0 0;">For security, please change your password after your first login.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; background-color: #fafafa;">
              <p style="margin: 0 0 4px;">&copy; ${new Date().getFullYear()} ${process.env.PROJECT_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await SmtpController.sendEmail(
    email,
    `Your ${process.env.PROJECT_NAME} Account Details`,
    message,
  );
};

const userVerifyLink = async (options) => {
  const {
    email,
    fullName: fullNameOpt = "User",
    id: userId,
    password = "",
  } = options;
  const fullName = fullNameOpt;

  const verificationCode = Math.random().toString(36).substring(2, 12);
  await db.organization.findByIdAndUpdate(userId, {
    emailVerificationCode: verificationCode,
    emailVerificationExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  const encryptedData = await encryptData({
    id: userId,
    code: verificationCode,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  const message = baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <h2 style="${baseStyle.h2}">Verify Your Email</h2>
        <p style="${baseStyle.text}">Hi ${fullName},</p>
        <p style="${baseStyle.text}">Thanks for signing up! Please verify your email address by clicking the button below to activate your account.</p>
        <div style="text-align: center;">
          <a href="${BACK_WEB_URL}/user/verify?data=${encryptedData}" style="${baseStyle.btn}">Verify Email Address</a>
        </div>
        <p style="${baseStyle.text}; font-size: 13px; color: #999;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </td>
    </tr>
  `);

  const subject = password
    ? `Your ${process.env.PROJECT_NAME} Account Details & Verification`
    : `Verify Your Email - ${process.env.PROJECT_NAME}`;

  await SmtpController.sendEmail(email, subject, message);
};

const verificationOtp = async (options = {}) => {
  const email = options.email;
  if (!email) return;
  const fullName = options.firstName || options.fullName || email.split("@")[0];
  await encryptData({ id: options.id });
  const otp = options.otp || "******";

  const message = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Verification - ${process.env.PROJECT_NAME}</title>
</head>
<body style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 36px 30px; text-align: center;">
              <img src="${BACK_WEB_URL}/static/App_logo.png" alt="${process.env.PROJECT_NAME}" style="max-width: 120px; filter: brightness(0) invert(1); display: block; margin: 0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 30px; text-align: center;">
              <h2 style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #1a1a2e;">Verify Your Account</h2>
              <p style="font-size: 15px; color: #555; margin: 16px 0 8px;">Hi ${fullName},</p>
              <p style="font-size: 14px; color: #888; margin: 0 0 24px; line-height: 1.5;">Use the verification code below to complete your account setup.</p>
              <div style="background: #f8f9fc; border-radius: 12px; padding: 24px; border: 2px dashed #e0e0e0; display: inline-block;">
                <p style="font-size: 36px; letter-spacing: 8px; font-weight: 800; color: #1a1a2e; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
              </div>
              <p style="font-size: 13px; color: #999; margin-top: 20px;">This code is valid for <strong>10 minutes</strong>. Keep it confidential.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; background-color: #fafafa;">
              <p style="margin: 0;">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  SmtpController.sendEmail(email, "Account Verification OTP", message);
};

const accountApprovalEmail = async (options) => {
  const email = options.adminEmail;
  const companyOwnerName = options.companyOwnerName || "Admin";
  const userEmail = options.userEmail;
  const userName = options.userName;

  const message = baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <h2 style="${baseStyle.h2}">Approval Required</h2>
        <p style="${baseStyle.text}">Hi ${companyOwnerName},</p>
        <p style="${baseStyle.text}">A new user has registered on <strong>${process.env.PROJECT_NAME}</strong> using a company email address and needs your approval.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fc; border-radius: 10px; overflow: hidden; margin: 20px 0;">
          <tr>
            <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #eee; background: #f0f2f5;">Full Name</td>
            <td style="padding: 14px 18px; font-size: 14px; color: #555; border-bottom: 1px solid #eee;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #1a1a2e; background: #f0f2f5;">Email Address</td>
            <td style="padding: 14px 18px; font-size: 14px; color: #555;">${userEmail}</td>
          </tr>
        </table>
        <p style="${baseStyle.text}; font-size: 13px; color: #999;">Please log in to the admin panel to review and approve this request.</p>
      </td>
    </tr>
  `);

  SmtpController.sendEmail(
    email,
    `New Registration Pending Approval - ${process.env.PROJECT_NAME}`,
    message,
  );
};

const passwordChangedEmail = (options = {}) => {
  const email = options.email;
  if (!email) return;

  const fullName =
    options.firstName ||
    options.fullName ||
    options.name ||
    email.split("@")[0];

  const isAdminChanged = options.isAdminChanged || false;
  const adminName = options.adminName || "";

  const message = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${process.env.PROJECT_NAME} - Password ${isAdminChanged ? "Updated by Admin" : "Changed"}</title>
</head>
<body style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="560" border="0" cellspacing="0" cellpadding="0" style="background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 36px 30px; text-align: center;">
              <img src="${BACK_WEB_URL}/static/App_logo.png" alt="${process.env.PROJECT_NAME}" style="max-width: 130px; filter: brightness(0) invert(1); display: block; margin: 0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 30px;">
              <h2 style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #1a1a2e; text-align: center;">Hi ${fullName},</h2>
              ${
                isAdminChanged
                  ? `
              <div style="background: #fff5f5; border: 1px solid #ffcaca; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <p style="font-size: 15px; color: #c0392b; margin: 0; font-weight: 600;">Your ${process.env.PROJECT_NAME} password has been updated by an Admin.</p>
                <p style="font-size: 14px; color: #666; margin: 8px 0 0;">Admin: <strong>${adminName}</strong></p>
              </div>
              `
                  : `
              <div style="background: #f0faf0; border: 1px solid #b8e6b8; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <p style="font-size: 15px; color: #27ae60; margin: 0; font-weight: 600;">Your password has been changed successfully.</p>
              </div>
              `
              }
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fc; border-radius: 10px; padding: 18px; margin: 20px 0;">
                <tr>
                  <td style="text-align: center;">
                    <p style="font-size: 13px; color: #888; margin: 0 0 6px;">New Password</p>
                    <p style="font-size: 18px; color: #1a1a2e; font-weight: 700; margin: 0; font-family: 'Courier New', monospace;">${options.password}</p>
                  </td>
                </tr>
              </table>
              ${
                isAdminChanged
                  ? `
              <div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 10px; padding: 16px; margin: 20px 0;">
                <p style="font-size: 14px; color: #e67e22; margin: 0; font-weight: 500;">Please log in and change your password immediately if you did not authorize this change. Contact support if needed.</p>
              </div>
              `
                  : `
              <p style="font-size: 14px; line-height: 22px; color: #888; margin: 16px 0 0; text-align: center;">If you did not make this change, please contact support immediately.</p>
              `
              }
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; background-color: #fafafa;">
              ${isAdminChanged ? "Admin Password Update Notification" : "Security Notification"}<br>No further action required if this was you.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  SmtpController.sendEmail(
    email,
    `${process.env.PROJECT_NAME} - Password ${isAdminChanged ? "Updated by Admin" : "Changed"}`,
    message,
  );
};

const welcome_user_email = async (options) => {
  const { email, fullName: fullNameOpt = "" } = options;
  const fullName = fullNameOpt || email;

  const message = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${process.env.PROJECT_NAME}</title>
</head>
<body style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 36px 30px; text-align: center;">
              <img src="${BACK_WEB_URL}/static/App_logo.png" alt="${process.env.PROJECT_NAME} Logo" style="max-width: 130px; filter: brightness(0) invert(1); display: block; margin: 0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 30px; text-align: center;">
              <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1a1a2e;">Welcome ${fullName}!</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 12px 0 0;">Your account has been successfully created on <strong>${process.env.PROJECT_NAME}</strong>.</p>
              <div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 10px; padding: 16px; margin: 24px 0 0;">
                <p style="font-size: 14px; color: #e67e22; margin: 0; font-weight: 500;">Your account is currently <strong>pending admin approval</strong>. You will receive another email once approved.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; background-color: #fafafa;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${process.env.PROJECT_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const subject = `Welcome to ${process.env.PROJECT_NAME} - Account Pending Approval`;

  await SmtpController.sendEmail(email, subject, message);
};

const contactUsToAdmin = async (options) => {
  const adminEmail = options.adminEmail;
  if (!adminEmail) return;

  const userEmail = options.email || "N/A";
  const userName = options.name || "N/A";
  const messageText = options.message || "No message provided";

  const message = baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <h2 style="${baseStyle.h2}">New Contact Us Submission</h2>
        <p style="${baseStyle.text}">A user has submitted a contact form on <strong>${process.env.PROJECT_NAME}</strong>. Details below:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fc; border-radius: 10px; overflow: hidden; margin: 20px 0;">
          <tr>
            <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #eee; background: #f0f2f5;">Name</td>
            <td style="padding: 14px 18px; font-size: 14px; color: #555; border-bottom: 1px solid #eee;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #eee; background: #f0f2f5;">Email</td>
            <td style="padding: 14px 18px; font-size: 14px; color: #555; border-bottom: 1px solid #eee;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #1a1a2e; background: #f0f2f5;">Message</td>
            <td style="padding: 14px 18px; font-size: 14px; color: #555; line-height: 1.5;">${messageText}</td>
          </tr>
        </table>
      </td>
    </tr>
  `);

  await SmtpController.sendEmail(
    adminEmail,
    `New Contact Us Submission - ${process.env.PROJECT_NAME}`,
    message,
  );
};

const sendContactUsStatusUpdate = async (options) => {
  const { status, email, fullName, message } = options;

  const statusColors = {
    resolved: { bg: "#e8f5e9", border: "#a5d6a7", text: "#2e7d32" },
    "in-progress": { bg: "#fff8e1", border: "#ffe082", text: "#e65100" },
    pending: { bg: "#fce4ec", border: "#ef9a9a", text: "#c62828" },
  };

  const sc = statusColors[status] || statusColors.pending;

  const content = baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <h2 style="${baseStyle.h2}">Contact Us Status Update</h2>
        <p style="${baseStyle.text}">Hi ${fullName},</p>
        <p style="${baseStyle.text}">Your contact request has been updated.</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background: ${sc.bg}; border: 1px solid ${sc.border}; border-radius: 20px; padding: 8px 28px; font-size: 14px; font-weight: 700; color: ${sc.text}; text-transform: uppercase; letter-spacing: 1px;">${status?.toUpperCase() || "PENDING"}</span>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fc; border-radius: 10px; overflow: hidden; margin: 20px 0;">
          <tr>
            <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #eee; background: #f0f2f5;">Name</td>
            <td style="padding: 14px 18px; font-size: 14px; color: #555; border-bottom: 1px solid #eee;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #1a1a2e; border-bottom: 1px solid #eee; background: #f0f2f5;">Email</td>
            <td style="padding: 14px 18px; font-size: 14px; color: #555; border-bottom: 1px solid #eee;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 14px 18px; font-size: 14px; font-weight: 600; color: #1a1a2e; background: #f0f2f5;">Message</td>
            <td style="padding: 14px 18px; font-size: 14px; color: #555; line-height: 1.5; background: #fff;">${message?.replace(/\n/g, "<br>") || "No message provided"}</td>
          </tr>
        </table>
        <p style="${baseStyle.text}; font-size: 13px; color: #999; text-align: center;">Thank you for contacting ${process.env.PROJECT_NAME}. Our team is here to help.</p>
      </td>
    </tr>
  `);

  await SmtpController.sendEmail(
    email,
    `Contact Us Status Update - ${process.env.PROJECT_NAME}`,
    content,
  );
};

module.exports = {
  forgotPasswordEmail,
  add_user_email,
  userVerifyLink,
  verificationOtp,
  accountApprovalEmail,
  passwordChangedEmail,
  welcome_user_email,
  contactUsToAdmin,
  sendContactUsStatusUpdate,
  expiredLinkHtml,
};
