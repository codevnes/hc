const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
require('dotenv').config();

// Đăng ký người dùng mới
exports.register = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Kiểm tra xem email đã tồn tại chưa
    let user = await User.findByEmail(email);
    if (user) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Kiểm tra xem username đã tồn tại chưa
    user = await User.findByUsername(username);
    if (user) {
      return res.status(400).json({ message: 'Tên đăng nhập đã được sử dụng' });
    }

    // Tạo người dùng mới
    user = await User.create({
      username,
      email,
      password,
      role: 'user' // Mặc định là user
    });

    // Tạo JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  // Kiểm tra lỗi validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    console.log('Login attempt:', { email });

    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(400).json({ message: 'Thông tin đăng nhập không hợp lệ' });
    }

    // Kiểm tra mật khẩu
    console.log('Comparing password...');
    const isMatch = await User.comparePassword(password, user.password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');

    if (!isMatch) {
      return res.status(400).json({ message: 'Thông tin đăng nhập không hợp lệ' });
    }

    // Tạo JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy thông tin người dùng hiện tại
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};
