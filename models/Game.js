const mongoose = require('mongoose');
const Category = require('./Category');

const gameSchema = new mongoose.Schema(
  {
    title: {
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
      tr: [String],
      en: [String],
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
      },
    ],
    instantLink: {
      type: String,
      required: true,
    },
    isShowcased: {
      type: Boolean,
      default: false,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      required: true,
    },
    categoryOrder: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    orientation: {
      type: String,
      enum: ['horizontal', 'vertical'],
      default: 'horizontal',
    },
    isNew: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Sıralama için index
gameSchema.index({ 'categoryOrder.$*': 1 });

module.exports = mongoose.models.Game || mongoose.model('Game', gameSchema);
