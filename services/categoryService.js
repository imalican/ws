const Category = require('../models/Category');
const slugify = require('slugify');
const cloudinary = require('../config/cloudinary');

class CategoryService {
  async create(categoryData, imageFile) {
    try {
      // Validasyonlar
      if (
        !categoryData.name ||
        !categoryData.name.tr ||
        !categoryData.name.en
      ) {
        throw new Error('Name is required in both languages');
      }

      // Aynı parent altındaki en yüksek sıra numarasını bul
      const maxOrder = await Category.findOne({ parent: categoryData.parent })
        .sort('-order')
        .select('order');

      // Yeni kategori için sıra numarası belirle
      categoryData.order = maxOrder ? maxOrder.order + 1 : 0;

      // Görsel yükleme
      if (imageFile) {
        try {
          const base64Image = imageFile.buffer.toString('base64');
          const dataURI = `data:${imageFile.mimetype};base64,${base64Image}`;

          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'categories',
            resource_type: 'auto',
            transformation: [{ width: 800, height: 400, crop: 'fill' }],
          });

          categoryData.image = result.secure_url;
        } catch (cloudinaryError) {
          console.error('Cloudinary Error:', cloudinaryError);
          throw new Error('Image upload failed: ' + cloudinaryError.message);
        }
      }

      // Slugları oluştur
      const slugTR = slugify(categoryData.name.tr, {
        lower: true,
        strict: true,
      });
      const slugEN = slugify(categoryData.name.en, {
        lower: true,
        strict: true,
      });

      // Boolean alanları kontrol et
      categoryData.isNewGames = categoryData.isNewGames || false;
      categoryData.isMostPlayed = categoryData.isMostPlayed || false;
      categoryData.isActive = categoryData.isActive !== false; // varsayılan true

      // Description ve keywords alanlarını kontrol et
      if (!categoryData.description) {
        categoryData.description = { tr: '', en: '' };
      }
      if (!categoryData.keywords) {
        categoryData.keywords = { tr: [], en: [] };
      }

      const category = await Category.create({
        ...categoryData,
        slug: {
          tr: slugTR,
          en: slugEN,
        },
      });

      return category;
    } catch (error) {
      console.error('Category Creation Error:', error);
      throw error;
    }
  }

  async update(id, categoryData, imageFile) {
    try {
      // Mevcut kategoriyi bul
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        throw new Error('Kategori bulunamadı');
      }

      // Görsel yükleme
      if (imageFile) {
        try {
          // Eski görseli sil
          if (existingCategory.image) {
            const publicId = existingCategory.image
              .split('/')
              .pop()
              .split('.')[0];
            await cloudinary.uploader.destroy(`categories/${publicId}`);
          }

          // Yeni görseli yükle
          const base64Image = imageFile.buffer.toString('base64');
          const dataURI = `data:${imageFile.mimetype};base64,${base64Image}`;

          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'categories',
            resource_type: 'auto',
            transformation: [{ width: 800, height: 400, crop: 'fill' }],
          });

          categoryData.image = result.secure_url;
        } catch (cloudinaryError) {
          console.error('Cloudinary Error:', cloudinaryError);
          throw new Error('Image upload failed: ' + cloudinaryError.message);
        }
      }

      // Slug güncelleme
      if (categoryData.name) {
        categoryData.slug = {
          tr: slugify(categoryData.name.tr, { lower: true, strict: true }),
          en: slugify(categoryData.name.en, { lower: true, strict: true }),
        };
      }

      // Boolean alanları kontrol et
      if ('isNewGames' in categoryData) {
        categoryData.isNewGames = categoryData.isNewGames === true;
      }
      if ('isMostPlayed' in categoryData) {
        categoryData.isMostPlayed = categoryData.isMostPlayed === true;
      }
      if ('isActive' in categoryData) {
        categoryData.isActive = categoryData.isActive === true;
      }

      // Description ve keywords alanlarını kontrol et
      if (categoryData.description) {
        categoryData.description = {
          tr:
            categoryData.description.tr ||
            existingCategory.description?.tr ||
            '',
          en:
            categoryData.description.en ||
            existingCategory.description?.en ||
            '',
        };
      }
      if (categoryData.keywords) {
        categoryData.keywords = {
          tr: categoryData.keywords.tr || existingCategory.keywords?.tr || [],
          en: categoryData.keywords.en || existingCategory.keywords?.en || [],
        };
      }

      const category = await Category.findByIdAndUpdate(
        id,
        { $set: categoryData },
        { new: true }
      );

      return category;
    } catch (error) {
      console.error('Category Update Error:', error);
      throw error;
    }
  }

  async delete(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new Error('Kategori bulunamadı');
    }

    // Alt kategorileri kontrol et
    const hasChildren = await Category.exists({ parent: id });
    if (hasChildren) {
      throw new Error(
        'Bu kategorinin alt kategorileri var. Önce onları silmelisiniz.'
      );
    }

    // Görseli sil
    if (category.image) {
      const publicId = category.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`categories/${publicId}`);
    }

    await category.deleteOne();
  }

  async getAll() {
    return Category.find().sort('order').select(`
        name
        slug
        description
        keywords
        image
        order
        parent
        isNewGames
        isMostPlayed
        isActive
      `);
  }

  async getById(id) {
    const category = await Category.findById(id).select(`
      name
      slug
      description
      keywords
      image
      order
      parent
      isNewGames
      isMostPlayed
      isActive
    `);

    if (!category) {
      throw new Error('Kategori bulunamadı');
    }

    return category;
  }

  async getNewGames(language = 'tr') {
    return Category.findOne({ isNewGames: true }).select(`
      name.${language}
      slug.${language}
      description.${language}
      keywords.${language}
      image
    `);
  }

  async getMostPlayed(language = 'tr') {
    return Category.findOne({ isMostPlayed: true }).select(`
      name.${language}
      slug.${language}
      description.${language}
      keywords.${language}
      image
    `);
  }

  // Yardımcı metod: Kategorileri ağaç yapısına dönüştür
  buildCategoryTree(categories, parentId = null) {
    const tree = [];

    for (const category of categories) {
      // parent null kontrolü için özel kontrol ekleyelim
      const categoryParentId = category.parent
        ? category.parent.toString()
        : null;
      const currentParentId = parentId ? parentId.toString() : null;

      if (categoryParentId === currentParentId) {
        // Kategori nesnesini klonlayalım
        const categoryNode = {
          ...category.toObject(),
          children: [],
        };

        // Alt kategorileri recursive olarak ekleyelim
        const children = this.buildCategoryTree(categories, category._id);
        if (children.length > 0) {
          categoryNode.children = children;
        }

        tree.push(categoryNode);
      }
    }

    return tree;
  }

  async reorderCategory(categoryId, newIndex, parentId) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Kategori bulunamadı');
      }

      // Aynı parent altındaki tüm kategorileri al
      const siblings = await Category.find({ parent: parentId }).sort('order');

      // Kategorileri yeniden sırala
      const categories = Array.from(siblings);
      const [movedCategory] = categories.filter(
        cat => cat._id.toString() === categoryId
      );
      const remainingCategories = categories.filter(
        cat => cat._id.toString() !== categoryId
      );

      remainingCategories.splice(newIndex, 0, movedCategory);

      // Sıralama numaralarını güncelle
      const updateOperations = remainingCategories.map((cat, index) => ({
        updateOne: {
          filter: { _id: cat._id },
          update: { $set: { order: index } },
        },
      }));

      await Category.bulkWrite(updateOperations);

      return this.getAll();
    } catch (error) {
      console.error('Category reordering error:', error);
      throw error;
    }
  }

  async moveCategory(categoryId, newParentId, newIndex) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Kategori bulunamadı');
      }

      // Yeni parent'ın geçerli olduğunu kontrol et
      if (newParentId) {
        const parentCategory = await Category.findById(newParentId);
        if (!parentCategory) {
          throw new Error('Hedef kategori bulunamadı');
        }

        // Döngüsel parent-child ilişkisini engelle
        let currentParent = parentCategory;
        while (currentParent.parent) {
          if (currentParent.parent.toString() === categoryId) {
            throw new Error('Döngüsel kategori ilişkisi oluşturulamaz');
          }
          currentParent = await Category.findById(currentParent.parent);
        }
      }

      // Hedef konumdaki kategorileri al
      const targetSiblings = await Category.find({ parent: newParentId }).sort(
        'order'
      );

      // Kategoriyi yeni konumuna taşı
      const updatedCategories = Array.from(targetSiblings);
      updatedCategories.splice(newIndex, 0, category);

      // Sıralama numaralarını güncelle
      const updateOperations = updatedCategories.map((cat, index) => ({
        updateOne: {
          filter: { _id: cat._id },
          update: { $set: { order: index } },
        },
      }));

      // Kategoriyi yeni parent'a taşı ve sıralamaları güncelle
      await Category.findByIdAndUpdate(categoryId, {
        parent: newParentId,
        order: newIndex,
      });
      await Category.bulkWrite(updateOperations);

      return this.getAll();
    } catch (error) {
      console.error('Category moving error:', error);
      throw error;
    }
  }
}

module.exports = new CategoryService();
