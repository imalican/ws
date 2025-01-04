const mongoose = require('mongoose');

// Eğer model zaten tanımlıysa, onu kullan
const Category =
  mongoose.models.Category ||
  mongoose.model(
    'Category',
    new mongoose.Schema(
      {
        name: {
          tr: { type: String, required: true },
          en: { type: String, required: true },
        },
        slug: {
          tr: { type: String, required: true, unique: true },
          en: { type: String, required: true, unique: true },
        },
        description: {
          tr: { type: String },
          en: { type: String },
        },
        keywords: {
          tr: [{ type: String }],
          en: [{ type: String }],
        },
        order: { type: Number, default: 0 },
        parent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category',
          default: null,
        },
        image: { type: String },
        isActive: { type: Boolean, default: true },
        isNewGames: { type: Boolean, default: false },
        isMostPlayed: { type: Boolean, default: false },
      },
      {
        timestamps: true,
      }
    )
  );

module.exports = Category;
