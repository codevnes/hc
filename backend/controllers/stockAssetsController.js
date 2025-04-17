const StockAssets = require('../models/StockAssets');
const StockInfo = require('../models/StockInfo');
const { validationResult } = require('express-validator');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Cấu hình multer để xử lý upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Chỉ chấp nhận file CSV'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('file');

// Lấy tất cả stock_assets
exports.getAllStockAssets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const stockAssets = await StockAssets.findAll(limit, offset);
    res.status(200).json(stockAssets);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_assets:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_assets theo symbol
exports.getStockAssetsBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockAssets = await StockAssets.findBySymbol(symbol);
    
    if (stockAssets.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_assets cho symbol này' });
    }
    
    res.status(200).json(stockAssets);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_assets theo symbol:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_assets theo date
exports.getStockAssetsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const stockAssets = await StockAssets.findByDate(date);
    
    if (stockAssets.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_assets cho ngày này' });
    }
    
    res.status(200).json(stockAssets);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_assets theo date:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_assets theo khoảng thời gian
exports.getStockAssetsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, symbol } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Cần cung cấp startDate và endDate' });
    }
    
    const stockAssets = await StockAssets.findByDateRange(startDate, endDate, symbol);
    
    if (stockAssets.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_assets trong khoảng thời gian này' });
    }
    
    res.status(200).json(stockAssets);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_assets theo khoảng thời gian:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_assets theo symbol và date
exports.getStockAssetsBySymbolAndDate = async (req, res) => {
  try {
    const { symbol, date } = req.params;
    const stockAssets = await StockAssets.findBySymbolAndDate(symbol, date);
    
    if (!stockAssets) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_assets' });
    }
    
    res.status(200).json(stockAssets);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_assets theo symbol và date:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo stock_assets mới
exports.createStockAssets = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { symbol, date } = req.body;
    
    // Kiểm tra xem symbol có tồn tại trong bảng stock_info không
    const stockInfo = await StockInfo.findBySymbol(symbol);
    if (!stockInfo) {
      return res.status(404).json({ message: 'Symbol không tồn tại trong hệ thống' });
    }
    
    // Kiểm tra xem stock_assets đã tồn tại chưa
    const existingStockAssets = await StockAssets.findBySymbolAndDate(symbol, date);
    if (existingStockAssets) {
      return res.status(400).json({ message: 'Dữ liệu stock_assets cho symbol và date này đã tồn tại' });
    }
    
    const newStockAssets = await StockAssets.create(req.body);
    res.status(201).json(newStockAssets);
  } catch (error) {
    console.error('Lỗi khi tạo stock_assets:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật stock_assets
exports.updateStockAssets = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assetsId = req.params.id;
    
    // Kiểm tra xem stock_assets có tồn tại không bằng ID
    const existingStockAssets = await StockAssets.findById(assetsId);
    if (!existingStockAssets) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_assets' });
    }
    
    // Gọi hàm update bằng ID
    const updated = await StockAssets.updateById(assetsId, req.body);
    
    if (updated) {
      const updatedStockAssets = await StockAssets.findById(assetsId);
      res.status(200).json(updatedStockAssets);
    } else {
      res.status(500).json({ message: 'Cập nhật thất bại' });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật stock_assets:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa stock_assets
exports.deleteStockAssets = async (req, res) => {
  try {
    const assetsId = req.params.id;
    
    // Kiểm tra xem stock_assets có tồn tại không bằng ID
    const existingStockAssets = await StockAssets.findById(assetsId);
    if (!existingStockAssets) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_assets' });
    }
    
    // Gọi hàm delete bằng ID
    const deleted = await StockAssets.deleteById(assetsId);
    
    if (deleted) {
      res.status(200).json({ message: 'Xóa thành công' });
    } else {
      res.status(500).json({ message: 'Xóa thất bại' });
    }
  } catch (error) {
    console.error('Lỗi khi xóa stock_assets:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa nhiều stock_assets
exports.deleteMultipleStockAssets = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Danh sách items không hợp lệ' });
    }
    
    const deletedCount = await StockAssets.deleteMultiple(items);
    
    res.status(200).json({ 
      message: `Đã xóa ${deletedCount} mục thành công`,
      deletedCount
    });
  } catch (error) {
    console.error('Lỗi khi xóa nhiều stock_assets:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Import stock_assets từ CSV
exports.importStockAssetsFromCSV = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên file CSV' });
    }
    
    try {
      const results = [];
      const filePath = req.file.path;
      
      // Đọc file CSV
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // Chuyển đổi dữ liệu từ CSV
          const stockAssets = {
            symbol: data.symbol,
            date: data.date,
            tts: parseFloat(data.tts) || null,
            vcsh: parseFloat(data.vcsh) || null,
            tb_tts_nganh: parseFloat(data.tb_tts_nganh) || null
          };
          
          results.push(stockAssets);
        })
        .on('end', async () => {
          // Xóa file sau khi đọc xong
          fs.unlinkSync(filePath);
          
          if (results.length === 0) {
            return res.status(400).json({ message: 'File CSV không có dữ liệu hợp lệ' });
          }
          
          // Kiểm tra xem tất cả các symbol có tồn tại trong bảng stock_info không
          const symbols = [...new Set(results.map(item => item.symbol))];
          const existingSymbols = await Promise.all(
            symbols.map(symbol => StockInfo.findBySymbol(symbol))
          );
          
          const invalidSymbols = symbols.filter((symbol, index) => !existingSymbols[index]);
          
          if (invalidSymbols.length > 0) {
            return res.status(400).json({ 
              message: 'Một số symbol không tồn tại trong hệ thống',
              invalidSymbols
            });
          }
          
          // Import dữ liệu vào database
          const importedCount = await StockAssets.bulkImport(results);
          
          res.status(200).json({ 
            message: `Đã import ${importedCount} mục thành công`,
            importedCount
          });
        });
    } catch (error) {
      console.error('Lỗi khi import stock_assets từ CSV:', error);
      // Xóa file nếu có lỗi xảy ra
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Lỗi server' });
    }
  });
};

// Export multer upload để sử dụng trong routes
exports.upload = upload;
