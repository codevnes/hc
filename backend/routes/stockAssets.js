const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stockAssetsController = require('../controllers/stockAssetsController');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/stock-assets
// @desc    Lấy tất cả stock_assets
// @access  Private
router.get('/', auth, stockAssetsController.getAllStockAssets);

// @route   GET api/stock-assets/symbol/:symbol
// @desc    Lấy stock_assets theo symbol
// @access  Private
router.get('/symbol/:symbol', auth, stockAssetsController.getStockAssetsBySymbol);

// @route   GET api/stock-assets/date/:date
// @desc    Lấy stock_assets theo date
// @access  Private
router.get('/date/:date', auth, stockAssetsController.getStockAssetsByDate);

// @route   GET api/stock-assets/range
// @desc    Lấy stock_assets theo khoảng thời gian
// @access  Private
router.get('/range', auth, stockAssetsController.getStockAssetsByDateRange);

// @route   GET api/stock-assets/:symbol/:date
// @desc    Lấy stock_assets theo symbol và date
// @access  Private
router.get('/:symbol/:date', auth, stockAssetsController.getStockAssetsBySymbolAndDate);

// @route   POST api/stock-assets
// @desc    Tạo stock_assets mới
// @access  Private (Admin)
router.post('/', [
  auth, 
  admin,
  check('symbol', 'Symbol là bắt buộc').notEmpty(),
  check('date', 'Date là bắt buộc').notEmpty()
], stockAssetsController.createStockAssets);

// @route   PUT api/stock-assets/:id
// @desc    Cập nhật stock_assets
// @access  Private (Admin)
router.put('/:id', [
  auth, 
  admin
], stockAssetsController.updateStockAssets);

// @route   DELETE api/stock-assets/:id
// @desc    Xóa stock_assets
// @access  Private (Admin)
router.delete('/:id', [auth, admin], stockAssetsController.deleteStockAssets);

// @route   DELETE api/stock-assets
// @desc    Xóa nhiều stock_assets
// @access  Private (Admin)
router.delete('/', [auth, admin], stockAssetsController.deleteMultipleStockAssets);

// @route   POST api/stock-assets/import
// @desc    Import stock_assets từ CSV
// @access  Private (Admin)
router.post('/import', [auth, admin], stockAssetsController.importStockAssetsFromCSV);

module.exports = router;
