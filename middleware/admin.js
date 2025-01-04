module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ msg: 'Bu işlem için admin yetkisi gerekiyor' });
  }
  next();
};
