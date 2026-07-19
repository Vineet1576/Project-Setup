const SmtpController = require("../Emails/smtp");
const { baseTemplate, baseStyle } = require("../Emails/templates");
const dotenv = require("dotenv");

dotenv.config({ debug: false });

const { FRONT_WEB_URL, PROJECT_NAME } = process.env;

const customerPlanPurchaseEmail = async (options) => {
  const { name, email, planName, planPrice, planValidity } = options;

  const priceDisplay =
    planPrice === 0 ? "Free" : `$${Number(planPrice).toFixed(2)}`;

  const message = baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <h2 style="${baseStyle.h2}">Plan Purchased Successfully</h2>
        <p style="${baseStyle.text}">Hi ${name || "Customer"},</p>
        <p style="${baseStyle.text}">Thank you for purchasing the <strong>${planName}</strong> plan on <strong>${PROJECT_NAME}</strong>. Your account has been activated.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fc; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <tr>
            <td style="text-align: center;">
              <p style="font-size: 14px; color: #888; margin: 0 0 4px;">Plan</p>
              <p style="font-size: 16px; color: #1a1a2e; font-weight: 600; margin: 0 0 12px;">${planName}</p>
              <p style="font-size: 14px; color: #888; margin: 0 0 4px;">Price</p>
              <p style="font-size: 16px; color: #1a1a2e; font-weight: 600; margin: 0 0 12px;">${priceDisplay}</p>
              ${
                planValidity
                  ? `
              <p style="font-size: 14px; color: #888; margin: 0 0 4px;">Validity</p>
              <p style="font-size: 16px; color: #1a1a2e; font-weight: 600; margin: 0;">${planValidity}</p>
              `
                  : ""
              }
            </td>
          </tr>
        </table>
        <div style="text-align: center;">
          <a href="${FRONT_WEB_URL}/plans" style="${baseStyle.btn}">View Plans</a>
        </div>
      </td>
    </tr>
  `);

  await SmtpController.sendEmail(
    email,
    `Plan Purchased - ${PROJECT_NAME}`,
    message,
  );
};

const reminderEmail = async (options, subject) => {
  const { email, fullName, valid_upto } = options;

  const expiryDate = valid_upto
    ? new Date(valid_upto).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const emailSubject =
    subject || `Subscription Expiring Soon - ${PROJECT_NAME}`;

  const message = baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <h2 style="${baseStyle.h2}">Subscription Expiring Soon</h2>
        <p style="${baseStyle.text}">Hi ${fullName || "Valued Customer"},</p>
        <p style="${baseStyle.text}">Your subscription on <strong>${PROJECT_NAME}</strong> is expiring on <strong>${expiryDate}</strong>. Please renew your plan to continue enjoying uninterrupted services.</p>
        <div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 10px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 14px; color: #e67e22; margin: 0; font-weight: 500;">Your access may be limited after the expiry date.</p>
        </div>
        <div style="text-align: center;">
          <a href="${FRONT_WEB_URL}/plans" style="${baseStyle.btn}">Renew Plan</a>
        </div>
      </td>
    </tr>
  `);

  await SmtpController.sendEmail(email, emailSubject, message);
};

const downgradeToFreeEmail = async (options) => {
  const { name, email, planName, planValidity } = options;

  const message = baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <h2 style="${baseStyle.h2}">Plan Downgraded to Free</h2>
        <p style="${baseStyle.text}">Hi ${name || "Customer"},</p>
        <p style="${baseStyle.text}">Your plan has been downgraded to the <strong>Free</strong> plan on <strong>${PROJECT_NAME}</strong>.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fc; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <tr>
            <td style="text-align: center;">
              <p style="font-size: 14px; color: #888; margin: 0 0 4px;">New Plan</p>
              <p style="font-size: 16px; color: #1a1a2e; font-weight: 600; margin: 0 0 12px;">Free Plan</p>
              ${
                planValidity
                  ? `
              <p style="font-size: 14px; color: #888; margin: 0 0 4px;">Valid Until</p>
              <p style="font-size: 16px; color: #1a1a2e; font-weight: 600; margin: 0;">${planValidity}</p>
              `
                  : ""
              }
            </td>
          </tr>
        </table>
        <div style="text-align: center;">
          <a href="${FRONT_WEB_URL}/plans" style="${baseStyle.btn}">View Plans</a>
        </div>
      </td>
    </tr>
  `);

  await SmtpController.sendEmail(
    email,
    `Plan Downgraded - ${PROJECT_NAME}`,
    message,
  );
};

module.exports = {
  customerPlanPurchaseEmail,
  reminderEmail,
  downgradeToFreeEmail,
};
