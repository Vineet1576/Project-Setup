const router = require("express").Router();
const dashboard = require("../controllers/dashboardController");

router.get("/stats", dashboard.getStats);

module.exports = router;
