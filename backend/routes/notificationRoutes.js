/** Notification inbox API routes. */
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const loadUser = require("../middleware/loadUserMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  adminDeliveryLog,
  adminInsights,
} = require("../controllers/notificationController");

const router = express.Router();
router.use(authMiddleware, loadUser);

router.get("/admin/delivery-log", requireAdmin, adminDeliveryLog);
router.get("/admin/insights", requireAdmin, adminInsights);
router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

module.exports = router;
