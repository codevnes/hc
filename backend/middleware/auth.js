const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware để xác thực token
const auth = (req, res, next) => {
  // Lấy token từ header
  const token = req.header('x-auth-token');

  // Kiểm tra nếu không có token
  if (!token) {
    return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối' });
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Thêm thông tin người dùng vào request
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Middleware để kiểm tra quyền admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Quyền truy cập bị từ chối, yêu cầu quyền admin' });
  }
};

module.exports = { auth, admin };
