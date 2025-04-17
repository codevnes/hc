const pool = require('../config/db');

class StockMetrics {
  // Tìm stock_metrics theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_metrics WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm stock_metrics theo symbol và date
  static async findBySymbolAndDate(symbol, date) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_metrics WHERE symbol = ? AND date = ?',
        [symbol, date]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả stock_metrics
  static async findAll(limit = 100, offset = 0) {
    try {
      const [rows] = await pool.query(
        `SELECT sm.*, si.name as stock_name 
         FROM stock_metrics sm
         JOIN stock_info si ON sm.symbol = si.symbol
         ORDER BY sm.date DESC, sm.symbol
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_metrics theo symbol
  static async findBySymbol(symbol) {
    try {
      const [rows] = await pool.query(
        `SELECT sm.*, si.name as stock_name 
         FROM stock_metrics sm
         JOIN stock_info si ON sm.symbol = si.symbol
         WHERE sm.symbol = ?
         ORDER BY sm.date DESC`,
        [symbol]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_metrics theo date
  static async findByDate(date) {
    try {
      const [rows] = await pool.query(
        `SELECT sm.*, si.name as stock_name 
         FROM stock_metrics sm
         JOIN stock_info si ON sm.symbol = si.symbol
         WHERE sm.date = ?
         ORDER BY sm.symbol`,
        [date]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_metrics theo khoảng thời gian
  static async findByDateRange(startDate, endDate, symbol = null) {
    try {
      let query = `
        SELECT sm.*, si.name as stock_name 
        FROM stock_metrics sm
        JOIN stock_info si ON sm.symbol = si.symbol
        WHERE sm.date BETWEEN ? AND ?
      `;
      
      const params = [startDate, endDate];
      
      if (symbol) {
        query += ' AND sm.symbol = ?';
        params.push(symbol);
      }
      
      query += ' ORDER BY sm.date DESC, sm.symbol';
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo stock_metrics mới
  static async create(metricsData) {
    const { 
      symbol, 
      date, 
      roa, 
      roe, 
      tb_roa_nganh, 
      tb_roe_nganh
    } = metricsData;
    
    try {
      const [result] = await pool.query(
        `INSERT INTO stock_metrics 
         (symbol, date, roa, roe, tb_roa_nganh, tb_roe_nganh) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [symbol, date, roa, roe, tb_roa_nganh, tb_roe_nganh]
      );
      
      return { ...metricsData };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin stock_metrics bằng ID
  static async updateById(id, metricsData) {
    const { 
      symbol, 
      date,
      roa, 
      roe, 
      tb_roa_nganh, 
      tb_roe_nganh
    } = metricsData;
    
    try {
      const [result] = await pool.query(
        `UPDATE stock_metrics 
         SET symbol = ?, date = ?, roa = ?, roe = ?, tb_roa_nganh = ?, tb_roe_nganh = ?
         WHERE id = ?`,
        [symbol, date, roa, roe, tb_roa_nganh, tb_roe_nganh, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa stock_metrics bằng ID
  static async deleteById(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM stock_metrics WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa nhiều stock_metrics
  static async deleteMultiple(items) {
    try {
      if (!items || items.length === 0) {
        return 0;
      }

      // Tạo câu truy vấn với nhiều điều kiện OR
      const conditions = items.map(item => `(symbol = ? AND date = ?)`).join(' OR ');
      const params = items.flatMap(item => [item.symbol, item.date]);
      
      const [result] = await pool.query(
        `DELETE FROM stock_metrics WHERE ${conditions}`,
        params
      );
      
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Import nhiều stock_metrics từ CSV
  static async bulkImport(metricsData) {
    try {
      if (!metricsData || metricsData.length === 0) {
        return 0;
      }

      // Sử dụng INSERT ... ON DUPLICATE KEY UPDATE để xử lý trường hợp đã tồn tại
      const query = `
        INSERT INTO stock_metrics 
        (symbol, date, roa, roe, tb_roa_nganh, tb_roe_nganh) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE 
        roa = VALUES(roa),
        roe = VALUES(roe),
        tb_roa_nganh = VALUES(tb_roa_nganh),
        tb_roe_nganh = VALUES(tb_roe_nganh)
      `;
      
      const values = metricsData.map(metric => [
        metric.symbol,
        metric.date,
        metric.roa,
        metric.roe,
        metric.tb_roa_nganh,
        metric.tb_roe_nganh
      ]);
      
      const [result] = await pool.query(query, [values]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockMetrics;
