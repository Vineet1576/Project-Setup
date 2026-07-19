const express = require('express');
const router = express.Router();
const subscriptions = require('../controllers/subscriptionController');

// Keep loaded for cron job
require('../services/subscriptionCron');

router.post('/purchase', subscriptions.purchaseSubscription);
router.delete('/cancel', subscriptions.cancelSubscription);
router.get('/detail', subscriptions.detailSubscription);
router.get('/list', subscriptions.listSubscriptions);

router.get('/customerbalance', subscriptions.retrieveCustomerBalance);

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptions.webhook
);
module.exports = router;
