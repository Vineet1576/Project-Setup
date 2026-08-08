const faq = require('../controllers/faqController');
const { authorize } = require('../middleware/auth');
const router = require('express').Router();

router.get('/list', faq.listing);
router.get('/categories', faq.categories);
router.post('/add', authorize('admin'), faq.addFaq);
router.get('/detail', authorize('admin'), faq.detail);
router.put('/update', authorize('admin'), faq.updateFaq);
router.delete('/delete', authorize('admin'), faq.deleteFaq);
router.get('/listing', authorize('admin'), faq.adminListing);
router.put('/status/change', authorize('admin'), faq.changeStatus);

module.exports = router;
