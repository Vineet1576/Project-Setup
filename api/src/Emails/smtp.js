const nodemailer = require('nodemailer');
const { settingRepo } = require('../repositories');

const loadEmailConfig = async () => {
  let config = {};
  try {
    const settings = await settingRepo.getGlobal();
    config = settings?.email || {};
  } catch (err) {
    console.warn('Failed to load SMTP settings:', err.message);
  }
  const port = config.smtpPort || process.env.SMTP_PORT || 587;
  return {
    fromName: config.fromName || process.env.PROJECT_NAME || '',
    fromEmail: config.fromEmail || config.smtpUser || process.env.SMTP_USER || '',
    host: config.smtpHost || process.env.SMTP_HOST,
    port,
    user: config.smtpUser || process.env.SMTP_USER,
    pass: config.smtpPassword || process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
    secure:
      config.smtpSecure !== undefined
        ? !!config.smtpSecure
        : String(port).trim() === '465',
  };
};

const buildTransporter = (config) =>
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: { rejectUnauthorized: false },
  });

exports.sendEmail = async (to, subject, html) => {
  if (!to) return { success: false, error: 'No email provided' };

  const config = await loadEmailConfig();
  const transporter = buildTransporter(config);

  const mailOptions = {
    from: config.fromName
      ? `"${config.fromName}" <${config.fromEmail}>`
      : config.fromEmail,
    to,
    subject,
    html,
  };

  console.log('[SMTP] Sending email:', {
    to,
    subject,
    htmlLength: html ? html.length : 0,
    date: new Date().toISOString(),
  });

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email sent to ${to}:`, {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      envelope: info.envelope,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP] Email send FAILED:', {
      to,
      subject,
      errorName: error.name,
      errorCode: error.code,
      errorMessage: error.message,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
};
