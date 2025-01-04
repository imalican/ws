const { validationResult } = require('express-validator');
const CategoryService = require('../services/categoryService');

class CategoryController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const categoryData = {
        ...req.body,
        isNewGames: req.body.isNewGames === 'true',
        isMostPlayed: req.body.isMostPlayed === 'true',
      };

      const category = await CategoryService.create(categoryData, req.file);
      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const categoryData = {
        ...req.body,
        isNewGames: req.body.isNewGames === 'true',
        isMostPlayed: req.body.isMostPlayed === 'true',
      };

      const category = await CategoryService.update(
        req.params.id,
        categoryData,
        req.file
      );
      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async delete(req, res) {
    try {
      await CategoryService.delete(req.params.id);
      res.json({ msg: 'Kategori başarıyla silindi' });
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const categories = await CategoryService.getAll();
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Sunucu hatası' });
    }
  }

  async getById(req, res) {
    try {
      const category = await CategoryService.getById(req.params.id);
      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(404).json({ msg: error.message });
    }
  }

  async getNewGames(req, res) {
    try {
      const language = req.query.lang || 'tr';
      const category = await CategoryService.getNewGames(language);
      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Sunucu hatası' });
    }
  }

  async getMostPlayed(req, res) {
    try {
      const language = req.query.lang || 'tr';
      const category = await CategoryService.getMostPlayed(language);
      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Sunucu hatası' });
    }
  }

  async reorder(req, res) {
    try {
      const { newIndex, parentId } = req.body;
      const categories = await CategoryService.reorderCategory(
        req.params.id,
        newIndex,
        parentId
      );
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }

  async move(req, res) {
    try {
      const { newParentId, newIndex } = req.body;
      const categories = await CategoryService.moveCategory(
        req.params.id,
        newParentId,
        newIndex
      );
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(400).json({ msg: error.message });
    }
  }
}

module.exports = new CategoryController();
