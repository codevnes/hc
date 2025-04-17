const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const pool = require('./config/db');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://frontend:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Test database connection
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Kết nối cơ sở dữ liệu thành công!');
    connection.release();
  } catch (error) {
    console.error('Lỗi kết nối cơ sở dữ liệu:', error);
    process.exit(1);
  }
}

// Routes
app.get('/', (req, res) => {
  res.send('API đang hoạt động');
});

// Import routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/stock-info', require('./routes/stockInfo'));

// Import new stock data routes
app.use('/api/stock-daily', require('./routes/stockDaily'));
app.use('/api/stock-assets', require('./routes/stockAssets'));
app.use('/api/stock-metrics', require('./routes/stockMetrics'));
app.use('/api/stock-eps', require('./routes/stockEPS'));
app.use('/api/stock-pe', require('./routes/stockPE'));

// Import profile route
app.use('/api/profile', require('./routes/profile'));

// Import media route
app.use('/api/media', require('./routes/media'));

// Legacy support for upload-server.js routes
app.use('/media', require('./routes/upload'));
app.use('/upload', require('./routes/upload'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  await testDbConnection();
});
