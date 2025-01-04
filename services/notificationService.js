const Notification = require("../models/Notification");
const User = require("../models/User");

class NotificationService {
  async createNotification(data) {
    const notification = await Notification.create(data);
    return notification;
  }

  async notifyNewGame(game) {
    // Tüm kullanıcılara bildirim gönder
    const users = await User.find();

    const notifications = users.map((user) => ({
      user: user._id,
      title: {
        tr: "Yeni Oyun Eklendi",
        en: "New Game Added",
      },
      message: {
        tr: `${game.title.tr} oyunu eklendi`,
        en: `${game.title.en} has been added`,
      },
      type: "NEW_GAME",
      relatedGame: game._id,
    }));

    await Notification.insertMany(notifications);
  }

  async notifyFavoriteCategory(game, category) {
    // Kategorinin favori olduğu kullanıcıları bul
    const users = await User.find({
      favoriteCategories: category._id,
    });

    const notifications = users.map((user) => ({
      user: user._id,
      title: {
        tr: "Favori Kategorinize Yeni Oyun",
        en: "New Game in Favorite Category",
      },
      message: {
        tr: `${category.name.tr} kategorisine ${game.title.tr} eklendi`,
        en: `${game.title.en} added to ${category.name.en}`,
      },
      type: "FAVORITE",
      relatedGame: game._id,
    }));

    await Notification.insertMany(notifications);
  }

  async getUserNotifications(userId, language = "tr") {
    return Notification.find({ user: userId })
      .select(`title.${language} message.${language} type isRead createdAt`)
      .populate("relatedGame", `title.${language} slug.${language}`)
      .sort("-createdAt");
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({
      user: userId,
      isRead: false,
    });
  }
}

module.exports = new NotificationService();
