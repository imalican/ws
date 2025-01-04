const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      tr: { type: String, required: true },
      en: { type: String, required: true },
    },
    message: {
      tr: { type: String, required: true },
      en: { type: String, required: true },
    },
    type: {
      type: String,
      enum: ["NEW_GAME", "GAME_UPDATE", "SYSTEM", "FAVORITE"],
      required: true,
    },
    relatedGame: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
