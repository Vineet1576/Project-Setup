const router = require('express').Router();
const transaction = require('../controllers/transactionController');

router.get('/listing', transaction.list);
router.get('/analytics', transaction.analytics);
router.post('/send-invoice', transaction.sendInvoice);
router.get('/download', transaction.download);

module.exports = router;
