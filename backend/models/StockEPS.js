const pool = require('../config/db');

class StockEPS {
  // Tìm stock_eps theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_eps WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm stock_eps theo symbol và date
  static async findBySymbolAndDate(symbol, date) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_eps WHERE symbol = ? AND date = ?',
        [symbol, date]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả stock_eps
  static async findAll(limit = 100, offset = 0) {
    try {
      const [rows] = await pool.query(
        `SELECT se.*, si.name as stock_name 
         FROM stock_eps se
         JOIN stock_info si ON se.symbol = si.symbol
         ORDER BY se.date DESC, se.symbol
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_eps theo symbol
  static async findBySymbol(symbol) {
    try {
      const [rows] = await pool.query(
        `SELECT se.*, si.name as stock_name 
         FROM stock_eps se
         JOIN stock_info si ON se.symbol = si.symbol
         WHERE se.symbol = ?
         ORDER BY se.date DESC`,
        [symbol]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_eps theo date
  static async findByDate(date) {
    try {
      const [rows] = await pool.query(
        `SELECT se.*, si.name as stock_name 
         FROM stock_eps se
         JOIN stock_info si ON se.symbol = si.symbol
         WHERE se.date = ?
         ORDER BY se.symbol`,
        [date]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_eps theo khoảng thời gian
  static async findByDateRange(startDate, endDate, symbol = null) {
    try {
      let query = `
        SELECT se.*, si.name as stock_name 
        FROM stock_eps se
        JOIN stock_info si ON se.symbol = si.symbol
        WHERE se.date BETWEEN ? AND ?
      `;
      
      const params = [startDate, endDate];
      
      if (symbol) {
        query += ' AND se.symbol = ?';
        params.push(symbol);
      }
      
      query += ' ORDER BY se.date DESC, se.symbol';
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo stock_eps mới
  static async create(epsData) {
    const { 
      symbol, 
      date, 
      eps, 
      eps_nganh
    } = epsData;
    
    try {
      const [result] = await pool.query(
        `INSERT INTO stock_eps 
         (symbol, date, eps, eps_nganh) 
         VALUES (?, ?, ?, ?)`,
        [symbol, date, eps, eps_nganh]
      );
      
      return { ...epsData };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin stock_eps bằng ID
  static async updateById(id, epsData) {
    const { 
      symbol, 
      date,
      eps, 
      eps_nganh
    } = epsData;
    
    try {
      const [result] = await pool.query(
        `UPDATE stock_eps 
         SET symbol = ?, date = ?, eps = ?, eps_nganh = ?
         WHERE id = ?`,
        [symbol, date, eps, eps_nganh, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa stock_eps bằng ID
  static async deleteById(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM stock_eps WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa nhiều stock_eps
  static async deleteMultiple(items) {
    try {
      if (!items || items.length === 0) {
        return 0;
      }

      // Tạo câu truy vấn với nhiều điều kiện OR
      const conditions = items.map(item => `(symbol = ? AND date = ?)`).join(' OR ');
      const params = items.flatMap(item => [item.symbol, item.date]);
      
      const [result] = await pool.query(
        `DELETE FROM stock_eps WHERE ${conditions}`,
        params
      );
      
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Import nhiều stock_eps từ CSV
  static async bulkImport(epsData) {
    try {
      if (!epsData || epsData.length === 0) {
        return 0;
      }

      // Sử dụng INSERT ... ON DUPLICATE KEY UPDATE để xử lý trường hợp đã tồn tại
      const query = `
        INSERT INTO stock_eps 
        (symbol, date, eps, eps_nganh) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE 
        eps = VALUES(eps),
        eps_nganh = VALUES(eps_nganh)
      `;
      
      const values = epsData.map(eps => [
        eps.symbol,
        eps.date,
        eps.eps,
        eps.eps_nganh
      ]);
      
      const [result] = await pool.query(query, [values]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockEPS;
