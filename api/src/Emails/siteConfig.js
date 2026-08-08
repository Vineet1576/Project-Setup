const { settingRepo } = require("../repositories");

const getSiteConfig = async () => {
  let config = {};
  try {
    const settings = await settingRepo.getGlobal();
    config = settings?.site || {};
  } catch (err) {
    console.warn("Failed to load site settings:", err.message);
  }
  return {
    siteName: config.siteName || process.env.PROJECT_NAME || "Our Platform",
    tagline: config.tagline || "",
    logoUrl:
      config.logoUrl || `${process.env.BACK_WEB_URL || ""}/img/logo.png`,
    supportEmail: config.supportEmail || process.env.SUPPORT_EMAIL || "",
    contactEmail: config.contactEmail || "",
    contactPhone: config.contactPhone || "",
    contactPhoneCode: config.contactPhoneCode || "",
  };
};

module.exports = { getSiteConfig };
