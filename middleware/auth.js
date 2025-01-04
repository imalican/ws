const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Bu işlem için admin yetkisi gerekiyor' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(403).json({ message: 'Geçersiz token' });
  }
};
