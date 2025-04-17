const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stockMetricsController = require('../controllers/stockMetricsController');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/stock-metrics
// @desc    Lấy tất cả stock_metrics
// @access  Private
router.get('/', auth, stockMetricsController.getAllStockMetrics);

// @route   GET api/stock-metrics/symbol/:symbol
// @desc    Lấy stock_metrics theo symbol
// @access  Private
router.get('/symbol/:symbol', auth, stockMetricsController.getStockMetricsBySymbol);

// @route   GET api/stock-metrics/date/:date
// @desc    Lấy stock_metrics theo date
// @access  Private
router.get('/date/:date', auth, stockMetricsController.getStockMetricsByDate);

// @route   GET api/stock-metrics/range
// @desc    Lấy stock_metrics theo khoảng thời gian
// @access  Private
router.get('/range', stockMetricsController.getStockMetricsByDateRange);

// @route   GET api/stock-metrics/:symbol/:date
// @desc    Lấy stock_metrics theo symbol và date
// @access  Private
router.get('/:symbol/:date', auth, stockMetricsController.getStockMetricsBySymbolAndDate);

// @route   POST api/stock-metrics
// @desc    Tạo stock_metrics mới
// @access  Private (Admin)
router.post('/', [
  auth, 
  admin,
  check('symbol', 'Symbol là bắt buộc').notEmpty(),
  check('date', 'Date là bắt buộc').notEmpty()
], stockMetricsController.createStockMetrics);

// @route   PUT api/stock-metrics/:id
// @desc    Cập nhật stock_metrics
// @access  Private (Admin)
router.put('/:id', [
  auth, 
  admin
], stockMetricsController.updateStockMetrics);

// @route   DELETE api/stock-metrics/:id
// @desc    Xóa stock_metrics
// @access  Private (Admin)
router.delete('/:id', [auth, admin], stockMetricsController.deleteStockMetrics);

// @route   DELETE api/stock-metrics
// @desc    Xóa nhiều stock_metrics
// @access  Private (Admin)
router.delete('/', [auth, admin], stockMetricsController.deleteMultipleStockMetrics);

// @route   POST api/stock-metrics/import
// @desc    Import stock_metrics từ CSV
// @access  Private (Admin)
router.post('/import', [auth, admin], stockMetricsController.importStockMetricsFromCSV);

module.exports = router;
