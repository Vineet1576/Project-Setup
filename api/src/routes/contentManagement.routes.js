const content = require('../controllers/ContentManagementController');
const router = require('express').Router();

router.post('/add', content.addContent);
router.get('/detail', content.getContent);
router.put('/update', content.editContent);
router.get('/listing', content.listing);
router.put('/status/change', content.statusUpdate);

module.exports = router;
