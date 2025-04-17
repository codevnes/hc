const pool = require('../config/db');

class Stock {
  // Tìm stock theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stocks WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm stock theo symbol và date
  static async findBySymbolAndDate(symbol, date) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stocks WHERE symbol = ? AND date = ?',
        [symbol, date]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả stocks với phân trang và tổng số lượng
  static async findAll(limit = 100, offset = 0) {
    try {
      // Câu lệnh lấy dữ liệu theo trang
      const dataQuery = `
        SELECT s.*, si.name as stock_name 
        FROM stocks s
        JOIN stock_info si ON s.symbol = si.symbol
        ORDER BY s.date DESC, s.symbol
        LIMIT ? OFFSET ?
      `;
      
      // Câu lệnh đếm tổng số lượng bản ghi
      const countQuery = `SELECT COUNT(*) as totalCount FROM stocks`;

      // Thực thi cả hai câu lệnh
      const [rows] = await pool.query(dataQuery, [limit, offset]);
      const [countResult] = await pool.query(countQuery);
      
      const totalCount = countResult[0].totalCount;

      // Trả về dữ liệu và tổng số lượng
      return { data: rows, totalCount };
    } catch (error) {
      throw error;
    }
  }

  // Lấy stocks theo symbol
  static async findBySymbol(symbol) {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, si.name as stock_name 
         FROM stocks s
         JOIN stock_info si ON s.symbol = si.symbol
         WHERE s.symbol = ?
         ORDER BY s.date DESC`,
        [symbol]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stocks theo date
  static async findByDate(date) {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, si.name as stock_name 
         FROM stocks s
         JOIN stock_info si ON s.symbol = si.symbol
         WHERE s.date = ?
         ORDER BY s.symbol`,
        [date]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stocks theo khoảng thời gian
  static async findByDateRange(startDate, endDate, symbol = null) {
    try {
      let query = `
        SELECT s.*, si.name as stock_name 
        FROM stocks s
        JOIN stock_info si ON s.symbol = si.symbol
        WHERE s.date BETWEEN ? AND ?
      `;
      
      const params = [startDate, endDate];
      
      if (symbol) {
        query += ' AND s.symbol = ?';
        params.push(symbol);
      }
      
      query += ' ORDER BY s.date DESC, s.symbol';
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo stock mới
  static async create(stockData) {
    const { 
      symbol, 
      date, 
      open, 
      high, 
      low, 
      close, 
      band_dow, 
      band_up, 
      trend_q, 
      fq, 
      qv1 
    } = stockData;
    
    try {
      const [result] = await pool.query(
        `INSERT INTO stocks 
         (symbol, date, open, high, low, close, band_dow, band_up, trend_q, fq, qv1) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [symbol, date, open, high, low, close, band_dow, band_up, trend_q, fq, qv1]
      );
      
      return { id: result.insertId, ...stockData };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin stock bằng ID
  static async updateById(id, stockData) {
    const { 
      symbol, 
      date,
      open, 
      high, 
      low, 
      close, 
      band_dow, 
      band_up, 
      trend_q, 
      fq, 
      qv1 
    } = stockData;
    
    try {
      // Lưu ý: Cập nhật cả symbol và date có thể không mong muốn. 
      // Xem xét chỉ cho phép cập nhật các trường dữ liệu khác.
      const [result] = await pool.query(
        `UPDATE stocks 
         SET symbol = ?, date = ?, open = ?, high = ?, low = ?, close = ?, 
             band_dow = ?, band_up = ?, trend_q = ?, fq = ?, qv1 = ?
         WHERE id = ?`,
        [symbol, date, open, high, low, close, band_dow, band_up, trend_q, fq, qv1, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa stock bằng ID
  static async deleteById(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM stocks WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa nhiều stocks
  static async deleteMultiple(ids) {
    try {
      // Check if ids array is valid
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return 0;
      }

      // Use IN operator for deleting multiple rows by ID
      const query = 'DELETE FROM stocks WHERE id IN (?)';
      
      // The second argument to pool.query should be an array of parameters.
      // For the IN operator, we need to pass the array of IDs itself.
      // The library handles wrapping it correctly.
      const [result] = await pool.query(query, [ids]);
      
      return result.affectedRows;
    } catch (error) {
      console.error("Error deleting multiple stocks:", error); // Added logging
      throw error;
    }
  }

  // Import nhiều stocks từ CSV
  static async bulkImport(stocksData) {
    try {
      if (!stocksData || stocksData.length === 0) {
        return 0;
      }

      // Sử dụng INSERT ... ON DUPLICATE KEY UPDATE để xử lý trường hợp đã tồn tại
      const query = `
        INSERT INTO stocks 
        (symbol, date, open, high, low, close, band_dow, band_up, trend_q, fq, qv1) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE 
        open = VALUES(open),
        high = VALUES(high),
        low = VALUES(low),
        close = VALUES(close),
        band_dow = VALUES(band_dow),
        band_up = VALUES(band_up),
        trend_q = VALUES(trend_q),
        fq = VALUES(fq),
        qv1 = VALUES(qv1)
      `;
      
      const values = stocksData.map(stock => [
        stock.symbol,
        stock.date,
        stock.open,
        stock.high,
        stock.low,
        stock.close,
        stock.band_dow,
        stock.band_up,
        stock.trend_q,
        stock.fq,
        stock.qv1
      ]);
      
      const [result] = await pool.query(query, [values]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách các symbol có trong bảng stock_info
  static async getAvailableSymbols() {
    try {
      const [rows] = await pool.query(
        'SELECT symbol, name FROM stock_info ORDER BY symbol'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock theo ID và khoảng thời gian
  static async findByIdAndDateRange(id, startDate, endDate) {
    try {
      // Validate inputs (basic check)
      if (!id || !startDate || !endDate) {
        throw new Error('Thiếu tham số id, startDate hoặc endDate');
      }

      const query = `
        SELECT s.*, si.name as stock_name 
        FROM stocks s
        JOIN stock_info si ON s.symbol = si.symbol
        WHERE s.id = ? AND s.date BETWEEN ? AND ?
        ORDER BY s.date ASC`; // Order chronologically for charts

      const [rows] = await pool.query(query, [id, startDate, endDate]);
      return rows;
    } catch (error) {
      console.error("Error in findByIdAndDateRange:", error);
      throw error;
    }
  }
}

module.exports = Stock;
