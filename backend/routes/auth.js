const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Đăng ký người dùng mới
// @access  Public
router.post(
  '/register',
  [
    check('username', 'Vui lòng nhập tên đăng nhập').not().isEmpty(),
    check('email', 'Vui lòng nhập email hợp lệ').isEmail(),
    check('password', 'Mật khẩu phải có ít nhất 6 ký tự').isLength({ min: 6 })
  ],
  authController.register
);

// @route   POST api/auth/login
// @desc    Đăng nhập và lấy token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Vui lòng nhập email hợp lệ').isEmail(),
    check('password', 'Mật khẩu là bắt buộc').exists()
  ],
  authController.login
);

// @route   GET api/auth/me
// @desc    Lấy thông tin người dùng hiện tại
// @access  Private
router.get('/me', auth, authController.getMe);

module.exports = router;
