const mongoose = require("mongoose");

const db = {};

db.users = require("./User")(mongoose);
db.roles = require("./Role")(mongoose);
db.category = require("./category.model")(mongoose);
db.feedback = require("./Feedback.model")(mongoose);
db.contentManagement = require("./contentManagement.model")(mongoose);
db.features = require("./featureModel")(mongoose);
db.plan = require("./planModel")(mongoose);
db.subscriptions = require("./subscriptionModel")(mongoose);
db.transactions = require("./transactionModel")(mongoose);
db.notifications = require("./notification.model")(mongoose);
db.faqs = require("./faqModel")(mongoose);
db.settings = require("./settingModel")(mongoose);

module.exports = db;
