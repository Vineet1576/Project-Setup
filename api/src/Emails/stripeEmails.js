const SmtpController = require("../Emails/smtp");
const { baseTemplate, baseStyle } = require("./templates");
const { getSiteConfig } = require("./siteConfig");
const dotenv = require("dotenv");

dotenv.config({ debug: false });

const { FRONT_WEB_URL } = process.env;

const currencySymbol = (currency) => {
  const symbols = { usd: "$", eur: "€", gbp: "£", inr: "₹", aud: "A$", cad: "C$", jpy: "¥" };
  return symbols[(currency || "usd").toLowerCase()] || `${(currency || "").toUpperCase()} `;
};

const formatAmount = (value, currency) => {
  const amount = Number(value || 0);
  if (amount === 0) return "Free";
  return `${currencySymbol(currency)}${amount.toFixed(2)}`;
};

const customerPlanPurchaseEmail = async (options) => {
  const { name, email, planName, planPrice, planValidity, invoiceUrl, currency } = options;

  const priceDisplay = formatAmount(planPrice, currency);

  const site = await getSiteConfig();

  const message = await baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; background: #e8f5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #1a1a2e;">Plan Purchased Successfully</h2>
          <p style="font-size: 14px; color: #888; margin: 8px 0 0;">Your subscription is now active</p>
        </div>
        <p style="${baseStyle.text}">Hi ${name || "Customer"},</p>
        <p style="${baseStyle.text}">Thank you for purchasing the <strong>${planName}</strong> plan on <strong>${site.siteName}</strong>. Your account has been activated and you can now enjoy all the premium features.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fc; border-radius: 14px; margin: 24px 0; border: 1px solid #eee;">
          <tr>
            <td style="padding: 4px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #eee;">
                    <p style="font-size: 12px; color: #888; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Plan</p>
                    <p style="font-size: 17px; color: #1a1a2e; font-weight: 700; margin: 0;">${planName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #eee;">
                    <p style="font-size: 12px; color: #888; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Price</p>
                    <p style="font-size: 17px; color: #1a1a2e; font-weight: 700; margin: 0;">${priceDisplay}</p>
                  </td>
                </tr>
                ${
                  planValidity
                    ? `
                <tr>
                  <td style="padding: 14px 0;">
                    <p style="font-size: 12px; color: #888; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Validity</p>
                    <p style="font-size: 17px; color: #1a1a2e; font-weight: 700; margin: 0;">${planValidity}</p>
                  </td>
                </tr>`
                    : ""
                }
              </table>
            </td>
          </tr>
        </table>
        ${
          invoiceUrl
            ? `
        <div style="text-align: center; margin: 8px 0;">
          <a href="${invoiceUrl}" style="${baseStyle.btn}">View Invoice</a>
        </div>`
            : `
        <div style="text-align: center; margin: 8px 0;">
          <a href="${FRONT_WEB_URL}/plans" style="${baseStyle.btn}">Explore Your Plan</a>
        </div>`
        }
        <p style="${baseStyle.text}; font-size: 13px; color: #999; text-align: center;">Need help? Contact our support team anytime.</p>
      </td>
    </tr>
  `);

  await SmtpController.sendEmail(
    email,
    `Plan Purchased - ${site.siteName}`,
    message,
  );
};

const customerPlanInvoiceEmail = async (options) => {
  const {
    name,
    email,
    planName,
    planPrice,
    invoiceNumber,
    invoiceDate,
    invoiceUrl,
    currency,
  } = options;

  const priceDisplay = formatAmount(planPrice, currency);

  const site = await getSiteConfig();

  const message = await baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
          <tr>
            <td>
              <p style="font-size: 12px; color: #888; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Invoice Number</p>
              <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #1a1a2e;">${invoiceNumber || "N/A"}</h2>
            </td>
            <td align="right">
              <span style="display: inline-block; background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Paid</span>
            </td>
          </tr>
        </table>
        <p style="${baseStyle.text}">Hi ${name || "Customer"},</p>
        <p style="${baseStyle.text}">Thank you for your payment. Please find the invoice for your recent <strong>${planName}</strong> plan purchase on <strong>${site.siteName}</strong>.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fc; border-radius: 14px; border: 1px solid #eee; overflow: hidden; margin: 24px 0;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="font-size: 12px; color: #888; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Billed To</p>
              <p style="font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px;">${name || "Customer"}</p>
              <p style="font-size: 14px; color: #555; margin: 0;">${email || "N/A"}</p>
            </td>
            <td align="right" style="padding: 20px 24px;">
              <p style="font-size: 12px; color: #888; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Invoice Date</p>
              <p style="font-size: 15px; color: #1a1a2e; margin: 0;">${invoiceDate || "N/A"}</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td style="border-bottom: 2px solid #1a1a2e; padding: 10px 14px; font-size: 12px; font-weight: 700; color: #1a1a2e; text-transform: uppercase; letter-spacing: 1px;">Description</td>
            <td style="border-bottom: 2px solid #1a1a2e; padding: 10px 14px; font-size: 12px; font-weight: 700; color: #1a1a2e; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Amount</td>
          </tr>
          <tr>
            <td style="padding: 16px 14px; border-bottom: 1px solid #eee; font-size: 15px; color: #1a1a2e; font-weight: 600;">${planName} Subscription</td>
            <td style="padding: 16px 14px; border-bottom: 1px solid #eee; font-size: 15px; color: #1a1a2e; text-align: right; font-weight: 600;">${priceDisplay}</td>
          </tr>
          <tr>
            <td style="padding: 18px 14px; font-size: 15px; font-weight: 800; color: #1a1a2e;">Total</td>
            <td style="padding: 18px 14px; font-size: 20px; font-weight: 800; color: #1a1a2e; text-align: right;">${priceDisplay}</td>
          </tr>
        </table>
        ${
          invoiceUrl
            ? `
        <div style="text-align: center; margin: 8px 0;">
          <a href="${invoiceUrl}" style="${baseStyle.btn}">View Invoice</a>
        </div>`
            : ""
        }
        <p style="${baseStyle.text}; font-size: 13px; color: #999; text-align: center;">If you have any questions about this invoice, please contact our support team.</p>
      </td>
    </tr>
  `);

  await SmtpController.sendEmail(
    email,
    `Your Invoice from ${site.siteName}`,
    message,
  );
};

const reminderEmail = async (options, subject) => {
  const { email, fullName, valid_upto } = options;

  const site = await getSiteConfig();

  const expiryDate = valid_upto
    ? new Date(valid_upto).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const emailSubject =
    subject || `Subscription Expiring Soon - ${site.siteName}`;

  const message = await baseTemplate(`
    <tr>
      <td style="${baseStyle.content}">
        <h2 style="${baseStyle.h2}">Subscription Expiring Soon</h2>
        <p style="${baseStyle.text}">Hi ${fullName || "Valued Customer"},</p>
        <p style="${baseStyle.text}">Your subscription on <strong>${site.siteName}</strong> is expiring on <strong>${expiryDate}</strong>. Please renew your plan to continue enjoying uninterrupted services.</p>
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

module.exports = {
  customerPlanPurchaseEmail,
  customerPlanInvoiceEmail,
  reminderEmail,
};
