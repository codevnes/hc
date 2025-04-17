const StockDaily = require('../models/StockDaily');
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

// Lấy tất cả stock_daily
exports.getAllStockDaily = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const stockDaily = await StockDaily.findAll(limit, offset);
    res.status(200).json(stockDaily);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_daily:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_daily theo symbol
exports.getStockDailyBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockDaily = await StockDaily.findBySymbol(symbol);

    if (stockDaily.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_daily cho symbol này' });
    }

    res.status(200).json(stockDaily);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_daily theo symbol:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy stock_daily theo ID
exports.getStockDailyById = async (req, res) => {
  try {
    const { id } = req.params;
    const stockDaily = await StockDaily.findById(id);

    if (!stockDaily) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_daily' });
    }

    res.status(200).json(stockDaily);
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu stock_daily theo ID:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Tạo stock_daily mới
exports.createStockDaily = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { symbol } = req.body;

    // Kiểm tra xem symbol có tồn tại trong bảng stock_info không
    const stockInfo = await StockInfo.findBySymbol(symbol);
    if (!stockInfo) {
      return res.status(404).json({ message: 'Symbol không tồn tại trong hệ thống' });
    }

    const newStockDaily = await StockDaily.create(req.body);
    res.status(201).json(newStockDaily);
  } catch (error) {
    console.error('Lỗi khi tạo stock_daily:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật stock_daily theo ID
exports.updateStockDailyById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Kiểm tra xem stock_daily có tồn tại không bằng ID
    const existingStockDaily = await StockDaily.findById(id);
    if (!existingStockDaily) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_daily' });
    }

    // Cập nhật dữ liệu
    const stockDailyData = {
      ...req.body,
      symbol: existingStockDaily.symbol
    };

    // Gọi hàm update bằng ID
    const updated = await StockDaily.updateById(id, stockDailyData);

    if (updated) {
      const updatedStockDaily = await StockDaily.findById(id);
      res.status(200).json(updatedStockDaily);
    } else {
      res.status(500).json({ message: 'Cập nhật thất bại' });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật stock_daily theo ID:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa stock_daily
exports.deleteStockDaily = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StockDaily.deleteById(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu stock_daily để xóa' });
    }

    res.status(200).json({ message: 'Xóa stock_daily thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa stock_daily:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa nhiều stock_daily
exports.deleteMultipleStockDaily = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Cần cung cấp một mảng các ID để xóa' });
    }

    const deletedCount = await StockDaily.deleteMultipleByIds(ids);

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Không có dữ liệu stock_daily nào được tìm thấy với các ID đã cung cấp' });
    }

    res.status(200).json({ message: `Đã xóa thành công ${deletedCount} bản ghi stock_daily` });
  } catch (error) {
    console.error('Lỗi khi xóa nhiều stock_daily:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Import stock_daily từ CSV
exports.importStockDailyFromCSV = (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Lỗi từ Multer (ví dụ: kích thước file quá lớn)
      return res.status(400).json({ message: `Lỗi upload file: ${err.message}` });
    } else if (err) {
      // Lỗi khác (ví dụ: loại file không hợp lệ)
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được upload' });
    }

    const filePath = req.file.path;
    const results = [];
    let errorOccurred = false;
    let rowCount = 0;
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    try {
      const stream = fs.createReadStream(filePath)
        .pipe(csv({
          mapHeaders: ({ header }) => header.toLowerCase().trim(),
          mapValues: ({ header, value }) => {
            const trimmedValue = value.trim();
            // Cần chuyển đổi các trường số nếu cần
             if (['open_price', 'high_price', 'low_price', 'close_price', 'volume'].includes(header)) {
                 return trimmedValue === '' ? null : parseFloat(trimmedValue);
             }
            // Không cần xử lý date ở đây nữa
            return trimmedValue;
          }
        }))
        .on('data', async (data) => {
          stream.pause(); // Tạm dừng stream để xử lý bất đồng bộ
          rowCount++;
          try {
            // Validate required fields (example: symbol, close_price)
            if (!data.symbol || data.close_price == null) { // Adjusted validation
              throw new Error(`Dòng ${rowCount}: Thiếu dữ liệu bắt buộc (symbol, close_price)`);
            }

            // Chuẩn hóa symbol thành chữ hoa
            data.symbol = data.symbol.toUpperCase();

            // Remove date field from data before passing to create function
            const { date, ...stockData } = data;

            // Kiểm tra xem symbol có tồn tại trong stock_info không
            const stockInfo = await StockInfo.findBySymbol(stockData.symbol);
            if (!stockInfo) {
              throw new Error(`Dòng ${rowCount}: Symbol '${stockData.symbol}' không tồn tại trong hệ thống.`);
            }

            // Tạo bản ghi mới
            await StockDaily.create(stockData); // Pass data without date
            importedCount++;

          } catch (validationError) {
            skippedCount++;
            errors.push(`${validationError.message}`);
            // Không dừng lại khi có lỗi, ghi nhận và tiếp tục
          } finally {
            stream.resume(); // Tiếp tục stream
          }
        })
        .on('end', () => {
          fs.unlinkSync(filePath); // Xóa file tạm sau khi xử lý xong

          if (errors.length > 0) {
            // Nếu có lỗi, trả về thông tin lỗi và số lượng thành công/bỏ qua
            res.status(207).json({
              message: `Import hoàn tất với một số lỗi. Nhập thành công: ${importedCount}, Bỏ qua: ${skippedCount}.`,
              errors: errors
            });
          } else {
            res.status(200).json({ message: `Import thành công ${importedCount} bản ghi.` });
          }
        })
        .on('error', (streamError) => {
          errorOccurred = true;
          console.error('Lỗi khi đọc stream CSV:', streamError);
          fs.unlinkSync(filePath); // Đảm bảo xóa file tạm nếu có lỗi stream
          // Kiểm tra xem response đã được gửi chưa
          if (!res.headersSent) {
            res.status(500).json({ message: 'Lỗi xử lý file CSV' });
          }
        });
    } catch (processingError) {
        console.error('Lỗi trong quá trình xử lý import:', processingError);
        fs.unlinkSync(filePath); // Đảm bảo xóa file tạm nếu có lỗi
         if (!res.headersSent) {
            res.status(500).json({ message: 'Lỗi server khi import' });
         }
    }
  });
};

// Export multer upload để sử dụng trong routes
exports.upload = upload;
