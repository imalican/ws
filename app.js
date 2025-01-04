const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimit');
const auth = require('./middleware/auth');
const admin = require('./middleware/admin');

// Önce modelleri import et
require('./models/Category');
require('./models/Game');

// Sonra route'ları import et
const categoryRoutes = require('./routes/category');
const gameRoutes = require('./routes/game');

// Passport config
require('./config/passport');

const app = express();

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://api.jellyarcade.com',
        'https://jellyarcade.com',
        'https://www.jellyarcade.com',
        'https://admin.jellyarcade.com',
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(helmet());
app.use('/api', apiLimiter);

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/games', require('./routes/game'));
app.use('/api/users', require('./routes/user'));
app.use('/api/notifications', require('./routes/notification'));

// Test için yeni bir endpoint ekleyelim
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Bir şeyler ters gitti!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: 'Sayfa bulunamadı' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
