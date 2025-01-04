const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { categoryValidators } = require('../middleware/validators');
const CategoryController = require('../controllers/categoryController');
const upload = require('../middleware/upload');

// Test endpoint'i en üste ekleyelim
router.get('/test', (req, res) => {
  res.json({ message: 'Category route is working' });
});

// Public routes
router.get('/', CategoryController.getAll);
router.get('/new-games', CategoryController.getNewGames);
router.get('/most-played', CategoryController.getMostPlayed);
router.get('/:id', CategoryController.getById);

// Protected routes (admin only)
router.post(
  '/',
  [auth, upload.single('image'), categoryValidators.create],
  CategoryController.create
);

router.put(
  '/:id',
  [auth, upload.single('image'), categoryValidators.update],
  CategoryController.update
);

router.delete('/:id', auth, CategoryController.delete);

router.put('/:id/reorder', auth, CategoryController.reorder);

module.exports = router;
