const { settingRepo } = require("../repositories");

const resolveStripeConfig = async () => {
  let stripe = {};
  let mode = "test";
  try {
    const settings = await settingRepo.getGlobal();
    stripe = settings?.stripe || {};
    mode = stripe.mode === "live" ? "live" : "test";
  } catch (err) {
    console.warn("Failed to load Stripe settings:", err.message);
  }
  const env = stripe[mode] || {};
  return {
    mode,
    secretKey: env.secretKey || process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
    webhookSecret: env.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "",
    publishableKey: env.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || "",
  };
};

const getStripe = async () => {
  const { secretKey } = await resolveStripeConfig();
  return require("stripe")(secretKey);
};

module.exports = { resolveStripeConfig, getStripe };
