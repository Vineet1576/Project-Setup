require("dotenv").config();
const mongoose = require("mongoose");
const cron = require("node-cron");
const ObjectId = mongoose.Types.ObjectId;
const { subscriptionRepo } = require("../repositories");
const { reminderEmail } = require("../Emails/stripeEmails");

cron.schedule(
  "0 10 * * *",
  async () => {
    console.log("--- Processing Subscription Expiries & Reminders ---");
    try {
      const today = new Date();

      const reminderStart = new Date(today);
      reminderStart.setDate(today.getDate() + 2);
      reminderStart.setHours(0, 0, 0, 0);

      const reminderEnd = new Date(reminderStart);
      reminderEnd.setHours(23, 59, 59, 999);

      const db = require("../models");
      const expiringSoon = await db.subscriptions
        .find({
          isDeleted: false,
          status: "active",
          valid_upto: { $gte: reminderStart, $lte: reminderEnd },
        })
        .populate("userId");

      for (const sub of expiringSoon) {
        if (sub.userId?.email) {
          await reminderEmail(
            {
              email: sub.userId.email,
              fullName: sub.userId.fullName || sub.userId.name,
              valid_upto: sub.valid_upto,
            },
            "Action Required: Subscription Expiring in 2 Days",
          );
        }
      }
    } catch (err) {
      console.error("ERROR in Subscription Cron:", err);
    }
  },
  { timezone: "Asia/Kolkata" },
);

module.exports = {};
