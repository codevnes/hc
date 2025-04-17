const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stockDailyController = require('../controllers/stockDailyController');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/stock-daily
// @desc    Lấy tất cả stock_daily
// @access  Private
router.get('/', auth, stockDailyController.getAllStockDaily);

// @route   GET api/stock-daily/symbol/:symbol
// @desc    Lấy stock_daily theo symbol
// @access  Private
router.get('/symbol/:symbol', auth, stockDailyController.getStockDailyBySymbol);

// @route   GET api/stock-daily/id/:id
// @desc    Lấy stock_daily theo ID
// @access  Private
router.get('/id/:id', auth, stockDailyController.getStockDailyById);

// @route   POST api/stock-daily
// @desc    Tạo stock_daily mới
// @access  Private (Admin)
router.post('/', [
  auth,
  admin,
  check('symbol', 'Symbol là bắt buộc').notEmpty(),
  check('close_price', 'Close price là bắt buộc').notEmpty()
], stockDailyController.createStockDaily);

// @route   PUT api/stock-daily/id/:id
// @desc    Cập nhật stock_daily theo ID
// @access  Private (Admin)
router.put('/id/:id', [
  auth,
  admin,
  check('close_price', 'Close price là bắt buộc').notEmpty()
], stockDailyController.updateStockDailyById);

// @route   DELETE api/stock-daily/:id
// @desc    Xóa stock_daily
// @access  Private (Admin)
router.delete('/:id', [auth, admin], stockDailyController.deleteStockDaily);

// @route   DELETE api/stock-daily
// @desc    Xóa nhiều stock_daily
// @access  Private (Admin)
router.delete('/', [auth, admin], stockDailyController.deleteMultipleStockDaily);

// @route   POST api/stock-daily/import
// @desc    Import stock_daily từ CSV
// @access  Private (Admin)
router.post('/import', [auth, admin], stockDailyController.importStockDailyFromCSV);

module.exports = router;
