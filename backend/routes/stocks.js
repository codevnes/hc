const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stockController = require('../controllers/stockController');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/stocks/symbols
// @desc    Lấy danh sách các symbol có sẵn
// @access  Private
router.get('/symbols', stockController.getAvailableSymbols);

// @route   GET api/stocks
// @desc    Lấy tất cả stocks
// @access  Private
router.get('/', stockController.getAllStocks);

// @route   GET api/stocks/search
// @desc    Tìm kiếm stocks theo symbol hoặc name
// @access  Private (hoặc Public tùy yêu cầu)
router.get('/search', auth, stockController.searchStocks);

// @route   GET api/stocks/symbol/:symbol
// @desc    Lấy stocks theo symbol
// @access  Private
router.get('/symbol/:symbol', stockController.getStocksBySymbol);

// @route   GET api/stocks/date/:date
// @desc    Lấy stocks theo date
// @access  Private
router.get('/date/:date', auth, stockController.getStocksByDate);

// @route   GET api/stocks/range
// @desc    Lấy stocks theo khoảng thời gian
// @access  Public
router.get('/range', stockController.getStocksByDateRange);

// @route   GET api/stocks/:id
// @desc    Lấy stock theo ID
// @access  Private
router.get('/:id', auth, stockController.getStockById);

// @route   GET api/stocks/id-range/:id
// @desc    Lấy stock theo ID và khoảng thời gian (startDate, endDate là query params)
// @access  Private
router.get('/id-range/:id', auth, stockController.getStockByIdAndDateRange);

// @route   POST api/stocks
// @desc    Tạo stock mới
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('symbol', 'Symbol là bắt buộc').not().isEmpty(),
      check('date', 'Ngày là bắt buộc và phải đúng định dạng').isDate(),
      check('open', 'Open phải là số').optional().isNumeric(),
      check('high', 'High phải là số').optional().isNumeric(),
      check('low', 'Low phải là số').optional().isNumeric(),
      check('close', 'Close phải là số').optional().isNumeric(),
      check('band_dow', 'Band Down phải là số').optional().isNumeric(),
      check('band_up', 'Band Up phải là số').optional().isNumeric(),
      check('trend_q', 'Trend Q phải là số').optional().isNumeric(),
      check('fq', 'FQ phải là số').optional().isNumeric(),
      check('qv1', 'QV1 phải là số nguyên').optional().isInt()
    ]
  ],
  stockController.createStock
);

// @route   PUT api/stocks/:id
// @desc    Cập nhật stock
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('open', 'Open phải là số').optional().isNumeric(),
      check('high', 'High phải là số').optional().isNumeric(),
      check('low', 'Low phải là số').optional().isNumeric(),
      check('close', 'Close phải là số').optional().isNumeric(),
      check('band_dow', 'Band Down phải là số').optional().isNumeric(),
      check('band_up', 'Band Up phải là số').optional().isNumeric(),
      check('trend_q', 'Trend Q phải là số').optional().isNumeric(),
      check('fq', 'FQ phải là số').optional().isNumeric(),
      check('qv1', 'QV1 phải là số nguyên').optional().isInt()
    ]
  ],
  stockController.updateStock
);

// @route   DELETE api/stocks/:id
// @desc    Xóa stock
// @access  Private
router.delete('/:id', auth, stockController.deleteStock);

// @route   DELETE api/stocks
// @desc    Xóa nhiều stocks
// @access  Private
router.delete('/', auth, stockController.deleteMultipleStocks);

// @route   POST api/stocks/import
// @desc    Import stocks từ file CSV
// @access  Private
router.post('/import', auth, stockController.importFromCSV);

module.exports = router;
