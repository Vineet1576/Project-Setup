const { planRepo, subscriptionRepo, featureRepo, userRepo } = require("../repositories");
const constants = require("../utils/constants");
const mongoose = require("mongoose");
const { customerPlanPurchaseEmail } = require("../Emails/stripeEmails");
const helper = require("../utils/helpers");

const db = require("../models");
const ObjectId = mongoose.Types.ObjectId;
const { getStripe } = require("../utils/stripeConfig");

const getSubscriber = (item) => item.userDetails;

const filterBySearch = (data, search, extraFields = []) => {
  if (!search) return data;
  const regex = new RegExp(search, "i");
  return data.filter((item) => {
    const subscriber = getSubscriber(item);
    return (
      regex.test(subscriber?.fullName || "") ||
      regex.test(subscriber?.name || "") ||
      extraFields.some((field) => regex.test(item[field] || ""))
    );
  });
};

const cancelStripeSubscription = async (data) => {
  console.log("Canceling subscription:", data.stripe_subscription_id);

  const stripeClient = await getStripe();

  const getSubscription = await stripeClient.subscriptions.retrieve(data.stripe_subscription_id);

  if (!getSubscription) throw "Subscription not found";

  if (getSubscription.status === "canceled") return { proration_amount: 0 };

  const subscription = await stripeClient.subscriptions.update(data.stripe_subscription_id, {
    cancel_at_period_end: false,
    proration_behavior: "create_prorations",
  });

  let totalProrationAmount = 0;

  try {
    const invoice = await stripeClient.invoices.retrieve(subscription.latest_invoice);
    const prorationItems = invoice.lines.data.filter((line) => line.proration);
    if (prorationItems.length > 0) {
      totalProrationAmount =
        prorationItems.reduce((sum, line) => sum + line.amount, 0) / 100;
    }
  } catch (invoiceError) {
    console.error("Error fetching invoice:", invoiceError);
  }

  return { proration_amount: Math.abs(totalProrationAmount) };
};

const createCheckoutSession = async (data) => {
  const getPlan = await planRepo.findDetail(data.plan_id);

  const getEntity = await userRepo.findById(data.userId);
  if (!getEntity) throw "Subscriber user not found";

  const selectedPrice = getPlan.pricing.find(
    (price) => price.stripe_price_id === data.stripe_price_id,
  );
  if (!selectedPrice) throw "Selected price not found in plan";

  const selectedCurrency = selectedPrice.currency?.toLowerCase() || "usd";

  const existingSubscriptions = await db.subscriptions
    .find({
      userId: new ObjectId(data.userId),
      status: "active",
      isDeleted: false,
    })
    .lean();

  if (existingSubscriptions && existingSubscriptions.length > 0) {
    for (const sub of existingSubscriptions) {
      if (sub.currency && sub.currency !== selectedCurrency) {
        throw `Currency mismatch: Your current subscription uses ${sub.currency.toUpperCase()}.`;
      }
    }
  }

  const metadata = {
    userId: String(data.userId),
    planId: String(data.plan_id),
    stripe_price_id: String(data.stripe_price_id),
    unit_amount: String(selectedPrice.unit_amount),
    currency: String(selectedCurrency),
    interval_type: String(data.interval.type),
    interval_count: String(data.interval.interval_count),
  };

  if (data.current_subscription_id) {
    metadata.current_subscription_id = String(data.current_subscription_id);
    metadata.current_plan_id = String(data.current_plan_id || "");
    metadata.current_plan_type = String(data.current_plan_type || "");
    metadata.current_stripe_subscription_id = String(data.current_stripe_subscription_id || "");
    metadata.cancel_previous_paid = String(data.cancel_previous_paid || "false");
  }

  if (data.dispensary) {
    metadata.dispensary = String(data.dispensary);
  }

  const checkoutParams = {
    success_url: `${process.env.FRONT_WEB_URL}/plans?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONT_WEB_URL}`,
    line_items: [{ price: data.stripe_price_id, quantity: 1 }],
    metadata,
    mode: "subscription",
    payment_method_types: ["card"],
  };

  if (getEntity.customer_id) {
    checkoutParams.customer = getEntity.customer_id;
  } else {
    checkoutParams.customer_email = getEntity.email || data.email;
  }

  const stripeClient = await getStripe();
  return stripeClient.checkout.sessions.create(checkoutParams);
};

exports.purchaseSubscription = async (data) => {
  const { plan_id, userId, email, dispensary, stripe_price_id, interval } = data;

  const planObjectId = new ObjectId(plan_id);
  const userObjectId = new ObjectId(userId);

  const checkUser = await db.users.findOne({ _id: userObjectId, isDeleted: false }).lean();
  if (!checkUser) throw "Invalid user account";

  const existingSubscription = await subscriptionRepo.findOne(
    { status: "active", userId: userObjectId },
    { populate: "plan_id" },
  );

  const getPlan = await planRepo.findById(plan_id);
  if (!getPlan) throw "Plan not found";

  if (getPlan.plan_type === "free") {
    if (checkUser.freePlanBuy) throw constants.SUBSCRIPTION.NOT_FREE_PLAN;

    if (existingSubscription && existingSubscription.plan_id?.plan_type === "paid") {
      await cancelStripeSubscription(existingSubscription);
    }

    await subscriptionRepo.updateMany(
      { status: "active", userId: userObjectId },
      { status: "cancel" },
    );

    const now = new Date();
    const validUpto = new Date();
    validUpto.setDate(validUpto.getDate() + 30);

    const subData = {
      plan_id: planObjectId,
      unit_amount: 0,
      valid_from: now,
      valid_upto: validUpto,
      userId: userObjectId,
      email,
      interval: data.interval || { type: "month", interval_count: 1 },
    };

    const newSubscription = await subscriptionRepo.create(subData);

    await db.users.findOneAndUpdate(
      { _id: userObjectId, isDeleted: false },
      {
        $set: {
          freePlanBuy: true,
          planId: planObjectId,
          subscriptionId: newSubscription.id,
          validUpto,
        },
      },
    );

    const transactionService = require("./transactionService");
    await transactionService.create({
      userId: userObjectId,
      purchased_planId: planObjectId,
      amount: 0,
      status: "success",
      currency: "usd",
      stripe_session_id: "",
      stripe_payment_id: "",
      invoiceUrl: "",
      subscriptionId: newSubscription.id,
      type: getPlan?.type,
      planDetails: {
        plan_id: planObjectId,
        name: getPlan?.name,
        plan_type: getPlan?.plan_type,
        interval: data.interval || { type: "month", interval_count: 1 },
        unit_amount: 0,
        currency: "usd",
      },
      stripe_fee: 0,
      net_amount: 0,
    });

    customerPlanPurchaseEmail({
      name: checkUser?.fullName || checkUser?.name,
      email: checkUser?.email,
      planName: getPlan?.name,
      planPrice: 0,
      planValidity: "30 Days",
    });

    return { unit_amount: 0, valid_from: now, valid_upto: validUpto, userId: userObjectId };
  }

  const sessionData = { ...data, plan_id: planObjectId };

  if (existingSubscription) {
    sessionData.current_subscription_id = existingSubscription.id;
    sessionData.current_plan_type = existingSubscription.plan_id?.plan_type;
    sessionData.current_plan_id = existingSubscription.plan_id?.id;

    if (existingSubscription.stripe_subscription_id) {
      sessionData.current_stripe_subscription_id = existingSubscription.stripe_subscription_id;
    }

    if (existingSubscription.plan_id?.plan_type === "paid") {
      sessionData.cancel_previous_paid = "true";
    } else if (existingSubscription.plan_id?.plan_type === "free") {
      await subscriptionRepo.updateOne({ _id: existingSubscription.id }, { status: "cancel" });

      await db.users.findOneAndUpdate(
        { _id: userObjectId, isDeleted: false },
        {
          $set: {
            freePlanBuy: false,
            planId: null,
            subscriptionId: null,
          },
        },
      );
    }
  }

  sessionData.userId = userObjectId.toString();

  if (dispensary) {
    sessionData.dispensary = new ObjectId(dispensary);
  }

  return createCheckoutSession(sessionData).then((session) => session.url);
};

exports.cancelSubscription = async ({ id }) => {
  const getSubscription = await subscriptionRepo.findWithPopulate({
    _id: id, status: "active", isDeleted: false,
  });

  if (!getSubscription) throw "Subscription doesn't exist or is not active";

  if (getSubscription?.plan_id?.plan_type !== "free") {
    const cancelSub = await cancelStripeSubscription(getSubscription);

    let updatedEntity = await db.users.findOneAndUpdate(
      { _id: getSubscription.userId, isDeleted: false },
      { $set: { proration_amount: cancelSub.proration_amount } },
    );

    if (!updatedEntity) {
      updatedEntity = await db.users.findOneAndUpdate(
        { _id: getSubscription.userId, isDeleted: false },
        { $set: { proration_amount: cancelSub.proration_amount } },
      );
    }
  }

  await subscriptionRepo.updateOne({ _id: id, isDeleted: false }, { status: "cancel" });
};

exports.detailSubscription = async ({ id }) => {
  if (!ObjectId.isValid(id)) throw "Invalid subscription ID format";
  return subscriptionRepo.aggregateDetail(id);
};

exports.listSubscriptions = async (params) => {
  const { page = 1, count = 10, sortBy, userId, status, isDeleted = false, type, search } = params;

  const result = await subscriptionRepo.findAllWithPagination({
    page, count, sortBy, userId, status, isDeleted, type,
  });

  let data = result.data;
  data = filterBySearch(data, search, ["planDetails.name"]);

  const featureIdSet = new Set();
  for (const item of data) {
    if (item.planDetails?.features) {
      for (const fid of item.planDetails.features) {
        featureIdSet.add(String(fid));
      }
    }
  }

  const featuresMap = {};
  if (featureIdSet.size) {
    const features = await featureRepo.findByNameIn([...featureIdSet]);
    for (const f of features) featuresMap[String(f.id)] = f;
  }

  data = data.map((item) => {
    const matchedPricing = (item.planDetails?.pricing || []).find(
      (p) => p.stripe_price_id === item.stripe_price_id,
    );
    const planFeatures = (item.planDetails?.features || [])
      .map((fid) => featuresMap[String(fid)])
      .filter(Boolean);

    return {
      _id: item._id,
      plan_id: item.plan_id,
      unit_amount: item.unit_amount,
      currency: item.currency,
      interval: item.interval,
      valid_upto: item.valid_upto,
      userId: item.userId,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      stripe_price_id: item.stripe_price_id,
      stripe_subscription_id: item.stripe_subscription_id,
      subscriber: getSubscriber(item),
      planDetails: item.planDetails
        ? {
            _id: item.planDetails._id,
            name: item.planDetails.name,
            plan_type: item.planDetails.plan_type,
            features: planFeatures,
            pricing: matchedPricing,
          }
        : null,
    };
  });

  return { total: result.pagination.total, data };
};

exports.retrieveCustomerBalance = async (customerId) => {
  const stripeClient = await getStripe();
  return stripeClient.customers.retrieve(customerId);
};
