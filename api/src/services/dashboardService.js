const db = require("../models");

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const toKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toLabel = (d) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const buildDays = (start, end) => {
  const days = [];
  let cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur = new Date(cur.getTime() + DAY_MS);
  }
  return days;
};

const fillSeries = (days, rows, extra) => {
  const byKey = Object.fromEntries(rows.map((r) => [r._id, r]));
  return days.map((d) => {
    const key = toKey(d);
    const row = byKey[key];
    return {
      key,
      label: toLabel(d),
      ...extra,
      ...(row ? { count: row.count, revenue: row.revenue } : {}),
    };
  });
};

const inRange = (rangeStart, rangeEnd, field = "createdAt") => {
  if (!rangeStart && !rangeEnd) return {};
  const cond = {};
  cond[field] = {};
  if (rangeStart) cond[field].$gte = rangeStart;
  if (rangeEnd) cond[field].$lte = rangeEnd;
  return cond;
};

exports.getAdminStats = async ({ startDate, endDate } = {}) => {
  const now = new Date();
  const today = startOfDay(now);
  const rangeStart = startDate ? startOfDay(startDate) : null;
  const rangeEnd = endDate ? endOfDay(endDate) : null;

  let days;
  if (rangeStart && rangeEnd) {
    days = buildDays(rangeStart, rangeEnd);
  } else if (rangeStart) {
    days = buildDays(rangeStart, today);
  } else if (rangeEnd) {
    days = buildDays(new Date(rangeEnd.getTime() - 29 * DAY_MS), rangeEnd);
  } else {
    const [firstUser, firstTx] = await Promise.all([
      db.users.findOne({ isDeleted: false }).sort({ createdAt: 1 }).select("createdAt"),
      db.transactions.findOne({ isDeleted: false }).sort({ createdAt: 1 }).select("createdAt"),
    ]);
    const earliest = [firstUser?.createdAt, firstTx?.createdAt]
      .filter(Boolean)
      .sort((a, b) => a - b)[0];
    days = buildDays(earliest ? startOfDay(earliest) : new Date(today.getTime() - 29 * DAY_MS), today);
  }

  const userRange = inRange(rangeStart, rangeEnd);
  const txRange = inRange(rangeStart, rangeEnd);
  const subRange = inRange(rangeStart, rangeEnd);
  const userMatch = { isDeleted: false, ...userRange };
  const txMatch = { isDeleted: false, ...txRange };

  const [
    totalUsers,
    activeUsers,
    approvedUsers,
    pendingUsers,
    totalTransactions,
    successfulTransactions,
    activeSubscriptions,
    revenueResult,
    userTrendRaw,
    txTrendRaw,
    txStatusRaw,
    planDistRaw,
    recentTxDocs,
    recentUsersDocs,
  ] = await Promise.all([
    db.users.countDocuments(userMatch),
    db.users.countDocuments({ ...userMatch, status: "active" }),
    db.users.countDocuments({
      ...userMatch,
      approvalStatus: { $in: ["approved", "completed"] },
    }),
    db.users.countDocuments({ ...userMatch, approvalStatus: "pending" }),
    db.transactions.countDocuments(txMatch),
    db.transactions.countDocuments({ ...txMatch, status: "success" }),
    db.subscriptions.countDocuments({ isDeleted: false, ...subRange, status: "active" }),
    db.transactions.aggregate([
      { $match: { ...txMatch, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    db.users.aggregate([
      { $match: userMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
    db.transactions.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, "$amount", 0] },
          },
        },
      },
    ]),
    db.transactions.aggregate([
      { $match: txMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    db.subscriptions.aggregate([
      { $match: { isDeleted: false, ...subRange } },
      { $group: { _id: "$plan_id", count: { $sum: 1 } } },
    ]),
    db.transactions
      .find(txMatch)
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("userId", "firstName lastName fullName email")
      .populate("purchased_planId", "name"),
    db.users
      .find(userMatch)
      .sort({ createdAt: -1 })
      .limit(6)
      .select("firstName lastName fullName email approvalStatus status createdAt"),
  ]);

  const userTrend = fillSeries(days, userTrendRaw, { count: 0 });
  const txTrend = fillSeries(days, txTrendRaw, { count: 0, revenue: 0 });

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRange = { createdAt: { $gte: monthStart, $lte: now } };
  const monthUserMatch = { isDeleted: false, ...monthRange };
  const monthTxMatch = { isDeleted: false, ...monthRange };

  const [thisMonth, thisMonthRevenue] = await Promise.all([
    db.transactions.aggregate([
      { $match: { ...monthTxMatch, status: "success" } },
      {
        $group: {
          _id: null,
          transactions: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
    ]),
    db.users.aggregate([
      { $match: monthUserMatch },
      {
        $group: {
          _id: null,
          users: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          approved: {
            $sum: {
              $cond: [
                { $in: ["$approvalStatus", ["approved", "completed"]] },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const tmRow = thisMonth && thisMonth[0];
  const tmUser = thisMonthRevenue && thisMonthRevenue[0];
  const thisMonthStats = {
    users: tmUser?.users || 0,
    activeUsers: tmUser?.active || 0,
    approvedUsers: tmUser?.approved || 0,
    pendingUsers: tmUser?.pending || 0,
    transactions: tmRow?.transactions || 0,
    revenue: tmRow?.revenue || 0,
  };

  const statusOrder = ["success", "pending", "failed", "cancelled"];
  const txStatusMap = Object.fromEntries(
    txStatusRaw.map((r) => [r._id, r.count]),
  );
  const transactionStatus = statusOrder.map((status) => ({
    status,
    count: txStatusMap[status] || 0,
  }));

  const planIds = planDistRaw.map((r) => r._id).filter(Boolean);
  const plans = planIds.length
    ? await db.plan.find({ _id: { $in: planIds } }).select("name")
    : [];
  const planNameById = Object.fromEntries(
    plans.map((p) => [String(p._id), p.name]),
  );
  const planDistribution = planDistRaw
    .filter((r) => r._id)
    .map((r) => ({
      id: String(r._id),
      name: planNameById[String(r._id)] || "Unknown plan",
      count: r.count,
    }))
    .sort((a, b) => b.count - a.count);

  const recentTransactions = recentTxDocs.map((t) => {
    const user = t.userId || {};
    const name =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      null;
    return {
      id: t.id,
      date: t.createdAt,
      customer: name || user.email || null,
      email: user.email || null,
      plan: t.purchased_planId?.name || null,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
    };
  });

  const isAdminEmail = (email) => {
    if (!email) return false;
    const e = String(email).toLowerCase();
    return e.startsWith('admin@') || e.includes('administrator') || e === 'admin' || e.startsWith('root@');
  };

  const recentSignups = recentUsersDocs
    .filter((u) => !isAdminEmail(u.email))
    .map((u) => {
    const name =
      u.fullName ||
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
      null;
    return {
      id: u.id,
      date: u.createdAt,
      name: name || u.email || null,
      email: u.email || null,
      approvalStatus: u.approvalStatus,
      status: u.status,
    };
  });

  return {
    range: {
      start: rangeStart ? rangeStart.toISOString() : null,
      end: rangeEnd ? rangeEnd.toISOString() : null,
    },
    thisMonth: thisMonthStats,
    totalUsers,
    activeUsers,
    approvedUsers,
    pendingUsers,
    totalTransactions,
    successfulTransactions,
    activeSubscriptions,
    totalRevenue: revenueResult[0]?.total || 0,
    userTrend,
    transactionTrend: txTrend,
    transactionStatus,
    planDistribution,
    recentTransactions,
    recentSignups,
  };
};
