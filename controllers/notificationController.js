const NotificationService = require("../services/notificationService");

class NotificationController {
  async getNotifications(req, res) {
    try {
      const language = req.query.lang || "tr";
      const notifications = await NotificationService.getUserNotifications(
        req.user.userId,
        language
      );
      res.json(notifications);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Sunucu hatası" });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const count = await NotificationService.getUnreadCount(req.user.userId);
      res.json({ count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Sunucu hatası" });
    }
  }

  async markAsRead(req, res) {
    try {
      const notification = await NotificationService.markAsRead(
        req.params.id,
        req.user.userId
      );
      res.json(notification);
    } catch (error) {
      console.error(error);
      res.status(404).json({ msg: error.message });
    }
  }
}

module.exports = new NotificationController();
