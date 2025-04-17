const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stockInfoController = require('../controllers/stockInfoController');
const { auth, admin } = require('../middleware/auth');

// @route   GET api/stock-info
// @desc    Lấy tất cả stock info với phân trang
// @access  Private
router.get('/', auth, stockInfoController.getAllStockInfo);

// @route   GET api/stock-info/id/:id
// @desc    Lấy stock info theo ID
// @access  Private
router.get('/id/:id', auth, stockInfoController.getStockInfoById);

// @route   GET api/stock-info/:symbol
// @desc    Lấy stock info theo symbol
// @access  Private
router.get('/:symbol', auth, stockInfoController.getStockInfoBySymbol);

// @route   POST api/stock-info
// @desc    Tạo stock info mới
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    admin,
    [
      check('symbol', 'Symbol là bắt buộc').not().isEmpty(),
      check('name', 'Tên cổ phiếu là bắt buộc').not().isEmpty()
    ]
  ],
  stockInfoController.createStockInfo
);

// @route   PUT api/stock-info/:id
// @desc    Cập nhật stock info
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    admin,
    [
      check('symbol', 'Symbol là bắt buộc').not().isEmpty(),
      check('name', 'Tên cổ phiếu là bắt buộc').not().isEmpty()
    ]
  ],
  stockInfoController.updateStockInfo
);

// @route   DELETE api/stock-info/:id
// @desc    Xóa stock info
// @access  Private/Admin
router.delete('/:id', [auth, admin], stockInfoController.deleteStockInfo);

// @route   POST api/stock-info/import-csv
// @desc    Import stock info từ file CSV
// @access  Private/Admin
router.post('/import-csv', [auth, admin], stockInfoController.upload.single('file'), stockInfoController.importFromCSV);

module.exports = router;
