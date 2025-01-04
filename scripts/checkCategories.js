const mongoose = require('mongoose');
require('dotenv').config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    const Category = require('../models/Category');
    const categories = await Category.find();
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
