const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { userValidators } = require('../middleware/validators');
const UserController = require('../controllers/userController');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Tüm rotalar auth middleware'i gerektirir
router.use(auth);

// Profile routes
router.put(
  '/profile',
  userValidators.updateProfile,
  UserController.updateProfile
);
router.put(
  '/password',
  userValidators.changePassword,
  UserController.changePassword
);
router.put('/avatar', upload.single('avatar'), UserController.updateAvatar);
router.get('/profile', auth, UserController.getProfile);

// Favorites routes
router.get('/favorites', UserController.getFavorites);
router.post('/favorites/:gameId', UserController.addToFavorites);
router.delete('/favorites/:gameId', UserController.removeFromFavorites);

// Son oynanan oyunlar
router.get('/recent-games', auth, UserController.getRecentGames);

router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

// Şifre güncelleme endpoint'i
router.put('/:id/password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
    }

    // Sadece admin veya kullanıcının kendisi şifre değiştirebilir
    if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({ msg: 'Bu işlem için yetkiniz yok' });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.json({ msg: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Sunucu hatası' });
  }
});

module.exports = router;
