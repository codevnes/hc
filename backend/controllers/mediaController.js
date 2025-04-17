const Media = require('../models/Media');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

// Get all media files
exports.getAllMedia = async (req, res) => {
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
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Get media by ID
exports.getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Không tìm thấy tệp' });
    }
    res.json(media);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Upload new media
exports.uploadMedia = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Không có tệp nào được tải lên' });
  }

  try {
    const { alt_text, title, caption } = req.body;
    
    // Create media record
    const media = await Media.create({
      filename: req.file.filename,
      filepath: `/uploads/media/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
      alt_text: alt_text || '',
      title: title || req.file.originalname,
      caption: caption || '',
      user_id: req.user.id
    });

    res.status(201).json(media);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Update media metadata
exports.updateMedia = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { alt_text, title, caption } = req.body;

  try {
    // Check if media exists
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Không tìm thấy tệp' });
    }

    // Check permissions (only owner or admin can update)
    if (media.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền cập nhật tệp này' });
    }

    // Update media
    const updated = await Media.update(req.params.id, {
      alt_text: alt_text || media.alt_text,
      title: title || media.title,
      caption: caption || media.caption
    });

    if (!updated) {
      return res.status(500).json({ message: 'Không thể cập nhật tệp' });
    }

    res.json({ message: 'Cập nhật tệp thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Delete media
exports.deleteMedia = async (req, res) => {
  try {
    // Check if media exists
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Không tìm thấy tệp' });
    }

    // Check permissions (only owner or admin can delete)
    if (media.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xóa tệp này' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', 'public', media.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    const deleted = await Media.delete(req.params.id);
    if (!deleted) {
      return res.status(500).json({ message: 'Không thể xóa tệp' });
    }

    res.json({ message: 'Xóa tệp thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Search media
exports.searchMedia = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: 'Thiếu từ khóa tìm kiếm' });
    }

    const limit = parseInt(req.query.limit) || 20;
    const media = await Media.search(query, limit);
    
    res.json(media);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Upload media for TinyMCE editor
exports.uploadEditorMedia = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      error: { 
        message: 'Không có tệp nào được tải lên',
        code: 'no_file'
      } 
    });
  }

  try {
    // Create media record
    const media = await Media.create({
      filename: req.file.filename,
      filepath: `/uploads/media/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
      alt_text: '',
      title: req.file.originalname,
      caption: '',
      user_id: req.user.id
    });

    // Return in format expected by TinyMCE
    res.json({
      location: `http://localhost:5000${media.filepath}`, // Adjust URL as needed
      id: media.id,
      title: media.title,
      alt: media.alt_text
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: { 
        message: 'Lỗi máy chủ',
        code: 'server_error'
      } 
    });
  }
};

// Get all images for editor 
exports.getImagesForEditor = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';
    
    let media;
    let total;
    
    if (search) {
      media = await Media.search(search, limit);
      // Lọc lại chỉ lấy các ảnh
      media = media.filter(item => item.mimetype.startsWith('image/'));
    } else {
      // Sử dụng phương thức mới
      [media, total] = await Promise.all([
        Media.findImages(limit, offset),
        Media.countImages()
      ]);
    }
    
    // Format lại danh sách cho trình soạn thảo
    const formattedMedia = media.map(item => ({
      value: item.id.toString(),
      title: item.title || item.filename,
      url: `http://localhost:5000${item.filepath}`,
      alt: item.alt_text || '',
      thumbnail: `http://localhost:5000${item.filepath}`,
      createdAt: item.created_at
    }));
    
    res.json({
      items: formattedMedia,
      total: total || formattedMedia.length
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách ảnh:', err.message);
    res.status(500).json({ 
      error: { 
        message: 'Lỗi máy chủ',
        code: 'server_error'
      } 
    });
  }
};

// Select media for editor
exports.selectMediaForEditor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ 
        error: { 
          message: 'Không tìm thấy tệp',
          code: 'not_found'
        } 
      });
    }
    
    // Trả về định dạng phù hợp với trình soạn thảo
    res.json({
      location: `http://localhost:5000${media.filepath}`,
      id: media.id,
      title: media.title || media.filename,
      alt: media.alt_text || '',
      caption: media.caption || ''
    });
  } catch (err) {
    console.error('Lỗi khi chọn ảnh:', err.message);
    res.status(500).json({ 
      error: { 
        message: 'Lỗi máy chủ',
        code: 'server_error'
      } 
    });
  }
};
