const pool = require('../config/db');

class StockPE {
  // Tìm stock_pe theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_pe WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm stock_pe theo symbol và date
  static async findBySymbolAndDate(symbol, date) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_pe WHERE symbol = ? AND date = ?',
        [symbol, date]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả stock_pe
  static async findAll(limit = 100, offset = 0) {
    try {
      const [rows] = await pool.query(
        `SELECT sp.*, si.name as stock_name 
         FROM stock_pe sp
         JOIN stock_info si ON sp.symbol = si.symbol
         ORDER BY sp.date DESC, sp.symbol
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_pe theo symbol
  static async findBySymbol(symbol) {
    try {
      const [rows] = await pool.query(
        `SELECT sp.*, si.name as stock_name 
         FROM stock_pe sp
         JOIN stock_info si ON sp.symbol = si.symbol
         WHERE sp.symbol = ?
         ORDER BY sp.date DESC`,
        [symbol]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_pe theo date
  static async findByDate(date) {
    try {
      const [rows] = await pool.query(
        `SELECT sp.*, si.name as stock_name 
         FROM stock_pe sp
         JOIN stock_info si ON sp.symbol = si.symbol
         WHERE sp.date = ?
         ORDER BY sp.symbol`,
        [date]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_pe theo khoảng thời gian
  static async findByDateRange(startDate, endDate, symbol = null) {
    try {
      let query = `
        SELECT sp.*, si.name as stock_name 
        FROM stock_pe sp
        JOIN stock_info si ON sp.symbol = si.symbol
        WHERE sp.date BETWEEN ? AND ?
      `;
      
      const params = [startDate, endDate];
      
      if (symbol) {
        query += ' AND sp.symbol = ?';
        params.push(symbol);
      }
      
      query += ' ORDER BY sp.date DESC, sp.symbol';
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo stock_pe mới
  static async create(peData) {
    const { 
      symbol, 
      date, 
      pe, 
      pe_nganh
    } = peData;
    
    try {
      const [result] = await pool.query(
        `INSERT INTO stock_pe 
         (symbol, date, pe, pe_nganh) 
         VALUES (?, ?, ?, ?)`,
        [symbol, date, pe, pe_nganh]
      );
      
      return { ...peData };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin stock_pe bằng ID
  static async updateById(id, peData) {
    const { 
      symbol, 
      date,
      pe, 
      pe_nganh
    } = peData;
    
    try {
      const [result] = await pool.query(
        `UPDATE stock_pe 
         SET symbol = ?, date = ?, pe = ?, pe_nganh = ?
         WHERE id = ?`,
        [symbol, date, pe, pe_nganh, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa stock_pe bằng ID
  static async deleteById(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM stock_pe WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa nhiều stock_pe
  static async deleteMultiple(items) {
    try {
      if (!items || items.length === 0) {
        return 0;
      }

      // Tạo câu truy vấn với nhiều điều kiện OR
      const conditions = items.map(item => `(symbol = ? AND date = ?)`).join(' OR ');
      const params = items.flatMap(item => [item.symbol, item.date]);
      
      const [result] = await pool.query(
        `DELETE FROM stock_pe WHERE ${conditions}`,
        params
      );
      
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Import nhiều stock_pe từ CSV
  static async bulkImport(peData) {
    try {
      if (!peData || peData.length === 0) {
        return 0;
      }

      // Sử dụng INSERT ... ON DUPLICATE KEY UPDATE để xử lý trường hợp đã tồn tại
      const query = `
        INSERT INTO stock_pe 
        (symbol, date, pe, pe_nganh) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE 
        pe = VALUES(pe),
        pe_nganh = VALUES(pe_nganh)
      `;
      
      const values = peData.map(pe => [
        pe.symbol,
        pe.date,
        pe.pe,
        pe.pe_nganh
      ]);
      
      const [result] = await pool.query(query, [values]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockPE;
