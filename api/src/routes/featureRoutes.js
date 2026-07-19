const router = require('express').Router();
const feature = require('../controllers/featureController');

router.post('/add', feature.addFeatures);
router.put('/update', feature.editfeature);
router.put('/status/change', feature.changeFeatureStatus);
router.get('/list', feature.getAllFeatures);
router.get('/detail', feature.findSingleFeature);
router.delete('/delete', feature.deleteFeature);

module.exports = router;
