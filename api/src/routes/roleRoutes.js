const role = require('../controllers/roleController');
const router = require('express').Router();

/* ─── Role CRUD Routes ──────────────────────────────────────────── */
router.post('/add', role.createRoles);
router.get('/detail', role.roleDetail);
router.put('/update', role.updateRole);
router.get('/listing', role.getAllRoles);
router.put('/status/change', role.changeStatus);
router.delete('/delete', role.deleteRole);
router.get('/frontend-list', role.frontendRolesList);

module.exports = router;
