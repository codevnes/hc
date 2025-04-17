const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../models/Media');
const mediaController = require('../controllers/mediaController');

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

// GET /api/media - Get all media files with pagination
router.get('/', mediaController.getAllMedia);

// GET /api/media/search - Search media files
router.get('/search', auth, mediaController.searchMedia);

// GET /api/media/:id - Get media by ID
router.get('/:id', auth, mediaController.getMediaById);

// POST /api/media - Upload new media
router.post('/', auth, upload.single('file'), mediaController.uploadMedia);

// POST /api/media/editor - Upload media for TinyMCE editor
router.post('/editor', auth, upload.single('file'), mediaController.uploadEditorMedia);

// GET /api/media/editor/images - Get images for editor
router.get('/editor/images', auth, mediaController.getImagesForEditor);

// GET /api/media/editor/select/:id - Select existing media for editor
router.get('/editor/select/:id', auth, mediaController.selectMediaForEditor);

// POST /upload - Legacy support for the standalone upload server
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: {
        message: 'Không có tệp nào được tải lên',
        code: 'no_file'
      }
    });
  }

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

  Media.create(mediaData)
    .then(media => {
      res.status(201).json(media);
    })
    .catch(err => {
      console.error('Error uploading media:', err);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    });
});

// PUT /api/media/:id - Update media metadata
router.put('/:id', auth, mediaController.updateMedia);

// DELETE /api/media/:id - Delete media
router.delete('/:id', auth, mediaController.deleteMedia);

module.exports = router;
