const express = require('express');
const router = express.Router();
const passport = require('passport');
const { check } = require('express-validator');
const AuthController = require('../controllers/authController');
const jwt = require('jsonwebtoken');

// Validation middleware
const registerValidation = [
  check('name', 'İsim alanı zorunludur').not().isEmpty(),
  check('email', 'Geçerli bir email adresi giriniz').isEmail(),
  check('password', 'Şifre en az 6 karakter olmalıdır').isLength({ min: 6 }),
];

// Routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).json({ msg: info.message });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  })(req, res, next);
});

// Google Auth Routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  AuthController.googleCallback
);

// Facebook Auth Routes
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  AuthController.facebookCallback
);

module.exports = router;
