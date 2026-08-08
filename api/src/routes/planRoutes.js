const plan = require('../controllers/planController');
const router = require('express').Router();

router.post('/add', plan.createPlan);
router.put('/update', plan.updatePlan);
router.put('/status/change', plan.changeStatus);
// router.post('/assign-venue', plan.assignOrOverridePlanToVenue);
router.get('/list', plan.getAllPlans);
router.get('/detail', plan.planDetail);
router.delete('/delete', plan.deletePlan);

module.exports = router;
