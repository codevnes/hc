const pool = require('../config/db');

class StockDaily {
  // Tìm stock_daily theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT sd.*, si.name as stock_name
         FROM stock_daily sd
         JOIN stock_info si ON sd.symbol = si.symbol
         WHERE sd.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả stock_daily
  static async findAll(limit = 100, offset = 0) {
    try {
      const [rows] = await pool.query(
        `SELECT sd.*, si.name as stock_name
         FROM stock_daily sd
         JOIN stock_info si ON sd.symbol = si.symbol
         ORDER BY sd.symbol
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy stock_daily theo symbol
  static async findBySymbol(symbol) {
    try {
      const [rows] = await pool.query(
        `SELECT sd.*, si.name as stock_name
         FROM stock_daily sd
         JOIN stock_info si ON sd.symbol = si.symbol
         WHERE sd.symbol = ?
         ORDER BY sd.id DESC`,
        [symbol]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo stock_daily mới
  static async create(stockData) {
    const {
      symbol,
      close_price,
      return_value,
      kldd,
      von_hoa,
      pe,
      roa,
      roe,
      eps
    } = stockData;

    try {
      const [result] = await pool.query(
        `INSERT INTO stock_daily
         (symbol, close_price, return_value, kldd, von_hoa, pe, roa, roe, eps)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [symbol, close_price, return_value, kldd, von_hoa, pe, roa, roe, eps]
      );

      return { id: result.insertId, ...stockData };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin stock_daily bằng ID
  static async updateById(id, stockData) {
    const {
      symbol,
      close_price,
      return_value,
      kldd,
      von_hoa,
      pe,
      roa,
      roe,
      eps
    } = stockData;

    try {
      const [result] = await pool.query(
        `UPDATE stock_daily
         SET symbol = ?, close_price = ?, return_value = ?, kldd = ?, von_hoa = ?,
             pe = ?, roa = ?, roe = ?, eps = ?
         WHERE id = ?`,
        [symbol, close_price, return_value, kldd, von_hoa, pe, roa, roe, eps, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa stock_daily bằng ID
  static async deleteById(id) {
    try {
      const [result] = await pool.query(
        'DELETE FROM stock_daily WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa nhiều stock_daily theo ID
  static async deleteMultiple(ids) {
    try {
      if (!ids || ids.length === 0) {
        return 0;
      }

      const placeholders = ids.map(() => '?').join(',');
      const [result] = await pool.query(
        `DELETE FROM stock_daily WHERE id IN (${placeholders})`,
        ids
      );

      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Import nhiều stock_daily
  static async bulkImport(stocksData) {
    try {
      if (!stocksData || stocksData.length === 0) {
        return 0;
      }

      // Sử dụng INSERT ... ON DUPLICATE KEY UPDATE để xử lý trường hợp đã tồn tại
      const query = `
        INSERT INTO stock_daily
        (id, symbol, close_price, return_value, kldd, von_hoa, pe, roa, roe, eps)
        VALUES ?
        ON DUPLICATE KEY UPDATE
        symbol = VALUES(symbol),
        close_price = VALUES(close_price),
        return_value = VALUES(return_value),
        kldd = VALUES(kldd),
        von_hoa = VALUES(von_hoa),
        pe = VALUES(pe),
        roa = VALUES(roa),
        roe = VALUES(roe),
        eps = VALUES(eps)
      `;

      const values = stocksData.map(stock => [
        stock.id || null,
        stock.symbol,
        stock.close_price,
        stock.return_value,
        stock.kldd,
        stock.von_hoa,
        stock.pe,
        stock.roa,
        stock.roe,
        stock.eps
      ]);

      const [result] = await pool.query(query, [values]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockDaily;
