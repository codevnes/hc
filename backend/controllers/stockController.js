const Stock = require('../models/Stock');
const StockInfo = require('../models/StockInfo');
const { validationResult } = require('express-validator');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Op } = require('sequelize');

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

// Lấy tất cả stocks
exports.getAllStocks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Default limit 10 per page
    const offset = (page - 1) * limit;

    // Gọi hàm findAll đã cập nhật
    const result = await Stock.findAll(limit, offset);

    // Trả về dữ liệu cùng thông tin phân trang
    res.json({
      data: result.data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(result.totalCount / limit),
        totalItems: result.totalCount,
        limit: limit
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy stocks theo symbol
exports.getStocksBySymbol = async (req, res) => {
  try {
    const stocks = await Stock.findBySymbol(req.params.symbol);
    res.json(stocks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy stocks theo date
exports.getStocksByDate = async (req, res) => {
  try {
    const stocks = await Stock.findByDate(req.params.date);
    res.json(stocks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy stocks theo khoảng thời gian
exports.getStocksByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, symbol } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp startDate và endDate' });
    }

    const stocks = await Stock.findByDateRange(startDate, endDate, symbol || null);
    res.json(stocks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy stock theo ID
exports.getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock' });
    }
    res.json(stock);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Tạo stock mới
exports.createStock = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Kiểm tra xem symbol có tồn tại trong stock_info không
    const stockInfo = await StockInfo.findBySymbol(req.body.symbol);
    if (!stockInfo) {
      return res.status(400).json({ message: 'Symbol không tồn tại trong hệ thống' });
    }

    // Kiểm tra xem stock đã tồn tại chưa
    const existingStock = await Stock.findBySymbolAndDate(req.body.symbol, req.body.date);
    if (existingStock) {
      return res.status(400).json({ message: 'Dữ liệu cho symbol và ngày này đã tồn tại' });
    }

    const stock = await Stock.create(req.body);
    res.status(201).json(stock);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Cập nhật stock
exports.updateStock = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const stockId = req.params.id;
    // Kiểm tra xem stock có tồn tại không bằng ID
    const existingStock = await Stock.findById(stockId);
    if (!existingStock) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock' });
    }

    // Gọi hàm update bằng ID
    const updated = await Stock.updateById(stockId, req.body);
    if (!updated) {
      return res.status(500).json({ message: 'Không thể cập nhật dữ liệu stock' });
    }

    // Trả về thông tin stock đã được cập nhật
    const updatedStock = await Stock.findById(stockId); // Lấy lại thông tin mới nhất
    res.json(updatedStock);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Xóa stock
exports.deleteStock = async (req, res) => {
  try {
    const stockId = req.params.id;
    // Kiểm tra xem stock có tồn tại không bằng ID
    const existingStock = await Stock.findById(stockId);
    if (!existingStock) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock' });
    }

    // Gọi hàm delete bằng ID
    const deleted = await Stock.deleteById(stockId);
    if (!deleted) {
      return res.status(500).json({ message: 'Không thể xóa dữ liệu stock' });
    }

    res.json({ message: 'Xóa dữ liệu stock thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Xóa nhiều stocks
exports.deleteMultipleStocks = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp danh sách các mục cần xóa' });
    }

    const deleted = await Stock.deleteMultiple(ids);

    res.json({
      message: `Đã xóa ${deleted} mục dữ liệu stock thành công`,
      deletedCount: deleted
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Import stocks từ file CSV
exports.importFromCSV = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên file CSV' });
    }

    const results = [];
    const errors = [];
    let processedRows = 0;

    try {
      // Lấy danh sách các symbol có sẵn
      const availableSymbols = await Stock.getAvailableSymbols();
      const symbolSet = new Set(availableSymbols.map(s => s.symbol));

      // Đọc và xử lý file CSV
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          processedRows++;

          // Kiểm tra dữ liệu và chuyển đổi kiểu dữ liệu
          try {
            // Kiểm tra symbol có tồn tại không
            if (!data.symbol || !symbolSet.has(data.symbol)) {
              errors.push({ row: processedRows, message: `Symbol '${data.symbol}' không tồn tại trong hệ thống` });
              return;
            }

            // Kiểm tra và chuyển đổi date (format DD/MM/YYYY)
            if (!data.date) {
              errors.push({ row: processedRows, message: 'Ngày không hợp lệ' });
              return;
            }

            // Chuyển đổi từ DD/MM/YYYY sang YYYY-MM-DD
            const dateParts = data.date.split('/');
            if (dateParts.length !== 3) {
              errors.push({ row: processedRows, message: 'Ngày không đúng định dạng DD/MM/YYYY' });
              return;
            }

            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10);
            const year = parseInt(dateParts[2], 10);

            if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12) {
              errors.push({ row: processedRows, message: 'Ngày không hợp lệ' });
              return;
            }

            // Hàm chuyển đổi chuỗi số có dấu phẩy thành số thập phân
            const parseVNNumber = (value) => {
              if (!value) return null;
              // Thay thế dấu phẩy bằng dấu chấm và loại bỏ dấu phẩy ngăn cách hàng nghìn
              const cleanValue = value.toString().replace(/\./g, '').replace(/,/g, '.');
              const result = parseFloat(cleanValue);
              return isNaN(result) ? null : result;
            };

            // Chuyển đổi các trường số
            const stock = {
              symbol: data.symbol,
              date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
              open: parseVNNumber(data.open),
              high: parseVNNumber(data.high),
              low: parseVNNumber(data.low),
              close: parseVNNumber(data.close),
              band_dow: parseVNNumber(data.band_dow),
              band_up: parseVNNumber(data.band_up),
              trend_q: parseVNNumber(data.trend_q),
              fq: parseVNNumber(data.fq),
              qv1: parseVNNumber(data.qv1)
            };

            results.push(stock);
          } catch (error) {
            errors.push({ row: processedRows, message: error.message });
          }
        })
        .on('end', async () => {
          // Xóa file tạm sau khi xử lý
          fs.unlinkSync(req.file.path);

          if (results.length === 0) {
            return res.status(400).json({
              message: 'Không có dữ liệu hợp lệ để import',
              errors
            });
          }

          try {
            // Import dữ liệu vào database
            const importedCount = await Stock.bulkImport(results);

            res.json({
              message: `Đã import ${importedCount} mục dữ liệu stock thành công`,
              importedCount,
              errors: errors.length > 0 ? errors : undefined
            });
          } catch (dbError) {
            console.error('Database error:', dbError);
            res.status(500).json({
              message: 'Lỗi khi import dữ liệu vào database',
              error: dbError.message
            });
          }
        });
    } catch (error) {
      console.error('Error processing CSV:', error);
      // Xóa file tạm nếu có lỗi
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Lỗi khi xử lý file CSV', error: error.message });
    }
  });
};

// Lấy danh sách các symbol có sẵn
exports.getAvailableSymbols = async (req, res) => {
  try {
    const symbols = await Stock.getAvailableSymbols();
    res.json(symbols);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy stock theo ID và khoảng thời gian
exports.getStockByIdAndDateRange = async (req, res) => {
  try {
    const { id } = req.params; // Get ID from route parameter
    const { startDate, endDate } = req.query; // Get dates from query parameters

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp startDate và endDate trong query parameters' });
    }

    const stocks = await Stock.findByIdAndDateRange(id, startDate, endDate);

    // Check if stock with that ID exists, even if no data in range
    if (stocks.length === 0) {
        const singleStock = await Stock.findById(id);
        if (!singleStock) {
            return res.status(404).json({ message: 'Không tìm thấy stock với ID cung cấp' });
        }
    }

    res.json(stocks);

  } catch (err) {
    console.error(err.message);
    // Check for specific error messages if needed
    if (err.message === 'Thiếu tham số id, startDate hoặc endDate') {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).send('Lỗi máy chủ');
  }
};

// Tìm kiếm stocks theo symbol hoặc name
exports.searchStocks = async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Vui lòng cung cấp tham số tìm kiếm q' });
  }

  try {
    // Sử dụng phương thức search mới với ưu tiên kết quả
    const results = await StockInfo.search(q, parseInt(limit));

    // Trả về kết quả với thông tin bổ sung
    res.json({
      query: q,
      results: results.map(item => ({
        symbol: item.symbol,
        name: item.name,
        // Loại bỏ trường priority khỏi kết quả trả về client
        matchType: item.priority === 1 ? 'exact' :
                  item.priority === 2 ? 'startsWith' :
                  item.priority === 3 ? 'contains' : 'nameMatch'
      })),
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Lỗi tìm kiếm stock:', err.message);
    res.status(500).json({
      error: 'Lỗi máy chủ khi tìm kiếm',
      message: err.message
    });
  }
};
