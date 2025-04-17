const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stockPEController = require('../controllers/stockPEController');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/stock-pe
// @desc    Lấy tất cả stock_pe
// @access  Private
router.get('/', auth, stockPEController.getAllStockPE);

// @route   GET api/stock-pe/symbol/:symbol
// @desc    Lấy stock_pe theo symbol
// @access  Private
router.get('/symbol/:symbol', auth, stockPEController.getStockPEBySymbol);

// @route   GET api/stock-pe/date/:date
// @desc    Lấy stock_pe theo date
// @access  Private
router.get('/date/:date', auth, stockPEController.getStockPEByDate);

// @route   GET api/stock-pe/range
// @desc    Lấy stock_pe theo khoảng thời gian
// @access  Private
router.get('/range', auth, stockPEController.getStockPEByDateRange);

// @route   GET api/stock-pe/:symbol/:date
// @desc    Lấy stock_pe theo symbol và date
// @access  Private
router.get('/:symbol/:date', auth, stockPEController.getStockPEBySymbolAndDate);

// @route   POST api/stock-pe
// @desc    Tạo stock_pe mới
// @access  Private (Admin)
router.post('/', [
  auth, 
  admin,
  check('symbol', 'Symbol là bắt buộc').notEmpty(),
  check('date', 'Date là bắt buộc').notEmpty()
], stockPEController.createStockPE);

// @route   PUT api/stock-pe/:id -> /api/stock-pe/id/:id
// @desc    Cập nhật stock_pe
// @access  Private (Admin)
router.put('/id/:id', [
  auth, 
  admin
], stockPEController.updateStockPE);

// @route   DELETE api/stock-pe/:id
// @desc    Xóa stock_pe
// @access  Private (Admin)
router.delete('/:id', [auth, admin], stockPEController.deleteStockPE);

// @route   DELETE api/stock-pe
// @desc    Xóa nhiều stock_pe
// @access  Private (Admin)
router.delete('/', [auth, admin], stockPEController.deleteMultipleStockPE);

// @route   POST api/stock-pe/import
// @desc    Import stock_pe từ CSV
// @access  Private (Admin)
router.post('/import', [auth, admin], stockPEController.importStockPEFromCSV);

module.exports = router;
