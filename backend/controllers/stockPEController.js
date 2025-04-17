const StockPE = require('../models/StockPE');
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

// Lấy tất cả stock_pe
exports.getAllStockPE = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const stockPE = await StockPE.findAll(limit, offset);
    res.status(200).json(stockPE);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_pe:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_pe theo symbol
exports.getStockPEBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockPE = await StockPE.findBySymbol(symbol);
    
    if (stockPE.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_pe cho symbol này' });
    }
    
    res.status(200).json(stockPE);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_pe theo symbol:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_pe theo date
exports.getStockPEByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const stockPE = await StockPE.findByDate(date);
    
    if (stockPE.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_pe cho ngày này' });
    }
    
    res.status(200).json(stockPE);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_pe theo date:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_pe theo khoảng thời gian
exports.getStockPEByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, symbol } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Cần cung cấp startDate và endDate' });
    }
    
    const stockPE = await StockPE.findByDateRange(startDate, endDate, symbol);
    
    res.status(200).json(stockPE);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_pe theo khoảng thời gian:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_pe theo symbol và date
exports.getStockPEBySymbolAndDate = async (req, res) => {
  try {
    const { symbol, date } = req.params;
    const stockPE = await StockPE.findBySymbolAndDate(symbol, date);
    
    if (!stockPE) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_pe' });
    }
    
    res.status(200).json(stockPE);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_pe theo symbol và date:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo stock_pe mới
exports.createStockPE = async (req, res) => {
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
    
    // Kiểm tra xem stock_pe đã tồn tại chưa
    const existingStockPE = await StockPE.findBySymbolAndDate(symbol, date);
    if (existingStockPE) {
      return res.status(400).json({ message: 'Dữ liệu stock_pe cho symbol và date này đã tồn tại' });
    }
    
    const newStockPE = await StockPE.create(req.body);
    res.status(201).json(newStockPE);
  } catch (error) {
    console.error('Lỗi khi tạo stock_pe:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật stock_pe
exports.updateStockPE = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const peId = req.params.id;
    
    // Kiểm tra xem stock_pe có tồn tại không bằng ID
    const existingStockPE = await StockPE.findById(peId);
    if (!existingStockPE) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_pe' });
    }
    
    // Gọi hàm update bằng ID
    const updated = await StockPE.updateById(peId, req.body);
    
    if (updated) {
      const updatedStockPE = await StockPE.findById(peId);
      res.status(200).json(updatedStockPE);
    } else {
      res.status(500).json({ message: 'Cập nhật thất bại' });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật stock_pe:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa stock_pe
exports.deleteStockPE = async (req, res) => {
  try {
    const peId = req.params.id;
    
    // Kiểm tra xem stock_pe có tồn tại không bằng ID
    const existingStockPE = await StockPE.findById(peId);
    if (!existingStockPE) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_pe' });
    }
    
    // Gọi hàm delete bằng ID
    const deleted = await StockPE.deleteById(peId);
    
    if (deleted) {
      res.status(200).json({ message: 'Xóa thành công' });
    } else {
      res.status(500).json({ message: 'Xóa thất bại' });
    }
  } catch (error) {
    console.error('Lỗi khi xóa stock_pe:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa nhiều stock_pe
exports.deleteMultipleStockPE = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Danh sách items không hợp lệ' });
    }
    
    const deletedCount = await StockPE.deleteMultiple(items);
    
    res.status(200).json({ 
      message: `Đã xóa ${deletedCount} mục thành công`,
      deletedCount
    });
  } catch (error) {
    console.error('Lỗi khi xóa nhiều stock_pe:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Import stock_pe từ CSV
exports.importStockPEFromCSV = async (req, res) => {
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
          const stockPE = {
            symbol: data.symbol,
            date: data.date,
            pe: parseFloat(data.pe) || null,
            pe_nganh: parseFloat(data.pe_nganh) || null
          };
          
          results.push(stockPE);
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
          const importedCount = await StockPE.bulkImport(results);
          
          res.status(200).json({ 
            message: `Đã import ${importedCount} mục thành công`,
            importedCount
          });
        });
    } catch (error) {
      console.error('Lỗi khi import stock_pe từ CSV:', error);
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
