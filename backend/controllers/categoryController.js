const Category = require('../models/Category');
const { validationResult } = require('express-validator');

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy danh mục theo ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy danh mục theo slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, slug } = req.body;

  try {
    // Tạo danh mục mới
    const category = await Category.create({
      name,
      description,
      slug
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, slug } = req.body;

  try {
    // Kiểm tra xem danh mục có tồn tại không
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    // Cập nhật danh mục
    const updated = await Category.update(req.params.id, {
      name,
      description,
      slug
    });

    if (!updated) {
      return res.status(500).json({ message: 'Không thể cập nhật danh mục' });
    }

    res.json({ message: 'Cập nhật danh mục thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    // Kiểm tra xem danh mục có tồn tại không
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    // Xóa danh mục
    const deleted = await Category.delete(req.params.id);

    if (!deleted) {
      return res.status(500).json({ message: 'Không thể xóa danh mục' });
    }

    res.json({ message: 'Xóa danh mục thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};
