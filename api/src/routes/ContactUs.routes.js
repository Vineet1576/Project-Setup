const contactUs = require('../controllers/ContactUsController');
const router = require('express').Router();
router.post('/add', contactUs.add);
router.get('/detail', contactUs.detail);
router.put('/update', contactUs.update);
router.delete('/delete', contactUs.delete);
router.get('/listing', contactUs.listing);
router.put('/status/change', contactUs.changeStatus);

module.exports = router;
