const { validationResult } = require("express-validator");
const UserService = require("../services/userService");

class UserController {
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await UserService.updateProfile(req.user.userId, req.body);
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await UserService.changePassword(
        req.user.userId,
        req.body.oldPassword,
        req.body.newPassword
      );
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async updateAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: "Resim yüklenmedi" });
      }

      const user = await UserService.updateAvatar(req.user.userId, req.file);
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async addToFavorites(req, res) {
    try {
      const favorites = await UserService.addToFavorites(
        req.user.userId,
        req.params.gameId
      );
      res.json(favorites);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async removeFromFavorites(req, res) {
    try {
      const favorites = await UserService.removeFromFavorites(
        req.user.userId,
        req.params.gameId
      );
      res.json(favorites);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async getFavorites(req, res) {
    try {
      const favorites = await UserService.getFavorites(req.user.userId);
      res.json(favorites);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async getRecentGames(req, res) {
    try {
      const language = req.query.lang || "tr";
      const games = await UserService.getRecentGames(req.user.userId, language);
      res.json(games);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Sunucu hatası" });
    }
  }

  async getProfile(req, res) {
    try {
      const language = req.query.lang || "tr";
      const profile = await UserService.getProfile(req.user.userId, language);
      res.json(profile);
    } catch (error) {
      console.error(error);
      res.status(404).json({ msg: error.message });
    }
  }
}

module.exports = new UserController();
