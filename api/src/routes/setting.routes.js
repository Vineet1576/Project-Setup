const setting = require('../controllers/settingController');
const { authorize } = require('../middleware/auth');
const router = require('express').Router();

router.get('/', authorize('admin'), setting.get);
router.get('/public', setting.public);
router.put('/', authorize('admin'), setting.update);

module.exports = router;
