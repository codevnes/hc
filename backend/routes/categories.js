const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/categories
// @desc    Lấy tất cả danh mục
// @access  Public
router.get('/', categoryController.getAllCategories);

// @route   GET api/categories/:id
// @desc    Lấy danh mục theo ID
// @access  Public
router.get('/:id', categoryController.getCategoryById);

// @route   GET api/categories/slug/:slug
// @desc    Lấy danh mục theo slug
// @access  Public
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// @route   POST api/categories
// @desc    Tạo danh mục mới
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    admin,
    [
      check('name', 'Tên danh mục là bắt buộc').not().isEmpty(),
      check('description', 'Mô tả danh mục là bắt buộc').not().isEmpty()
    ]
  ],
  categoryController.createCategory
);

// @route   PUT api/categories/:id
// @desc    Cập nhật danh mục
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    admin,
    [
      check('name', 'Tên danh mục là bắt buộc').not().isEmpty(),
      check('description', 'Mô tả danh mục là bắt buộc').not().isEmpty()
    ]
  ],
  categoryController.updateCategory
);

// @route   DELETE api/categories/:id
// @desc    Xóa danh mục
// @access  Private/Admin
router.delete('/:id', [auth, admin], categoryController.deleteCategory);

module.exports = router;
