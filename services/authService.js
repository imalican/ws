const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  async register(userData) {
    const { name, email, password } = userData;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Bu email adresi zaten kayıtlı');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    return this.generateToken(user.id);
  }

  async loginWithSocialMedia(profile, provider) {
    const searchQuery = provider === 'google' 
      ? { googleId: profile.id }
      : { facebookId: profile.id };

    let user = await User.findOne(searchQuery);
    
    if (!user) {
      user = await User.create({
        [provider + 'Id']: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value
      });
    }

    return this.generateToken(user.id);
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
  }
}

module.exports = new AuthService(); 