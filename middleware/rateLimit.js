const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 100, // Her IP için maksimum istek sayısı
  message: {
    error: "Çok fazla istek gönderildi, lütfen biraz bekleyin.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter };
