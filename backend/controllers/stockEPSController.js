const StockEPS = require('../models/StockEPS');
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

// Lấy tất cả stock_eps
exports.getAllStockEPS = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const stockEPS = await StockEPS.findAll(limit, offset);
    res.status(200).json(stockEPS);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_eps:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_eps theo symbol
exports.getStockEPSBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockEPS = await StockEPS.findBySymbol(symbol);
    
    if (stockEPS.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_eps cho symbol này' });
    }
    
    res.status(200).json(stockEPS);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_eps theo symbol:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_eps theo date
exports.getStockEPSByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const stockEPS = await StockEPS.findByDate(date);
    
    if (stockEPS.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_eps cho ngày này' });
    }
    
    res.status(200).json(stockEPS);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_eps theo date:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_eps theo khoảng thời gian
exports.getStockEPSByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, symbol } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Cần cung cấp startDate và endDate' });
    }
    
    const stockEPS = await StockEPS.findByDateRange(startDate, endDate, symbol);
    
    if (stockEPS.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_eps trong khoảng thời gian này' });
    }
    
    res.status(200).json(stockEPS);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_eps theo khoảng thời gian:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_eps theo symbol và date
exports.getStockEPSBySymbolAndDate = async (req, res) => {
  try {
    const { symbol, date } = req.params;
    const stockEPS = await StockEPS.findBySymbolAndDate(symbol, date);
    
    if (!stockEPS) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_eps' });
    }
    
    res.status(200).json(stockEPS);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_eps theo symbol và date:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo stock_eps mới
exports.createStockEPS = async (req, res) => {
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
    
    // Kiểm tra xem stock_eps đã tồn tại chưa
    const existingStockEPS = await StockEPS.findBySymbolAndDate(symbol, date);
    if (existingStockEPS) {
      return res.status(400).json({ message: 'Dữ liệu stock_eps cho symbol và date này đã tồn tại' });
    }
    
    const newStockEPS = await StockEPS.create(req.body);
    res.status(201).json(newStockEPS);
  } catch (error) {
    console.error('Lỗi khi tạo stock_eps:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật stock_eps
exports.updateStockEPS = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const epsId = req.params.id;
    
    // Kiểm tra xem stock_eps có tồn tại không bằng ID
    const existingStockEPS = await StockEPS.findById(epsId);
    if (!existingStockEPS) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_eps' });
    }
    
    // Gọi hàm update bằng ID
    const updated = await StockEPS.updateById(epsId, req.body);
    
    if (updated) {
      const updatedStockEPS = await StockEPS.findById(epsId);
      res.status(200).json(updatedStockEPS);
    } else {
      res.status(500).json({ message: 'Cập nhật thất bại' });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật stock_eps:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa stock_eps
exports.deleteStockEPS = async (req, res) => {
  try {
    const epsId = req.params.id;
    
    // Kiểm tra xem stock_eps có tồn tại không bằng ID
    const existingStockEPS = await StockEPS.findById(epsId);
    if (!existingStockEPS) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_eps' });
    }
    
    // Gọi hàm delete bằng ID
    const deleted = await StockEPS.deleteById(epsId);
    
    if (deleted) {
      res.status(200).json({ message: 'Xóa thành công' });
    } else {
      res.status(500).json({ message: 'Xóa thất bại' });
    }
  } catch (error) {
    console.error('Lỗi khi xóa stock_eps:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa nhiều stock_eps
exports.deleteMultipleStockEPS = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Danh sách items không hợp lệ' });
    }
    
    const deletedCount = await StockEPS.deleteMultiple(items);
    
    res.status(200).json({ 
      message: `Đã xóa ${deletedCount} mục thành công`,
      deletedCount
    });
  } catch (error) {
    console.error('Lỗi khi xóa nhiều stock_eps:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Import stock_eps từ CSV
exports.importStockEPSFromCSV = async (req, res) => {
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
         
          // Hàm chuyển đổi số có dấu phẩy hoặc không
          const parseNumber = (value) => {
            if (value === null || value === undefined || value === '') return null;
            // Thay thế dấu phẩy bằng dấu chấm nếu cần
            const cleanValue = String(value).replace(/,/g, '.');
            const result = parseFloat(cleanValue);
            return isNaN(result) ? null : result;
          };

          const stockEPS = {
            symbol: data.symbol,
            date: data.date, 
            eps: parseNumber(data.eps),
            eps_nganh: parseNumber(data.eps_nganh),
            stock_name: data.stock_name
          };
          results.push(stockEPS);
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
          const importedCount = await StockEPS.bulkImport(results);
          
          res.status(200).json({ 
            message: `Đã import ${importedCount} mục thành công`,
            importedCount
          });
        });
    } catch (error) {
      console.error('Lỗi khi import stock_eps từ CSV:', error);
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
