const router = require("express").Router();

router.use("/users", require("./userRoutes"));
router.use("/roles", require("./roleRoutes"));
router.use("/category", require("./category.routes"));
router.use("/contact-us", require("./ContactUs.routes"));
router.use("/content-management", require("./contentManagement.routes"));
router.use("/features", require("./featureRoutes"));
router.use("/plans", require("./planRoutes"));
router.use("/subscriptions", require("./subscription.routes"));
router.use("/upload", require("./upload.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/transactions", require("./transaction.routes"));

module.exports = router;
