const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const NotificationController = require("../controllers/notificationController");

router.get("/", auth, NotificationController.getNotifications);
router.get("/unread-count", auth, NotificationController.getUnreadCount);
router.put("/:id/read", auth, NotificationController.markAsRead);

module.exports = router;
