const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const postController = require('../controllers/postController');
const { auth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// @route   GET api/posts
// @desc    Lấy tất cả bài viết
// @access  Public
router.get('/', postController.getAllPosts);

// @route   GET api/posts/:id
// @desc    Lấy bài viết theo ID
// @access  Public
router.get('/:id', postController.getPostById);

// @route   GET api/posts/slug/:slug
// @desc    Lấy bài viết theo slug
// @access  Public
router.get('/slug/:slug', postController.getPostBySlug);

// @route   GET api/posts/category/:categoryId
// @desc    Lấy bài viết theo danh mục
// @access  Public
router.get('/category/:categoryId', postController.getPostsByCategory);

// @route   GET api/posts/category/slug/:categorySlug
// @desc    Lấy bài viết theo slug của danh mục
// @access  Public
router.get('/category/slug/:categorySlug', postController.getPostsByCategorySlug);

// @route   GET api/posts/user/me
// @desc    Lấy bài viết của người dùng hiện tại
// @access  Private
router.get('/user/me', auth, postController.getMyPosts);

// @route   POST api/posts
// @desc    Tạo bài viết mới
// @access  Private
router.post(
  '/',
  [
    auth,
    upload.single('thumbnail'),
    handleUploadError,
    [
      check('title', 'Tiêu đề là bắt buộc').not().isEmpty(),
      check('content', 'Nội dung là bắt buộc').not().isEmpty(),
      check('category_id', 'Danh mục là bắt buộc').isNumeric()
    ]
  ],
  postController.createPost
);

// @route   PUT api/posts/:id
// @desc    Cập nhật bài viết
// @access  Private
router.put(
  '/:id',
  [
    auth,
    upload.single('thumbnail'),
    handleUploadError,
    [
      check('title', 'Tiêu đề là bắt buộc').not().isEmpty(),
      check('content', 'Nội dung là bắt buộc').not().isEmpty(),
      check('category_id', 'Danh mục là bắt buộc').isNumeric()
    ]
  ],
  postController.updatePost
);

// @route   DELETE api/posts/:id
// @desc    Xóa bài viết
// @access  Private
router.delete('/:id', auth, postController.deletePost);

module.exports = router;
