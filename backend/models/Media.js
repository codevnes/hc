const pool = require('../config/db');

class Media {
  // Find media by ID
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM media WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all media files
  static async findAll(limit = 50, offset = 0) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM media ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Count total media records
  static async count() {
    try {
      const [result] = await pool.query('SELECT COUNT(*) as total FROM media');
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Create new media entry
  static async create(mediaData) {
    const { filename, filepath, mimetype, size, alt_text, title, caption, user_id } = mediaData;
    
    try {
      const [result] = await pool.query(
        'INSERT INTO media (filename, filepath, mimetype, size, alt_text, title, caption, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [filename, filepath, mimetype, size, alt_text, title, caption, user_id]
      );
      
      return {
        id: result.insertId,
        filename,
        filepath,
        mimetype,
        size,
        alt_text,
        title,
        caption,
        user_id,
        created_at: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  // Update media metadata
  static async update(id, mediaData) {
    const { alt_text, title, caption } = mediaData;
    
    try {
      const [result] = await pool.query(
        'UPDATE media SET alt_text = ?, title = ?, caption = ? WHERE id = ?',
        [alt_text, title, caption, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete media
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM media WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Search media by filename or title
  static async search(query, limit = 20) {
    try {
      const searchTerm = `%${query}%`;
      const [rows] = await pool.query(
        'SELECT * FROM media WHERE filename LIKE ? OR title LIKE ? OR alt_text LIKE ? ORDER BY created_at DESC LIMIT ?',
        [searchTerm, searchTerm, searchTerm, limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy chỉ các hình ảnh (các file có mimetype bắt đầu với 'image/')
  static async findImages(limit = 20, offset = 0) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM media 
         WHERE mimetype LIKE 'image/%' 
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Đếm tổng số hình ảnh
  static async countImages() {
    try {
      const [result] = await pool.query("SELECT COUNT(*) as total FROM media WHERE mimetype LIKE 'image/%'");
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Media;
