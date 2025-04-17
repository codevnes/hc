const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/users
// @desc    Lấy tất cả người dùng
// @access  Private/Admin
router.get('/', [auth, admin], userController.getAllUsers);

// @route   GET api/users/:id
// @desc    Lấy thông tin người dùng theo ID
// @access  Private/Admin
router.get('/:id', [auth, admin], userController.getUserById);

// @route   PUT api/users/:id
// @desc    Cập nhật thông tin người dùng
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    admin,
    [
      check('username', 'Vui lòng nhập tên đăng nhập').not().isEmpty(),
      check('email', 'Vui lòng nhập email hợp lệ').isEmail(),
      check('role', 'Vai trò phải là admin hoặc user').isIn(['admin', 'user'])
    ]
  ],
  userController.updateUser
);

// @route   PUT api/users/:id/password
// @desc    Cập nhật mật khẩu người dùng
// @access  Private/Admin
router.put(
  '/:id/password',
  [
    auth,
    admin,
    [
      check('password', 'Mật khẩu phải có ít nhất 6 ký tự').isLength({ min: 6 })
    ]
  ],
  userController.updatePassword
);

// @route   DELETE api/users/:id
// @desc    Xóa người dùng
// @access  Private/Admin
router.delete('/:id', [auth, admin], userController.deleteUser);

module.exports = router;
