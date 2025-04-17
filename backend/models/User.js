const pool = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  // Tìm người dùng theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm người dùng theo email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm người dùng theo tên đăng nhập
  static async findByUsername(username) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả người dùng
  static async findAll() {
    try {
      const [rows] = await pool.query('SELECT id, username, email, role, created_at, updated_at FROM users');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Tạo người dùng mới
  static async create(userData) {
    const { username, email, password, role = 'user' } = userData;
    
    try {
      // Mã hóa mật khẩu
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, role]
      );
      
      return { id: result.insertId, username, email, role };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin người dùng
  static async update(id, userData) {
    const { username, email, role } = userData;
    
    try {
      const [result] = await pool.query(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
        [username, email, role, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật mật khẩu
  static async updatePassword(id, newPassword) {
    try {
      // Mã hóa mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      const [result] = await pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa người dùng
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra mật khẩu
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;
