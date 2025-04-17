const pool = require('../config/db');

class StockInfo {
  // Tìm stock info theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_info WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm stock info theo symbol
  static async findBySymbol(symbol) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM stock_info WHERE symbol = ?',
        [symbol]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả stock info với phân trang và tổng số bản ghi
  static async findAll(options = {}) {
    try {
      let countQuery = 'SELECT COUNT(*) as total FROM stock_info';
      let dataQuery = 'SELECT * FROM stock_info';
      const countParams = [];
      const dataParams = [];
      let whereClause = '';

      // Add WHERE clause if provided
      if (options.where) {
        const whereConditions = [];

        // Handle ID search
        if (options.where.id) {
          whereConditions.push('id = ?');
          countParams.push(options.where.id);
          dataParams.push(options.where.id);
        }

        // Handle symbol search
        if (options.where.symbol) {
          whereConditions.push('symbol LIKE ?');
          countParams.push(`%${options.where.symbol}%`);
          dataParams.push(`%${options.where.symbol}%`);
        }

        // Handle name search
        if (options.where.name) {
          whereConditions.push('name LIKE ?');
          countParams.push(`%${options.where.name}%`);
          dataParams.push(`%${options.where.name}%`);
        }

        // Add OR conditions if needed
        if (options.where.or && Array.isArray(options.where.or)) {
          const orConditions = [];
          options.where.or.forEach(condition => {
            if (condition.id) {
              orConditions.push('id = ?');
              countParams.push(condition.id);
              dataParams.push(condition.id);
            }
            if (condition.symbol) {
              orConditions.push('symbol LIKE ?');
              countParams.push(`%${condition.symbol}%`);
              dataParams.push(`%${condition.symbol}%`);
            }
            if (condition.name) {
              orConditions.push('name LIKE ?');
              countParams.push(`%${condition.name}%`);
              dataParams.push(`%${condition.name}%`);
            }
          });

          if (orConditions.length > 0) {
            whereConditions.push(`(${orConditions.join(' OR ')})`);
          }
        }

        if (whereConditions.length > 0) {
          whereClause = ' WHERE ' + whereConditions.join(' AND ');
          countQuery += whereClause;
          dataQuery += whereClause;
        }
      }

      // Add ORDER BY clause if provided
      if (options.orderBy) {
        dataQuery += ` ORDER BY ${options.orderBy}`;
      } else {
        dataQuery += ' ORDER BY symbol';
      }

      // Add LIMIT and OFFSET if provided
      if (options.limit) {
        dataQuery += ' LIMIT ?';
        dataParams.push(options.limit);

        if (options.offset !== undefined) {
          dataQuery += ' OFFSET ?';
          dataParams.push(options.offset);
        }
      }

      // Get total count
      const [countResult] = await pool.query(countQuery, countParams);
      const totalCount = countResult[0].total;

      // Get data with pagination
      const [rows] = await pool.query(dataQuery, dataParams);

      return {
        data: rows,
        totalCount,
        page: options.offset !== undefined && options.limit ? Math.floor(options.offset / options.limit) + 1 : 1,
        limit: options.limit || rows.length,
        totalPages: options.limit ? Math.ceil(totalCount / options.limit) : 1
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy tổng số bản ghi stock info
  static async getCount(whereOptions = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM stock_info';
      const params = [];

      // Add WHERE clause if provided
      if (Object.keys(whereOptions).length > 0) {
        const whereConditions = [];

        Object.entries(whereOptions).forEach(([key, value]) => {
          if (key === 'symbol' || key === 'name') {
            whereConditions.push(`${key} LIKE ?`);
            params.push(`%${value}%`);
          } else if (key === 'id') {
            whereConditions.push(`${key} = ?`);
            params.push(value);
          }
        });

        if (whereConditions.length > 0) {
          query += ' WHERE ' + whereConditions.join(' AND ');
        }
      }

      const [result] = await pool.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Tìm kiếm nâng cao với ưu tiên kết quả
  static async search(searchTerm, limit = 10) {
    try {
      // Chuẩn hóa searchTerm
      const term = searchTerm.trim().toLowerCase();

      // Tạo các tham số tìm kiếm
      const exactSymbol = term;
      const partialSymbol = `%${term}%`;
      const partialName = `%${term}%`;

      // Truy vấn với ưu tiên kết quả
      // 1. Ưu tiên symbol khớp chính xác
      // 2. Ưu tiên symbol bắt đầu bằng searchTerm
      // 3. Ưu tiên symbol chứa searchTerm
      // 4. Ưu tiên tên chứa searchTerm
      const query = `
        SELECT id, symbol, name,
          CASE
            WHEN LOWER(symbol) = ? THEN 1
            WHEN LOWER(symbol) LIKE ? THEN 2
            WHEN LOWER(symbol) LIKE ? THEN 3
            WHEN LOWER(name) LIKE ? THEN 4
            ELSE 5
          END AS priority
        FROM stock_info
        WHERE
          LOWER(symbol) = ? OR
          LOWER(symbol) LIKE ? OR
          LOWER(symbol) LIKE ? OR
          LOWER(name) LIKE ?
        ORDER BY priority ASC, symbol ASC
        LIMIT ?
      `;

      const [rows] = await pool.query(query, [
        exactSymbol,         // CASE WHEN symbol = term
        `${term}%`,          // CASE WHEN symbol LIKE 'term%'
        partialSymbol,       // CASE WHEN symbol LIKE '%term%'
        partialName,         // CASE WHEN name LIKE '%term%'
        exactSymbol,         // WHERE symbol = term
        `${term}%`,          // WHERE symbol LIKE 'term%'
        partialSymbol,       // WHERE symbol LIKE '%term%'
        partialName,         // WHERE name LIKE '%term%'
        limit                // LIMIT
      ]);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo stock info mới
  static async create(stockInfoData) {
    try {
      const { symbol, name, description } = stockInfoData;

      const query = `
        INSERT INTO stock_info (symbol, name, description)
        VALUES (?, ?, ?)
      `;

      const [result] = await pool.query(query, [symbol, name, description]);

      return {
        id: result.insertId,
        symbol,
        name,
        description
      };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật stock info
  static async update(id, stockInfoData) {
    try {
      const { symbol, name, description } = stockInfoData;

      const query = `
        UPDATE stock_info
        SET symbol = ?, name = ?, description = ?
        WHERE id = ?
      `;

      await pool.query(query, [symbol, name, description, id]);

      // Lấy dữ liệu đã cập nhật
      const [rows] = await pool.query('SELECT * FROM stock_info WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Xóa stock info
  static async delete(id) {
    try {
      const query = 'DELETE FROM stock_info WHERE id = ?';
      const [result] = await pool.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockInfo;
