const pool = require('../config/db');

class Category {
  // Tìm danh mục theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm danh mục theo slug
  static async findBySlug(slug) {
    try {
      const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả danh mục
  static async findAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo danh mục mới
  static async create(categoryData) {
    const { name, description, slug } = categoryData;
    let finalSlug = slug;

    // Nếu không có slug, tạo từ tên
    if (!finalSlug) {
      finalSlug = name.toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, '-')        // Thay khoảng trắng bằng dấu gạch ngang
        .replace(/[^\w\-]+/g, '')     // Xóa tất cả ký tự không phải chữ cái, số, gạch ngang
        .replace(/\-\-+/g, '-')       // Thay nhiều dấu gạch ngang liên tiếp bằng một dấu
        .replace(/^-+/, '')           // Xóa dấu gạch ngang ở đầu
        .replace(/-+$/, '');          // Xóa dấu gạch ngang ở cuối
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [name, finalSlug, description]
      );

      return { id: result.insertId, name, slug: finalSlug, description };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin danh mục
  static async update(id, categoryData) {
    const { name, description, slug } = categoryData;
    let finalSlug = slug;

    // Nếu không có slug, tạo từ tên
    if (!finalSlug) {
      finalSlug = name.toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, '-')        // Thay khoảng trắng bằng dấu gạch ngang
        .replace(/[^\w\-]+/g, '')     // Xóa tất cả ký tự không phải chữ cái, số, gạch ngang
        .replace(/\-\-+/g, '-')       // Thay nhiều dấu gạch ngang liên tiếp bằng một dấu
        .replace(/^-+/, '')           // Xóa dấu gạch ngang ở đầu
        .replace(/-+$/, '');          // Xóa dấu gạch ngang ở cuối
    }

    try {
      const [result] = await pool.query(
        'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
        [name, finalSlug, description, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa danh mục
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Category;
