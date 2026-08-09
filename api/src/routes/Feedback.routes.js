const feedback = require('../controllers/FeedbackController');
const router = require('express').Router();
router.post('/add', feedback.add);
router.get('/detail', feedback.detail);
router.put('/update', feedback.update);
router.delete('/delete', feedback.delete);
router.get('/listing', feedback.listing);
router.put('/status/change', feedback.changeStatus);
router.post('/reply', feedback.reply);

module.exports = router;