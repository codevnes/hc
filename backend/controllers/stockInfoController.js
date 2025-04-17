const StockInfo = require('../models/StockInfo');
const { validationResult } = require('express-validator');
const fs = require('fs');
const csv = require('csv-parser');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'stock-info-' + Date.now() + path.extname(file.originalname));
  }
});

// Filter for CSV files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

// Lấy tất cả stock info với phân trang
exports.getAllStockInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'symbol';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Build options for findAll
    const options = {
      limit,
      offset,
      orderBy: `${sortBy} ${sortOrder}`
    };

    // Add search conditions if search term is provided
    if (search) {
      options.where = {
        or: [
          { symbol: search },
          { name: search }
        ]
      };
    }

    const result = await StockInfo.findAll(options);

    res.json({
      data: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        limit: result.limit
      },
      search: search || undefined,
      sortBy,
      sortOrder
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Lấy stock info theo ID
exports.getStockInfoById = async (req, res) => {
  try {
    const stockInfo = await StockInfo.findById(req.params.id);

    if (!stockInfo) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin cổ phiếu' });
    }

    res.json(stockInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Lấy stock info theo symbol
exports.getStockInfoBySymbol = async (req, res) => {
  try {
    const stockInfo = await StockInfo.findBySymbol(req.params.symbol);

    if (!stockInfo) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin cổ phiếu' });
    }

    res.json(stockInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Tạo stock info mới
exports.createStockInfo = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { symbol, name, description } = req.body;

    // Kiểm tra mã chứng khoán đã tồn tại chưa
    const existingStock = await StockInfo.findBySymbol(symbol);
    if (existingStock) {
      return res.status(400).json({ message: `Mã chứng khoán ${symbol} đã tồn tại` });
    }

    // Tạo stock info mới
    const newStockInfo = await StockInfo.create({
      symbol: symbol.toUpperCase(),
      name,
      description: description || null
    });

    res.status(201).json(newStockInfo);
  } catch (err) {
    console.error('Lỗi khi tạo stock info:', err.message);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo stock info', error: err.message });
  }
};

// Cập nhật stock info
exports.updateStockInfo = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { symbol, name, description } = req.body;

    // Kiểm tra stock info có tồn tại không
    const stockInfo = await StockInfo.findById(id);
    if (!stockInfo) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin cổ phiếu' });
    }

    // Kiểm tra nếu symbol thay đổi, đảm bảo symbol mới chưa tồn tại
    if (symbol.toUpperCase() !== stockInfo.symbol) {
      const existingStock = await StockInfo.findBySymbol(symbol);
      if (existingStock) {
        return res.status(400).json({ message: `Mã chứng khoán ${symbol} đã tồn tại` });
      }
    }

    // Cập nhật stock info
    const updatedStockInfo = await StockInfo.update(id, {
      symbol: symbol.toUpperCase(),
      name,
      description: description || null
    });

    res.json(updatedStockInfo);
  } catch (err) {
    console.error('Lỗi khi cập nhật stock info:', err.message);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật stock info', error: err.message });
  }
};

// Xóa stock info
exports.deleteStockInfo = async (req, res) => {
  try {
    const stockInfoId = req.params.id;
    // Kiểm tra xem stock info có tồn tại không bằng ID
    const existingStockInfo = await StockInfo.findById(stockInfoId);
    if (!existingStockInfo) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin cổ phiếu' });
    }

    // Gọi hàm delete bằng ID
    const deleted = await StockInfo.delete(stockInfoId);
    if (!deleted) {
      return res.status(500).json({ message: 'Không thể xóa thông tin cổ phiếu' });
    }

    res.json({ message: 'Xóa thông tin cổ phiếu thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Tạo stock info mới
exports.createStockInfo = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Kiểm tra xem symbol đã tồn tại chưa
    const existingStockInfo = await StockInfo.findBySymbol(req.body.symbol);
    if (existingStockInfo) {
      return res.status(400).json({ message: 'Symbol đã tồn tại' });
    }

    const stockInfo = await StockInfo.create(req.body);
    res.status(201).json(stockInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Cập nhật stock info
exports.updateStockInfo = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const stockInfoId = req.params.id;
    // Kiểm tra xem stock info có tồn tại không bằng ID
    const existingStockInfo = await StockInfo.findById(stockInfoId);
    if (!existingStockInfo) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin cổ phiếu' });
    }

    // Kiểm tra xem symbol mới (nếu có) có bị trùng không
    if (req.body.symbol && req.body.symbol !== existingStockInfo.symbol) {
      const symbolExists = await StockInfo.findBySymbol(req.body.symbol);
      if (symbolExists) {
        return res.status(400).json({ message: 'Symbol đã tồn tại' });
      }
    }

    const updated = await StockInfo.update(stockInfoId, req.body);
    if (!updated) {
      return res.status(500).json({ message: 'Không thể cập nhật thông tin cổ phiếu' });
    }

    const updatedStockInfo = await StockInfo.findById(stockInfoId);
    res.json(updatedStockInfo);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Xóa stock info
exports.deleteStockInfo = async (req, res) => {
  try {
    const stockInfoId = req.params.id;
    // Kiểm tra xem stock info có tồn tại không bằng ID
    const existingStockInfo = await StockInfo.findById(stockInfoId);
    if (!existingStockInfo) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin cổ phiếu' });
    }

    // Gọi hàm delete bằng ID
    const deleted = await StockInfo.delete(stockInfoId);
    if (!deleted) {
      return res.status(500).json({ message: 'Không thể xóa thông tin cổ phiếu' });
    }

    res.json({ message: 'Xóa thông tin cổ phiếu thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Import stock info từ file CSV
exports.importFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên file CSV' });
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let errorCount = 0;
    let totalCount = 0;

    // Đọc file CSV
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (data) => {
        totalCount++;
        // Kiểm tra dữ liệu hợp lệ
        if (!data.symbol || !data.name) {
          errors.push({ row: totalCount, error: 'Symbol và Name là bắt buộc', data });
          errorCount++;
          return;
        }

        // Chuẩn hóa dữ liệu
        const stockInfo = {
          symbol: data.symbol.trim().toUpperCase(),
          name: data.name.trim(),
          description: data.description ? data.description.trim() : null
        };

        results.push(stockInfo);
      })
      .on('end', async () => {
        // Xử lý dữ liệu sau khi đọc xong file
        for (const stockInfo of results) {
          try {
            // Kiểm tra xem symbol đã tồn tại chưa
            const existingStockInfo = await StockInfo.findBySymbol(stockInfo.symbol);
            if (existingStockInfo) {
              errors.push({ symbol: stockInfo.symbol, error: 'Symbol đã tồn tại' });
              errorCount++;
              continue;
            }

            // Tạo mới stock info
            await StockInfo.create(stockInfo);
            successCount++;
          } catch (err) {
            errors.push({ symbol: stockInfo.symbol, error: err.message });
            errorCount++;
          }
        }

        // Xóa file tạm sau khi xử lý xong
        fs.unlinkSync(req.file.path);

        res.json({
          message: 'Import thành công',
          totalCount,
          successCount,
          errorCount,
          errors: errors.length > 0 ? errors : undefined
        });
      });
  } catch (err) {
    console.error('Lỗi khi import CSV:', err.message);
    // Xóa file tạm nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Lỗi máy chủ khi import CSV', error: err.message });
  }
};
