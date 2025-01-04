const { check } = require('express-validator');

const authValidators = {
  register: [
    check('name', 'İsim alanı zorunludur').not().isEmpty(),
    check('email', 'Geçerli bir email adresi giriniz').isEmail(),
    check('password', 'Şifre en az 6 karakter olmalıdır').isLength({ min: 6 }),
  ],
};

const categoryValidators = {
  create: [
    check('name.tr', 'Türkçe kategori adı zorunludur').not().isEmpty(),
    check('name.en', 'İngilizce kategori adı zorunludur').not().isEmpty(),
    check('order', 'Sıralama sayı olmalıdır').optional().isNumeric(),
    check('parent', 'Geçersiz parent ID').optional().isMongoId(),
  ],
  update: [
    check('name.tr', 'Türkçe kategori adı zorunludur')
      .optional()
      .not()
      .isEmpty(),
    check('name.en', 'İngilizce kategori adı zorunludur')
      .optional()
      .not()
      .isEmpty(),
    check('order', 'Sıralama sayı olmalıdır').optional().isNumeric(),
    check('parent', 'Geçersiz parent ID').optional().isMongoId(),
  ],
};

const gameValidators = {
  create: [
    check('title.tr', 'Türkçe başlık zorunludur').notEmpty(),
    check('title.en', 'İngilizce başlık zorunludur').notEmpty(),
    check('instantLink', 'iframe URL zorunludur').notEmpty(),
    check('categories')
      .custom((value, { req }) => {
        try {
          const categories = Array.isArray(value) ? value : JSON.parse(value);
          return categories && categories.length > 0;
        } catch {
          return false;
        }
      })
      .withMessage('En az bir kategori seçilmelidir'),
  ],
  update: [
    check('title.tr', 'Türkçe başlık zorunludur').notEmpty(),
    check('title.en', 'İngilizce başlık zorunludur').notEmpty(),
    check('instantLink', 'iframe URL zorunludur').notEmpty(),
    check('categories')
      .custom((value, { req }) => {
        try {
          const categories = Array.isArray(value) ? value : JSON.parse(value);
          return categories && categories.length > 0;
        } catch {
          return false;
        }
      })
      .withMessage('En az bir kategori seçilmelidir'),
  ],
  order: [
    check('gameOrders')
      .isArray()
      .withMessage('Oyun sıralaması array olmalıdır')
      .notEmpty()
      .withMessage('Oyun sıralaması boş olamaz'),
    check('gameOrders.*.gameId').isMongoId().withMessage('Geçersiz oyun ID'),
    check('gameOrders.*.order')
      .isInt({ min: 0 })
      .withMessage('Sıralama 0 veya daha büyük bir sayı olmalıdır'),
  ],
};

const userValidators = {
  updateProfile: [
    check('name', 'İsim alanı zorunludur').optional().not().isEmpty(),
  ],
  changePassword: [
    check('oldPassword', 'Mevcut şifre zorunludur').not().isEmpty(),
    check('newPassword', 'Yeni şifre en az 6 karakter olmalıdır').isLength({
      min: 6,
    }),
  ],
};

module.exports = {
  authValidators,
  categoryValidators,
  gameValidators,
  userValidators,
};
