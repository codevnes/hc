const pool = require('../config/db');

class StockAssets {
  // Tìm stock_assets theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_assets WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm stock_assets theo symbol và date
  static async findBySymbolAndDate(symbol, date) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_assets WHERE symbol = ? AND date = ?',
        [symbol, date]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả stock_assets
  static async findAll(limit = 100, offset = 0) {
    try {
      const [rows] = await pool.query(
        `SELECT sa.*, si.name as stock_name 
         FROM stock_assets sa
         JOIN stock_info si ON sa.symbol = si.symbol
         ORDER BY sa.date DESC, sa.symbol
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_assets theo symbol
  static async findBySymbol(symbol) {
    try {
      const [rows] = await pool.query(
        `SELECT sa.*, si.name as stock_name 
         FROM stock_assets sa
         JOIN stock_info si ON sa.symbol = si.symbol
         WHERE sa.symbol = ?
         ORDER BY sa.date DESC`,
        [symbol]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_assets theo date
  static async findByDate(date) {
    try {
      const [rows] = await pool.query(
        `SELECT sa.*, si.name as stock_name 
         FROM stock_assets sa
         JOIN stock_info si ON sa.symbol = si.symbol
         WHERE sa.date = ?
         ORDER BY sa.symbol`,
        [date]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_assets theo khoảng thời gian
  static async findByDateRange(startDate, endDate, symbol = null) {
    try {
      let query = `
        SELECT sa.*, si.name as stock_name 
        FROM stock_assets sa
        JOIN stock_info si ON sa.symbol = si.symbol
        WHERE sa.date BETWEEN ? AND ?
      `;
      
      const params = [startDate, endDate];
      
      if (symbol) {
        query += ' AND sa.symbol = ?';
        params.push(symbol);
      }
      
      query += ' ORDER BY sa.date DESC, sa.symbol';
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo stock_assets mới
  static async create(assetData) {
    const { 
      symbol, 
      date, 
      tts, 
      vcsh, 
      tb_tts_nganh
    } = assetData;
    
    try {
      const [result] = await pool.query(
        `INSERT INTO stock_assets 
         (symbol, date, tts, vcsh, tb_tts_nganh) 
         VALUES (?, ?, ?, ?, ?)`,
        [symbol, date, tts, vcsh, tb_tts_nganh]
      );
      
      return { ...assetData };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin stock_assets bằng ID
  static async updateById(id, assetData) {
    const { 
      symbol, 
      date,
      tts, 
      vcsh, 
      tb_tts_nganh
    } = assetData;
    
    try {
      const [result] = await pool.query(
        `UPDATE stock_assets 
         SET symbol = ?, date = ?, tts = ?, vcsh = ?, tb_tts_nganh = ?
         WHERE id = ?`,
        [symbol, date, tts, vcsh, tb_tts_nganh, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa stock_assets bằng ID
  static async deleteById(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM stock_assets WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa nhiều stock_assets
  static async deleteMultiple(items) {
    try {
      if (!items || items.length === 0) {
        return 0;
      }

      // Tạo câu truy vấn với nhiều điều kiện OR
      const conditions = items.map(item => `(symbol = ? AND date = ?)`).join(' OR ');
      const params = items.flatMap(item => [item.symbol, item.date]);
      
      const [result] = await pool.query(
        `DELETE FROM stock_assets WHERE ${conditions}`,
        params
      );
      
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Import nhiều stock_assets từ CSV
  static async bulkImport(assetsData) {
    try {
      if (!assetsData || assetsData.length === 0) {
        return 0;
      }

      // Sử dụng INSERT ... ON DUPLICATE KEY UPDATE để xử lý trường hợp đã tồn tại
      const query = `
        INSERT INTO stock_assets 
        (symbol, date, tts, vcsh, tb_tts_nganh) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE 
        tts = VALUES(tts),
        vcsh = VALUES(vcsh),
        tb_tts_nganh = VALUES(tb_tts_nganh)
      `;
      
      const values = assetsData.map(asset => [
        asset.symbol,
        asset.date,
        asset.tts,
        asset.vcsh,
        asset.tb_tts_nganh
      ]);
      
      const [result] = await pool.query(query, [values]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockAssets;
