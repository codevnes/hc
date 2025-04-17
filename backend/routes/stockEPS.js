const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stockEPSController = require('../controllers/stockEPSController');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/stock-eps
// @desc    Lấy tất cả stock_eps
// @access  Private
router.get('/', auth, stockEPSController.getAllStockEPS);

// @route   GET api/stock-eps/symbol/:symbol
// @desc    Lấy stock_eps theo symbol
// @access  Private
router.get('/symbol/:symbol', auth, stockEPSController.getStockEPSBySymbol);

// @route   GET api/stock-eps/date/:date
// @desc    Lấy stock_eps theo date
// @access  Private
router.get('/date/:date', auth, stockEPSController.getStockEPSByDate);

// @route   GET api/stock-eps/range
// @desc    Lấy stock_eps theo khoảng thời gian
// @access  Private
router.get('/range', auth, stockEPSController.getStockEPSByDateRange);

// @route   GET api/stock-eps/:symbol/:date
// @desc    Lấy stock_eps theo symbol và date
// @access  Private
router.get('/:symbol/:date', auth, stockEPSController.getStockEPSBySymbolAndDate);

// @route   POST api/stock-eps
// @desc    Tạo stock_eps mới
// @access  Private (Admin)
router.post('/', [
  auth, 
  admin,
  check('symbol', 'Symbol là bắt buộc').notEmpty(),
  check('date', 'Date là bắt buộc').notEmpty()
], stockEPSController.createStockEPS);

// @route   PUT api/stock-eps/:id
// @desc    Cập nhật stock_eps
// @access  Private (Admin)
router.put('/:id', [
  auth, 
  admin
], stockEPSController.updateStockEPS);

// @route   DELETE api/stock-eps/id/:id
// @desc    Xóa stock_eps
// @access  Private (Admin)
router.delete('/id/:id', [auth, admin], stockEPSController.deleteStockEPS);

// @route   DELETE api/stock-eps
// @desc    Xóa nhiều stock_eps
// @access  Private (Admin)
router.delete('/', [auth, admin], stockEPSController.deleteMultipleStockEPS);

// @route   POST api/stock-eps/import
// @desc    Import stock_eps từ CSV
// @access  Private (Admin)
router.post('/import', [auth, admin], stockEPSController.importStockEPSFromCSV);

module.exports = router;
