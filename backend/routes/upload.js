const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../models/Media');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads/media');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to only allow images
const fileFilter = function(req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET /media - Get all media files (legacy support)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    // Truy vấn song song để cải thiện hiệu suất
    const [media, total] = await Promise.all([
      Media.findAll(limit, offset),
      Media.count()
    ]);

    res.json({
      media,
      total
    });
  } catch (err) {
    console.error('Error fetching media:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// GET /media/search - Search media files (legacy support)
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: 'Thiếu từ khóa tìm kiếm' });
    }

    const media = await Media.search(query);
    res.json(media);
  } catch (err) {
    console.error('Error searching media:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// POST /upload - Upload image (legacy support)
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: {
        message: 'Không có tệp nào được tải lên',
        code: 'no_file'
      }
    });
  }

  try {
    const filepath = `/uploads/media/${req.file.filename}`;

    // Sử dụng mô hình để lưu dữ liệu
    const mediaData = {
      filename: req.file.filename,
      filepath: filepath,
      mimetype: req.file.mimetype,
      size: req.file.size,
      title: req.body.title || req.file.originalname,
      alt_text: req.body.alt_text || '',
      caption: req.body.caption || '',
      user_id: req.user ? req.user.id : null
    };

    const media = await Media.create(mediaData);
    res.status(201).json(media);
  } catch (err) {
    console.error('Error uploading media:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// PUT /media/:id - Update media metadata (legacy support)
router.put('/media/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Kiểm tra nếu media tồn tại
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ message: 'Không tìm thấy tệp' });
    }

    // Cập nhật thông tin
    const updated = await Media.update(id, {
      title: req.body.title || media.title,
      alt_text: req.body.alt_text || media.alt_text,
      caption: req.body.caption || media.caption
    });

    if (!updated) {
      return res.status(500).json({ message: 'Không thể cập nhật tệp' });
    }

    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('Error updating media:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// DELETE /media/:id - Delete media (legacy support)
router.delete('/media/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Kiểm tra nếu media tồn tại
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ message: 'Không tìm thấy tệp' });
    }

    // Xóa file từ hệ thống
    const filepath = path.join(__dirname, '../public', media.filepath);
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    // Xóa khỏi cơ sở dữ liệu
    const deleted = await Media.delete(id);
    if (!deleted) {
      return res.status(500).json({ message: 'Không thể xóa tệp' });
    }

    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    console.error('Error deleting media:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router; 