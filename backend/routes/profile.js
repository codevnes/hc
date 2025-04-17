const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { auth } = require('../middleware/auth');

// @route   GET api/profile/:symbol
// @desc    Lấy tất cả dữ liệu từ stock_info, stock_daily và stock_eps cho một mã chứng khoán
// @access  Private
router.get('/:symbol', profileController.getProfileBySymbol);

module.exports = router; 