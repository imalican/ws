const { validationResult } = require('express-validator');
const AuthService = require('../services/authService');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const token = await AuthService.register(req.body);
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Kullanıcı bulunamadı' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Geçersiz şifre' });
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  }

  async googleCallback(req, res) {
    try {
      const token = await AuthService.loginWithSocialMedia(req.user, 'google');
      // Popup için HTML sayfası döndür
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ token: '${token}' }, 'http://localhost:3000');
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error(error);
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ error: 'Giriş başarısız' }, 'http://localhost:3000');
              window.close();
            </script>
          </body>
        </html>
      `);
    }
  }

  async facebookCallback(req, res) {
    try {
      const token = await AuthService.loginWithSocialMedia(
        req.user,
        'facebook'
      );
      // Popup için HTML sayfası döndür
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ token: '${token}' }, 'http://localhost:3000');
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error(error);
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ error: 'Giriş başarısız' }, 'http://localhost:3000');
              window.close();
            </script>
          </body>
        </html>
      `);
    }
  }
}

module.exports = new AuthController();
