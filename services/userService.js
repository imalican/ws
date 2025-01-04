const User = require("../models/User");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");

class UserService {
  async updateProfile(userId, userData) {
    const updates = {};

    if (userData.name) {
      updates.name = userData.name;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }

    return user;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error("Mevcut şifre hatalı");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return { message: "Şifre başarıyla güncellendi" };
  }

  async updateAvatar(userId, file) {
    try {
      if (!file) {
        throw new Error("Avatar dosyası gerekli");
      }

      // Cloudinary'ye yükle
      const base64Image = file.buffer.toString("base64");
      const dataURI = `data:${file.mimetype};base64,${base64Image}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "avatars",
        resource_type: "auto",
        transformation: [{ width: 250, height: 250, crop: "fill" }],
      });

      // Eski avatarı sil (default avatar değilse)
      const user = await User.findById(userId);
      if (user.avatar && !user.avatar.includes("default-avatar")) {
        const publicId = user.avatar.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`avatars/${publicId}`);
      }

      // Yeni avatarı kaydet
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { avatar: result.secure_url } },
        { new: true }
      ).select("-password");

      return updatedUser;
    } catch (error) {
      console.error("Avatar Update Error:", error);
      throw error;
    }
  }

  async addToFavorites(userId, gameId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: gameId } },
      { new: true }
    ).populate("favorites");

    return user.favorites;
  }

  async removeFromFavorites(userId, gameId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: gameId } },
      { new: true }
    ).populate("favorites");

    return user.favorites;
  }

  async getFavorites(userId) {
    const user = await User.findById(userId)
      .populate("favorites")
      .select("favorites");

    return user.favorites;
  }

  async getRecentGames(userId, language = "tr") {
    const user = await User.findById(userId)
      .populate({
        path: "recentlyPlayed.game",
        select: `title.${language} slug.${language} image instantLink`,
      })
      .select("recentlyPlayed");

    return user.recentlyPlayed;
  }

  async getProfile(userId, language = "tr") {
    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "recentlyPlayed.game",
        select: `title.${language} slug.${language} image instantLink`,
      })
      .populate({
        path: "favorites",
        select: `title.${language} slug.${language} image instantLink`,
      });

    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      recentlyPlayed: user.recentlyPlayed,
      favorites: user.favorites,
    };
  }
}

module.exports = new UserService();
