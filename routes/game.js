const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { gameValidators } = require('../middleware/validators');
const GameController = require('../controllers/gameController');
const upload = require('../middleware/upload');
const admin = require('../middleware/admin');

// Public routes
router.get('/', GameController.getAll);
router.get('/showcased', GameController.getShowcased);
router.get('/most-played', GameController.getMostPlayed);
router.get('/search', GameController.search);

// Slug route'u (spesifik route'lar önce gelmeli)
router.get('/by-slug/:slug', GameController.getBySlug);

// ID ile oyun getirme
router.get('/:id', GameController.getById);

// Sıralama route'u
router.put(
  '/order',
  [auth, admin, gameValidators.order],
  GameController.updateOrder
);

router.put(
  '/category/:categoryId/order',
  [auth, admin, gameValidators.order],
  GameController.updateCategoryOrder
);

// Auth required routes
router.post('/:id/play', auth, GameController.playGame);

// Admin required routes
router.post(
  '/',
  auth,
  upload.single('image'),
  gameValidators.create,
  GameController.create
);

router.put(
  '/:id',
  auth,
  upload.single('image'),
  gameValidators.update,
  GameController.update
);

router.delete('/:id', [auth, admin], GameController.delete);

module.exports = router;
