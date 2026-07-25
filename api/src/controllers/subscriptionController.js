const constants = require("../utils/constants");
const response = require("../utils/response");
const Validations = require("../validations");
const subscriptionService = require("../services/subscriptionService");
const mongoose = require("mongoose");
const { transactionRepo, planRepo, subscriptionRepo, userRepo } = require("../repositories");
const db = require("../models");
const { handlePostPaymentTasks } = require("../utils/invoices");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

const ObjectId = mongoose.Types.ObjectId;

module.exports = {
  purchaseSubscription: async (req, res, next) => {
    try {
      const validation_result =
        await Validations.Subscriptions.purchaseSubscriptionPlan(req, res);
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }

      const data = {
        ...req.body,
        organizationId: req.identity.id,
        email: req.identity.email,
      };

      const result = await subscriptionService.purchaseSubscription(data);

      if (result?.unit_amount === 0) {
        return response.success(
          result,
          "Free plan created successfully",
          req,
          res,
        );
      }

      return response.success(
        result,
        "Checkout session created successfully",
        req,
        res,
      );
    } catch (err) {
      next(err);
    }
  },

  cancelSubscription: async (req, res, next) => {
    try {
      const validation_result = await Validations.Subscriptions.idCheck(
        req,
        res,
      );
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }

      const { id } = req.decryptedParams || req.query;
      await subscriptionService.cancelSubscription({ id });

      return response.success(
        null,
        "Subscription cancelled successfully.",
        req,
        res,
      );
    } catch (err) {
      next(err);
    }
  },

  detailSubscription: async (req, res, next) => {
    try {
      const validation_result = await Validations.Subscriptions.idCheck(
        req,
        res,
      );
      if (validation_result && !validation_result.success) {
        throw validation_result.message;
      }

      const { id } = req.decryptedParams || req.query;
      const data = await subscriptionService.detailSubscription({ id });

      if (!data || data.length === 0) {
        return response.success([], "No subscription found", req, res);
      }

      return response.success({ data }, constants.SUBSCRIPTION.FETCH, req, res);
    } catch (err) {
      next(err);
    }
  },

  listSubscriptions: async (req, res, next) => {
    try {
      const params = req.decryptedParams || req.query;
      const result = await subscriptionService.listSubscriptions(params);

      return response.success(result, constants.SUBSCRIPTION.FETCH, req, res);
    } catch (err) {
      next(err);
    }
  },

  webhook: async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    if (endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error("Stripe webhook signature verification failed:", err.message);
        return res.status(401).json({ received: false });
      }
    } else {
      console.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
      const raw = req.body;
      if (Buffer.isBuffer(raw)) {
        event = JSON.parse(raw.toString("utf8"));
      } else if (typeof raw === "string") {
        event = JSON.parse(raw);
      } else {
        event = raw;
      }
    }

    console.log(event.type, "Webhook Event Type");

    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({ received: true });
    }

    try {
      const checkoutSession = event.data.object;
      const { planId, userId, stripe_price_id, unit_amount, currency } =
        checkoutSession.metadata;

      if (!planId || !userId) {
        return res.status(200).json({ received: true });
      }

      const existingTransaction = await transactionRepo.findOne({
        stripe_session_id: checkoutSession.id,
      });
      if (existingTransaction) {
        return res.status(200).json({ received: true });
      }

      const planDetail = await planRepo.findById(planId);
      if (!planDetail) {
        console.error(`Plan not found: ${planId}`);
        return res.status(200).json({ received: true });
      }

      let entityDetail = await userRepo.findById(userId);
      let userModel = "users";

      if (!entityDetail) {
        entityDetail = await db.organization
          ?.findOne({ _id: new ObjectId(userId), isDeleted: false })
          .lean();
        if (entityDetail) userModel = "organization";
      }

      if (!entityDetail) {
        console.error(`Subscriber not found: ${userId}`);
        return res.status(200).json({ received: true });
      }

      const valid_date = new Date();
      if (planDetail.numberOfDays) {
        valid_date.setDate(valid_date.getDate() + planDetail.numberOfDays);
      } else {
        valid_date.setMonth(valid_date.getMonth() + 1);
      }

      const existingSub = await subscriptionRepo.findOne({
        stripe_subscription_id: checkoutSession.subscription,
      });

      await subscriptionRepo.updateMany(
        {
          userId: entityDetail.id,
          status: "active",
          ...(existingSub && { _id: { $ne: existingSub.id } }),
        },
        { $set: { status: "cancel" } },
      );

      const subscriptionData = {
        userId: entityDetail.id,
        plan_id: planDetail.id,
        stripe_price_id:
          stripe_price_id || checkoutSession.metadata.stripe_price_id,
        unit_amount: checkoutSession.amount_total
          ? checkoutSession.amount_total / 100
          : Number(unit_amount || 0),
        currency: checkoutSession.currency || currency || "usd",
        stripe_subscription_id: checkoutSession.subscription,
        valid_upto: valid_date,
        status: "active",
      };

      let newSubscription;
      if (existingSub) {
        newSubscription = await subscriptionRepo.findByIdAndUpdate(
          existingSub.id,
          { $set: subscriptionData },
          { new: true },
        );
      } else {
        await subscriptionRepo.create(subscriptionData);
        newSubscription = await subscriptionRepo.findOne({ stripe_subscription_id: checkoutSession.subscription });
      }

      if (userModel === "users") {
        await userRepo.updateById(entityDetail.id, {
          planId: planDetail.id,
          subscriptionId: newSubscription.id,
        });
      } else {
        await db.organization?.findByIdAndUpdate(entityDetail.id, {
          $set: { planId: planDetail.id, subscriptionId: newSubscription.id },
        });
      }

      handlePostPaymentTasks(
        checkoutSession,
        entityDetail,
        planDetail,
        newSubscription,
        valid_date,
        userModel,
      ).catch((err) => console.error("Background Task Error:", err));

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error("Webhook Critical Error:", err);
      return res.status(200).json({ received: true });
    }
  },

  retrieveCustomerBalance: async (req, res, next) => {
    try {
      const customerId = req.identity.customer_id;
      const customer =
        await subscriptionService.retrieveCustomerBalance(customerId);
      return res.status(200).json({
        success: true,
        message: "Customer Balance fetched successfully",
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  },
};
