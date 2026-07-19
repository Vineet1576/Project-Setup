const notification = require("../controllers/notificationController");
const { authorize } = require("../middleware/auth");
const router = require("express").Router();

router.get("/list", notification.list);
router.put("/read", notification.markRead);
router.put("/read-all", notification.markAllRead);
router.put("/dismiss", notification.dismiss);
router.get("/unread-count", notification.unreadCount);
router.post("/broadcast", authorize("admin"), notification.broadcast);

module.exports = router;
