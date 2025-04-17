const pool = require('../config/db');
const slugify = require('slugify');

class Post {
  // Tìm bài viết theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, u.username, c.name as category_name 
        FROM posts p 
        LEFT JOIN users u ON p.user_id = u.id 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `, [id]);
      
      // Format thumbnail URL if it's relative path
      if (rows.length > 0 && rows[0].thumbnail && !rows[0].thumbnail.startsWith('http')) {
        rows[0].thumbnail = rows[0].thumbnail;
      }
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm bài viết theo slug
  static async findBySlug(slug) {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, u.username, c.name as category_name, c.slug as category_slug
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ?
      `, [slug]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tạo bài viết mới
  static async create({ title, content, user_id, category_id, thumbnail, thumbnail_alt, slug }) {
    try {
      // Generate slug if not provided
      if (!slug) {
        slug = slugify(title, {
          lower: true,
          strict: true,
          locale: 'vi'
        });
      }
      
      const [result] = await pool.query(
        'INSERT INTO posts (title, content, user_id, category_id, thumbnail, thumbnail_alt, slug) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, content, user_id, category_id, thumbnail, thumbnail_alt || '', slug]
      );
      
      return {
        id: result.insertId,
        title,
        content,
        user_id,
        category_id,
        thumbnail,
        thumbnail_alt: thumbnail_alt || '',
        slug,
        created_at: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật bài viết
  static async update(id, { title, content, category_id, thumbnail, thumbnail_alt, slug }) {
    try {
      const [result] = await pool.query(
        'UPDATE posts SET title = ?, content = ?, category_id = ?, thumbnail = ?, thumbnail_alt = ?, slug = ?, updated_at = NOW() WHERE id = ?',
        [title, content, category_id, thumbnail, thumbnail_alt || '', slug, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      // Fetch updated post
      const [rows] = await pool.query(
        'SELECT * FROM posts WHERE id = ?',
        [id]
      );
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm tất cả bài viết với phân trang
  static async findAll(limit = 10, offset = 0, search = '', category_id = null) {
    try {
      let query = `
        SELECT p.*, u.username, c.name as category_name 
        FROM posts p 
        LEFT JOIN users u ON p.user_id = u.id 
        LEFT JOIN categories c ON p.category_id = c.id
      `;
      
      const queryParams = [];
      
      // Add search condition if provided
      if (search) {
        query += ' WHERE (p.title LIKE ? OR p.content LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }
      
      // Add category filter if provided
      if (category_id) {
        query += search ? ' AND p.category_id = ?' : ' WHERE p.category_id = ?';
        queryParams.push(category_id);
      }
      
      // Add order and pagination
      query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      const [rows] = await pool.query(query, queryParams);
      
      // Format thumbnail URLs if they're relative paths
      rows.forEach(post => {
        if (post.thumbnail && !post.thumbnail.startsWith('http')) {
          post.thumbnail = post.thumbnail;
        }
      });
      
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Đếm tổng số bài viết (cho phân trang)
  static async count(search = '', category_id = null) {
    try {
      let query = 'SELECT COUNT(*) as total FROM posts';
      const queryParams = [];
      
      // Add search condition if provided
      if (search) {
        query += ' WHERE (title LIKE ? OR content LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }
      
      // Add category filter if provided
      if (category_id) {
        query += search ? ' AND category_id = ?' : ' WHERE category_id = ?';
        queryParams.push(category_id);
      }
      
      const [result] = await pool.query(query, queryParams);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Lấy bài viết theo danh mục
  static async findByCategory(categoryId) {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, u.username, c.name as category_name, c.slug as category_slug
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ?
        ORDER BY p.created_at DESC
      `, [categoryId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy bài viết theo slug của danh mục
  static async findByCategorySlug(categorySlug) {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, u.username, c.name as category_name, c.slug as category_slug
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
        WHERE c.slug = ?
        ORDER BY p.created_at DESC
      `, [categorySlug]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy bài viết theo người dùng
  static async findByUser(userId) {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, u.username, c.name as category_name, c.slug as category_slug
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Xóa bài viết
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Post;
