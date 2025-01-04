const Game = require('../models/Game');
const User = require('../models/User');
const Category = require('../models/Category');
const slugify = require('slugify');
const cloudinary = require('../config/cloudinary');
const NotificationService = require('./notificationService');

class GameService {
  async create(gameData, imageFile) {
    try {
      // Title validasyonu
      if (!gameData.title?.tr || !gameData.title?.en) {
        throw new Error('Title is required in both languages');
      }

      // instantLink validasyonu
      if (!gameData.instantLink) {
        throw new Error('instantLink is required');
      }

      // Kategori validasyonu
      if (!gameData.categories || gameData.categories.length === 0) {
        throw new Error('At least one category is required');
      }

      // Görsel validasyonu
      if (!imageFile) {
        throw new Error('Image is required');
      }

      // Görsel yükleme
      if (imageFile) {
        try {
          const base64Image = imageFile.buffer.toString('base64');
          const dataURI = `data:${imageFile.mimetype};base64,${base64Image}`;

          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'games',
            resource_type: 'auto',
            transformation: [{ width: 1200, height: 630, crop: 'fill' }],
          });
          gameData.image = result.secure_url;
        } catch (cloudinaryError) {
          console.error('Cloudinary Error:', cloudinaryError);
          throw new Error('Image upload failed: ' + cloudinaryError.message);
        }
      }

      // Slug oluşturma
      const baseSlugTR = slugify(gameData.title.tr, {
        lower: true,
        strict: true,
      });
      const baseSlugEN = slugify(gameData.title.en, {
        lower: true,
        strict: true,
      });

      let slugTR = baseSlugTR;
      let slugEN = `${baseSlugEN}-play`;
      let counter = 1;

      while (
        (await Game.exists({ 'slug.tr': slugTR })) ||
        (await Game.exists({ 'slug.en': slugEN }))
      ) {
        slugTR = `${baseSlugTR}-${counter}`;
        slugEN = `${baseSlugEN}-play-${counter}`;
        counter++;
      }

      // Varsayılan değerleri ayarla
      const gameToCreate = {
        ...gameData,
        slug: {
          tr: slugTR,
          en: slugEN,
        },
        isNew: gameData.isNew || false,
        isPopular: gameData.isPopular || false,
        isActive: gameData.isActive !== undefined ? gameData.isActive : true,
        orientation: gameData.orientation || 'horizontal',
        playCount: gameData.playCount || 0,
      };

      const game = await Game.create(gameToCreate);
      return game;
    } catch (error) {
      console.error('Game Creation Error:', error);
      throw error;
    }
  }

  async update(id, gameData, imageFile) {
    try {
      // Validasyonlar
      const errors = [];

      if (!gameData.title?.tr || !gameData.title?.en) {
        errors.push('Title is required in both languages');
      }

      if (!gameData.instantLink) {
        errors.push('iframe URL zorunludur');
      } else if (!isValidUrl(gameData.instantLink)) {
        errors.push(
          'Geçerli bir URL giriniz (http:// veya https:// ile başlamalı)'
        );
      }

      if (!Array.isArray(gameData.categories) || !gameData.categories.length) {
        errors.push('En az bir kategori seçilmelidir');
      }

      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }

      // Önce mevcut oyunu bulalım
      const existingGame = await Game.findById(id);
      if (!existingGame) {
        throw new Error('Oyun bulunamadı');
      }

      // Eğer yeni görsel yüklendiyse
      if (imageFile) {
        try {
          // Eski görseli sil
          if (existingGame.image) {
            const publicId = existingGame.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`games/${publicId}`);
          }

          // Yeni görseli yükle
          const base64Image = imageFile.buffer.toString('base64');
          const dataURI = `data:${imageFile.mimetype};base64,${base64Image}`;

          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'games',
            resource_type: 'auto',
            transformation: [{ width: 1200, height: 630, crop: 'fill' }],
          });

          gameData.image = result.secure_url;
        } catch (cloudinaryError) {
          console.error('Cloudinary Error:', cloudinaryError);
          throw new Error('Image upload failed: ' + cloudinaryError.message);
        }
      }

      // Eğer başlık değiştiyse yeni slug oluştur
      if (
        gameData.title.tr !== existingGame.title.tr ||
        gameData.title.en !== existingGame.title.en
      ) {
        const baseSlugTR = slugify(gameData.title.tr, {
          lower: true,
          strict: true,
        });
        const baseSlugEN = slugify(gameData.title.en, {
          lower: true,
          strict: true,
        });

        let slugTR = baseSlugTR;
        let slugEN = `${baseSlugEN}-play`;
        let counter = 1;

        while (
          (await Game.exists({ _id: { $ne: id }, 'slug.tr': slugTR })) ||
          (await Game.exists({ _id: { $ne: id }, 'slug.en': slugEN }))
        ) {
          slugTR = `${baseSlugTR}-${counter}`;
          slugEN = `${baseSlugEN}-play-${counter}`;
          counter++;
        }

        gameData.slug = { tr: slugTR, en: slugEN };
      }

      // Varsayılan değerleri ayarla
      const gameToUpdate = {
        ...gameData,
        isNew: gameData.isNew || false,
        isPopular: gameData.isPopular || false,
        isActive: gameData.isActive !== undefined ? gameData.isActive : true,
        orientation: gameData.orientation || 'horizontal',
        playCount: gameData.playCount || 0,
      };

      // Oyunu güncelle
      const updatedGame = await Game.findByIdAndUpdate(
        id,
        { $set: gameToUpdate },
        { new: true }
      ).populate('categories');

      return updatedGame;
    } catch (error) {
      console.error('Game Update Error:', error);
      throw error;
    }
  }

  async delete(id) {
    const game = await Game.findById(id);

    // Görseli sil
    if (game?.image) {
      const publicId = game.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`games/${publicId}`);
    }

    if (!game) {
      throw new Error('Oyun bulunamadı');
    }

    await game.deleteOne();
  }

  async getAll(language = 'tr', query = {}) {
    const filter = {};

    // Kategori filtresi
    if (query.category) {
      filter.categories = query.category;
    }

    return Game.find(filter)
      .populate('categories')
      .select(
        `title.${language} description.${language} meta.${language} keywords.${language} categories instantLink playCount image orientation isNew isPopular isActive order slug.${language}`
      )
      .sort('order');
  }

  async getById(id) {
    const game = await Game.findById(id).populate('categories');
    return game;
  }

  async getByIdAdmin(id) {
    const game = await Game.findById(id)
      .select(
        'title slug description keywords instantLink playCount categories isShowcased isNew isPopular isActive orientation image order'
      )
      .populate('categories');
    return game;
  }

  async getShowcased(language = 'tr') {
    return Game.find({ isShowcased: true })
      .limit(3)
      .select(`title.${language} slug.${language} instantLink`)
      .sort('-createdAt');
  }

  async incrementPlayCount(id) {
    const game = await Game.findByIdAndUpdate(
      id,
      { $inc: { playCount: 1 } },
      { new: true }
    );

    if (!game) {
      throw new Error('Oyun bulunamadı');
    }

    return game.playCount;
  }

  async getMostPlayed(limit = 10, language = 'tr') {
    return Game.find()
      .select(`title.${language} slug.${language} instantLink playCount`)
      .sort('-playCount')
      .limit(limit);
  }

  async updateCategoryOrder(categoryId, gameOrders) {
    // gameOrders = [{gameId: '...', order: 1}, {gameId: '...', order: 2}]
    const bulkOps = gameOrders.map(item => ({
      updateOne: {
        filter: { _id: item.gameId },
        update: {
          $set: {
            'categoryOrder.$[elem].order': item.order,
          },
        },
        arrayFilters: [{ 'elem.category': categoryId }],
      },
    }));

    await Game.bulkWrite(bulkOps);

    return this.getGamesByCategory(categoryId);
  }

  async getGamesByCategory(categoryId, language = 'tr') {
    return Game.find({ categories: categoryId })
      .select(
        `title.${language} slug.${language} image instantLink categoryOrder`
      )
      .sort({ 'categoryOrder.$[elem].order': 1 })
      .populate('categories', `name.${language}`)
      .collation({ locale: 'tr' });
  }

  async search(query, language = 'tr') {
    const searchRegex = new RegExp(query, 'i');

    return Game.find({
      $or: [
        { [`title.${language}`]: searchRegex },
        { [`description.${language}`]: searchRegex },
        { [`keywords.${language}`]: searchRegex },
      ],
    })
      .select(`title.${language} slug.${language} image instantLink`)
      .limit(10);
  }

  async playGame(gameId, userId) {
    try {
      // Oyunu bul
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Oyun bulunamadı');
      }

      // Oynanma sayısını artır
      game.playCount += 1;
      await game.save();

      // Kullanıcının son oynadığı oyunlara ekle
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          $push: {
            recentlyPlayed: {
              $each: [{ game: gameId }],
              $position: 0,
              $slice: 5, // Son 5 oyunu tut
            },
          },
        });
      }

      return game;
    } catch (error) {
      console.error('Play Game Error:', error);
      throw error;
    }
  }

  async reorder(gameId, newIndex) {
    try {
      const game = await Game.findById(gameId);
      if (!game) throw new Error('Oyun bulunamadı');

      // Tüm oyunları sırala
      const games = await Game.find().sort('order');

      // Oyunu listeden çıkar ve yeni konuma ekle
      const oldIndex = games.findIndex(g => g._id.toString() === gameId);
      games.splice(oldIndex, 1);
      games.splice(newIndex, 0, game);

      // Sıra numaralarını güncelle
      const bulkOps = games.map((game, index) => ({
        updateOne: {
          filter: { _id: game._id },
          update: { $set: { order: index } },
        },
      }));

      await Game.bulkWrite(bulkOps);

      return this.getAll();
    } catch (error) {
      console.error('Game reorder error:', error);
      throw error;
    }
  }

  async getBySlug(slug, language = 'tr') {
    const game = await Game.findOne({
      $or: [{ 'slug.tr': slug }, { 'slug.en': slug }],
    }).populate('categories');

    if (!game) {
      throw new Error('Oyun bulunamadı');
    }

    return game;
  }
}

// URL validasyonu için yardımcı fonksiyon
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

module.exports = new GameService();
