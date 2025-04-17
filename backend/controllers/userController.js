const User = require('../models/User');
const { validationResult } = require('express-validator');

// Lấy tất cả người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy thông tin người dùng theo ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, role } = req.body;

  try {
    // Kiểm tra xem người dùng có tồn tại không
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra xem email đã tồn tại chưa (nếu thay đổi)
    if (email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }

    // Kiểm tra xem username đã tồn tại chưa (nếu thay đổi)
    if (username !== user.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Tên đăng nhập đã được sử dụng' });
      }
    }

    // Cập nhật thông tin người dùng
    const updated = await User.update(req.params.id, {
      username,
      email,
      role
    });

    if (!updated) {
      return res.status(500).json({ message: 'Không thể cập nhật người dùng' });
    }

    res.json({ message: 'Cập nhật người dùng thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Cập nhật mật khẩu người dùng
exports.updatePassword = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { password } = req.body;

  try {
    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Cập nhật mật khẩu
    const updated = await User.updatePassword(req.params.id, password);

    if (!updated) {
      return res.status(500).json({ message: 'Không thể cập nhật mật khẩu' });
    }

    res.json({ message: 'Cập nhật mật khẩu thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Xóa người dùng
    const deleted = await User.delete(req.params.id);

    if (!deleted) {
      return res.status(500).json({ message: 'Không thể xóa người dùng' });
    }

    res.json({ message: 'Xóa người dùng thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};
