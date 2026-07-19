const db = require('../models');
const mongoose = require('mongoose');
const constants = require('../utils/constants');
const helper = require('../utils/helpers');
const { paginate } = require('../utils/paginate');

const getStripe = () => require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const findPlanOrThrow = async (id, trim) => {
  const planId = trim ? id.trim() : id;
  if (!planId || planId === '') throw 'Invalid plan ID provided';
  const plan = await db.plan.findOne({ _id: planId, isDeleted: false });
  if (!plan) throw `Plan not found with ID: ${id}`;
  return plan;
};

const parseFeatures = (features) => {
  if (!features) return undefined;
  let parsed = features;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      const matches = parsed.match(/[a-f0-9]{24}/gi);
      if (matches) parsed = matches;
    }
  }
  if (Array.isArray(parsed)) {
    parsed = parsed
      .map((f) => {
        if (typeof f === 'object' && f.id) return f.id;
        if (typeof f === 'string') return f;
        return null;
      })
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
  }
  return parsed;
};

exports.createPlan = async (data) => {
  data.type = data.type?.toLowerCase();

  if (!data.name) throw constants.PLAN.PAYLOAD_MISSING;

  data.features = parseFeatures(data.features);

  const existed = await db.plan.findOne({
    name: data.name,
    plan_type: data.plan_type,
    isDeleted: false,
  });
  if (existed) throw 'Plan with this name already exists';

  if (data.recommended === 'yes') {
    const recommendedExist = await db.plan.findOne({
      recommended: 'yes',
      planFor: data.planFor,
      isDeleted: false,
    });
    if (recommendedExist) throw constants.PLAN.RECOMMENDED_PLAN_ALREADY_EXIST;
  }

  if (data.plan_type === 'free') {
    const freePlanCheck = await db.plan.findOne({
      plan_type: data.plan_type,
      isDeleted: false,
    });
    if (freePlanCheck) throw constants.PLAN.FREE_PLAN_ALREADY_EXIST;

    if (data.pricing && Array.isArray(data.pricing)) {
      data.pricing = data.pricing.map((price) => ({
        interval: price.interval,
        interval_count: 1,
        currency: price.currency || 'usd',
        unit_amount: 0,
        stripe_price_id: '',
      }));
    }

    await db.plan.create(data);
    return;
  }

  const allowedIntervals = ['month', 'year'];

  if (!data.pricing || !Array.isArray(data.pricing)) {
    throw 'Pricing must contain monthly or yearly plan';
  }

  if (data.pricing.length > 2) {
    throw 'Only monthly and yearly pricing allowed';
  }

  for (const price of data.pricing) {
    if (!allowedIntervals.includes(price.interval)) {
      throw 'Only monthly and yearly pricing allowed';
    }
  }

  const product = await getStripe().products.create({
    name: data.name,
    images: data.images || [`${process.env.BACK_WEB_URL}/static/main.png`],
  });

  data.stripe_product_id = product.id;

  for (const itm of data.pricing) {
    if (!itm.unit_amount || itm.unit_amount <= 0) {
      throw `Invalid unit_amount for ${itm.interval}`;
    }
    if (itm.currency !== 'usd') itm.currency = 'usd';

    const price = await getStripe().prices.create({
      product: product.id,
      unit_amount: Math.round(itm.unit_amount * 100),
      currency: itm.currency || 'usd',
      recurring: { interval: itm.interval, interval_count: 1 },
    });

    itm.stripe_price_id = price.id;
  }

  const newPlan = await db.plan.create(data);
  return newPlan;
};

exports.planDetail = async ({ id, userId }) => {
  const plan = await db.plan
    .findOne({ _id: id, isDeleted: false })
    .populate('dispensary')
    .populate('features')
    .lean();

  if (!plan) throw constants.PLAN.NOT_FOUND;

  plan.isActive = false;
  plan.isOneMonth = false;
  plan.isYearly = false;
  plan.validUpTo = null;

  if (!userId) return plan;

  const objectId = new mongoose.Types.ObjectId(userId);

  let entityDetail = await db.organization.findOne({ _id: objectId, isDeleted: false });
  if (!entityDetail) {
    entityDetail = await db.users.findOne({ _id: objectId, isDeleted: false });
  }

  if (!entityDetail) return plan;

  const activeSubscription = await db.subscriptions
    .findOne({
      status: 'active',
      isDeleted: false,
      plan_id: plan._id,
      userId: entityDetail._id,
    })
    .lean();

  if (!activeSubscription) return plan;

  plan.isActive = true;
  plan.validUpTo = activeSubscription.valid_upto || null;

  if (plan.plan_type === 'paid' && Array.isArray(plan.pricing)) {
    const normalize = (val) => String(val || '').toLowerCase();

    for (const price of plan.pricing) {
      const subType = normalize(activeSubscription.interval?.type);
      const subCount = Number(activeSubscription.interval?.interval_count);
      const priceType = normalize(price.interval);
      const priceCount = Number(price.interval_count);

      const isMatching =
        (subType === 'month' && priceType === 'month' && subCount === priceCount) ||
        (subType === 'year' && priceType === 'year' && subCount === priceCount) ||
        (subType === 'month' && subCount === 12 && priceType === 'year') ||
        (subType === 'year' && subCount === 1 && priceType === 'month' && priceCount === 12);

      if (isMatching) {
        plan.isOneMonth = priceType === 'month' && priceCount === 1;
        plan.isYearly =
          (priceType === 'year' && priceCount === 1) ||
          (priceType === 'month' && priceCount === 12);
        break;
      }
    }
  }

  return plan;
};

exports.getAllPlans = async (params) => {
  let {
    search,
    plan_type,
    page = 1,
    count = 10,
    dispensary,
    status,
    isDeleted,
    sortBy,
    userId,
    planFor,
    type,
  } = params;

  page = Number(page);
  count = Number(count);

  const match = {};
  match.isDeleted = isDeleted === 'true';

  if (status) match.status = status;
  if (type) match.type = type.toLowerCase();
  if (planFor) match.planFor = planFor;
  if (plan_type) match.plan_type = plan_type;

  if (dispensary) {
    match.dispensary = new mongoose.Types.ObjectId(dispensary);
  }

  const sortOption = helper.parseSortParam(sortBy, "updatedAt");

  let entityDetail = null;
  let activeSubscriptions = [];

  if (userId) {
    const objectId = new mongoose.Types.ObjectId(userId);

    entityDetail = await db.organization.findOne({ _id: objectId, isDeleted: false });
    if (!entityDetail) {
      entityDetail = await db.users.findOne({ _id: objectId, isDeleted: false });
    }

    if (entityDetail) {
      activeSubscriptions = await db.subscriptions
        .find({ status: 'active', isDeleted: false, userId: entityDetail._id })
        .lean();
    }
  }

  const activeSubscriptionsMap = {};
  for (const sub of activeSubscriptions) {
    activeSubscriptionsMap[String(sub.plan_id)] = sub;
  }

  const result = await paginate(db.plan, {
    page,
    limit: count,
    match,
    sort: sortOption,
    lookups: [
      {
        from: 'dispensaries',
        localField: 'dispensary',
        foreignField: '_id',
        as: 'dispensaryDetails',
      },
      {
        from: 'features',
        localField: 'features',
        foreignField: '_id',
        as: 'features_details',
      },
    ],
    unwindFields: ['$dispensaryDetails'],
    project: {
      name: 1,
      pricing: 1,
      plan_type: 1,
      stripe_price_id: 1,
      stripe_plan_id: 1,
      features: '$features_details',
      recommended: 1,
      numberOfDays: 1,
      numberOfDispenseries: 1,
      numberOfNotifications: 1,
      currencyType: 1,
      trial_period_days: 1,
      description: 1,
      isActive: 1,
      status: 1,
      isDeleted: 1,
      createdAt: 1,
      updatedAt: 1,
      dispensary: '$dispensaryDetails',
      type: 1,
      series: 1,
      seriesTournaments: 1,
      seriesFeaturedLimit: 1,
      tournamentFeaturedLimit: 1,
    },
    search: search || undefined,
    searchFields: ['name'],
  });

  for (const plan of result.data) {
    const planId = String(plan._id);
    const activeSubscription = activeSubscriptionsMap[planId];

    plan.isActive = false;
    plan.isOneMonth = false;
    plan.isYearly = false;

    if (activeSubscription) {
      plan.isActive = true;
      plan.validUpTo = activeSubscription.valid_upto || null;

      if (plan.plan_type === 'paid' && Array.isArray(plan.pricing)) {
        const matchedPrice = plan.pricing.find(
          (price) => price.stripe_price_id === activeSubscription.stripe_price_id,
        );

        if (matchedPrice) {
          const normalize = (val) => String(val || '').toLowerCase();
          plan.isOneMonth =
            normalize(matchedPrice.interval) === 'month' &&
            Number(matchedPrice.interval_count) === 1;

          plan.isYearly =
            (normalize(matchedPrice.interval) === 'year' &&
              Number(matchedPrice.interval_count) === 1) ||
            (normalize(matchedPrice.interval) === 'month' &&
              Number(matchedPrice.interval_count) === 12);
        }
      }
    }
  }

  return {
    total: result.pagination.total,
    data: result.data,
    freePlanBuy: entityDetail?.freePlanBuy || false,
  };
};

exports.updatePlan = async (data) => {
  const { id } = data;
  await findPlanOrThrow(id);

  const updateData = { ...data };
  delete updateData.id;

  if (updateData.dispensary) {
    updateData.dispensary = new mongoose.Types.ObjectId(updateData.dispensary);
  }

  if (updateData.features) {
    updateData.features = parseFeatures(updateData.features);
  }

  if (updateData.pricing && Array.isArray(updateData.pricing)) {
    updateData.pricing = updateData.pricing.map((price) => ({
      interval: price.interval,
      interval_count: price.interval_count || 1,
      currency: price.currency || 'usd',
      unit_amount: price.unit_amount || 0,
      stripe_price_id: price.stripe_price_id || '',
    }));
  }

  for (const key of ["numberOfDispenseries", "numberOfNotifications", "trial_period_days"]) {
    if (updateData[key]) updateData[key] = parseInt(updateData[key], 10);
  }

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === '' || updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  await db.plan.updateOne({ _id: id }, { $set: updateData });
};

exports.deletePlan = async ({ id }) => {
  const exists = await findPlanOrThrow(id, true);

  const activePlans = await db.users.find({ planId: id, isDeleted: false }).lean();
  if (activePlans.length > 0) {
    throw `${constants.PLAN.DELETION_ERR} ${activePlans.length} users`;
  }

  if (exists.plan_type === 'paid') {
    const stripeErrors = [];

    if (exists.pricing && Array.isArray(exists.pricing)) {
      for (const obj of exists.pricing) {
        if (!obj.stripe_price_id) continue;
        try {
          await getStripe().prices.update(obj.stripe_price_id, { active: false });
        } catch (stripeError) {
          stripeErrors.push({ priceId: obj.stripe_price_id, error: stripeError.message });
        }
      }
    }

    if (exists.stripe_product_id) {
      try {
        await getStripe().products.update(exists.stripe_product_id, { active: false });
      } catch (stripeError) {
        stripeErrors.push({ productId: exists.stripe_product_id, error: stripeError.message });
      }
    }

    if (stripeErrors.length > 0) {
      console.warn('Stripe deactivation had errors:', stripeErrors);
    }
  }

  const updateResult = await db.plan.updateOne(
    { _id: id.trim() },
    { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } },
  );

  if (updateResult.modifiedCount === 0) throw 'Failed to update plan';

  return { id: id.trim(), deleted: true, plan_type: exists.plan_type };
};
