const { validationResult } = require('express-validator');
const GameService = require('../services/gameService');
const Category = require('../models/Category');
const Game = require('../models/Game');

// Yardımcı fonksiyon ekleyelim
function parseCategories(categories) {
  if (Array.isArray(categories)) {
    return categories;
  }
  try {
    const parsed = JSON.parse(categories || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

class GameController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // FormData'dan gelen verileri parse et
      const gameData = {
        title: {
          tr: req.body['title.tr'],
          en: req.body['title.en'],
        },
        description: {
          tr: req.body['description.tr'],
          en: req.body['description.en'],
        },
        keywords: {
          tr: JSON.parse(req.body['keywords.tr'] || '[]'),
          en: JSON.parse(req.body['keywords.en'] || '[]'),
        },
        // Kategorileri standardize edilmiş şekilde al
        categories: parseCategories(req.body.categories),
        instantLink: req.body.instantLink,
        orientation: req.body.orientation || 'horizontal',
        isNew: req.body.isNew === 'true',
        isPopular: req.body.isPopular === 'true',
        isActive: req.body.isActive === 'true',
        playCount: parseInt(req.body.playCount || '0'),
      };

      const game = await GameService.create(gameData, req.file);
      res.status(201).json(game);
    } catch (error) {
      console.error('Game Creation Error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // FormData'dan gelen verileri parse et
      const gameData = {
        title: {
          tr: req.body['title.tr'],
          en: req.body['title.en'],
        },
        description: {
          tr: req.body['description.tr'],
          en: req.body['description.en'],
        },
        keywords: {
          tr: JSON.parse(req.body['keywords.tr'] || '[]'),
          en: JSON.parse(req.body['keywords.en'] || '[]'),
        },
        categories: parseCategories(req.body.categories),
        instantLink: req.body.instantLink,
        orientation: req.body.orientation || 'horizontal',
        isNew: req.body.isNew === 'true',
        isPopular: req.body.isPopular === 'true',
        isActive: req.body.isActive === 'true',
        playCount: parseInt(req.body.playCount || '0'),
      };

      // Kategorileri kontrol et
      if (!gameData.categories || gameData.categories.length === 0) {
        return res
          .status(400)
          .json({ message: 'En az bir kategori seçilmelidir' });
      }

      const game = await GameService.update(req.params.id, gameData, req.file);
      res.json(game);
    } catch (error) {
      console.error('Game Update Error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await GameService.delete(req.params.id);
      res.json({ msg: 'Oyun başarıyla silindi' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const language = req.query.lang || 'tr';
      const games = await GameService.getAll(language, req.query);
      res.json(games);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Sunucu hatası' });
    }
  }

  async getById(req, res) {
    try {
      const game = await GameService.getById(req.params.id);
      if (!game) {
        return res.status(404).json({ msg: 'Oyun bulunamadı' });
      }
      console.log('Game', game);
      res.json(game);
    } catch (error) {
      console.error(error);
      res.status(404).json({ msg: error.message });
    }
  }

  async getByIdAdmin(req, res) {
    try {
      const game = await GameService.getByIdAdmin(req.params.id);
      if (!game) {
        return res.status(404).json({ msg: 'Oyun bulunamadı' });
      }
      res.json(game);
    } catch (error) {
      console.error(error);
      res.status(404).json({ msg: error.message });
    }
  }

  async getShowcased(req, res) {
    try {
      const language = req.query.lang || 'tr';
      const games = await GameService.getShowcased(language);
      res.json(games);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Sunucu hatası' });
    }
  }

  async playGame(req, res) {
    try {
      const game = await GameService.playGame(req.params.id, req.user?.userId);
      res.json({
        playCount: game.playCount,
        message: 'Oyun başarıyla kaydedildi',
      });
    } catch (error) {
      console.error(error);
      res.status(404).json({ msg: error.message });
    }
  }

  async getMostPlayed(req, res) {
    try {
      const language = req.query.lang || 'tr';
      const limit = parseInt(req.query.limit) || 10;
      const games = await GameService.getMostPlayed(limit, language);
      res.json(games);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Sunucu hatası' });
    }
  }

  async updateCategoryOrder(req, res) {
    try {
      const { categoryId } = req.params;
      const { gameOrders } = req.body;

      // Validasyon kontrolü
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Kategoriyi kontrol et
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı' });
      }

      // Oyunları güncelle
      const bulkOps = gameOrders.map(({ gameId, order }) => ({
        updateOne: {
          filter: { _id: gameId, categories: categoryId },
          update: { $set: { [`categoryOrder.${categoryId}`]: order } },
        },
      }));

      await Game.bulkWrite(bulkOps);

      // Güncellenmiş oyunları getir
      const games = await Game.find({ categories: categoryId })
        .sort({ [`categoryOrder.${categoryId}`]: 1 })
        .populate('categories');

      res.json(games);
    } catch (error) {
      console.error('Update Category Order Error:', error);
      res.status(500).json({ message: 'Sıralama güncellenirken hata oluştu' });
    }
  }

  async search(req, res) {
    try {
      const { q, lang = 'tr' } = req.query;
      if (!q) {
        return res.status(400).json({ msg: 'Arama terimi gerekli' });
      }

      const games = await GameService.search(q, lang);
      res.json(games);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Sunucu hatası' });
    }
  }

  async updateOrder(req, res) {
    try {
      const { gameOrders } = req.body;

      // Validasyon kontrolü
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Oyunları güncelle
      const bulkOps = gameOrders.map(({ gameId, order }) => ({
        updateOne: {
          filter: { _id: gameId },
          update: { $set: { order } },
        },
      }));

      await Game.bulkWrite(bulkOps);

      // Güncellenmiş oyunları getir
      const games = await Game.find().sort('order').populate('categories');

      res.json(games);
    } catch (error) {
      console.error('Update Order Error:', error);
      res.status(500).json({ message: 'Sıralama güncellenirken hata oluştu' });
    }
  }

  async getBySlug(req, res) {
    try {
      const language = req.query.lang || 'tr';
      const game = await GameService.getBySlug(req.params.slug, language);
      res.json(game);
    } catch (error) {
      console.error(error);
      res.status(404).json({ msg: error.message });
    }
  }
}

module.exports = new GameController();
