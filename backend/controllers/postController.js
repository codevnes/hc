const Post = require('../models/Post');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Lấy tất cả bài viết
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.findAll();
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy bài viết theo ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy bài viết theo slug
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy bài viết theo slug của danh mục
exports.getPostsByCategorySlug = async (req, res) => {
  try {
    const posts = await Post.findByCategorySlug(req.params.categorySlug);
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy bài viết theo danh mục
exports.getPostsByCategory = async (req, res) => {
  try {
    // Kiểm tra xem danh mục có tồn tại không
    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    const posts = await Post.findByCategory(req.params.categoryId);
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Lấy bài viết của người dùng hiện tại
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.findByUser(req.user.id);
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};

// Tạo bài viết mới
exports.createPost = async (req, res) => {
  try {
    const { title, content, category_id, slug, thumbnail_url, thumbnail_alt } = req.body;
    let thumbnailPath = null;
    
    // Check if thumbnail file is uploaded
    if (req.file) {
      thumbnailPath = `/uploads/posts/${req.file.filename}`;
    } 
    // Check if thumbnail URL is provided (from media library)
    else if (thumbnail_url) {
      thumbnailPath = thumbnail_url;
    }

    // Create the post
    const post = await Post.create({
      title,
      content,
      category_id,
      slug: slug || generateSlug(title),
      thumbnail: thumbnailPath,
      thumbnail_alt: thumbnail_alt || '',
      user_id: req.user.id
    });

    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Cập nhật bài viết
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category_id, slug, thumbnail_url, thumbnail_alt, remove_thumbnail } = req.body;
    
    // Check if post exists
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
    
    // Check if user is the author or admin
    if (existingPost.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa bài viết này' });
    }
    
    // Handle thumbnail
    let thumbnailPath = existingPost.thumbnail;

    // If a new file is uploaded
    if (req.file) {
      thumbnailPath = `/uploads/posts/${req.file.filename}`;
      
      // Delete old thumbnail if exists and is local
      if (existingPost.thumbnail && !existingPost.thumbnail.startsWith('http')) {
        const oldThumbnailPath = path.join(__dirname, '..', 'public', existingPost.thumbnail);
        if (fs.existsSync(oldThumbnailPath)) {
          fs.unlinkSync(oldThumbnailPath);
        }
      }
    } 
    // If a thumbnail URL is provided (from media library)
    else if (thumbnail_url) {
      thumbnailPath = thumbnail_url;
    }
    // If remove_thumbnail is set to true
    else if (remove_thumbnail === 'true') {
      thumbnailPath = null;
      
      // Delete old thumbnail if exists and is local
      if (existingPost.thumbnail && !existingPost.thumbnail.startsWith('http')) {
        const oldThumbnailPath = path.join(__dirname, '..', 'public', existingPost.thumbnail);
        if (fs.existsSync(oldThumbnailPath)) {
          fs.unlinkSync(oldThumbnailPath);
        }
      }
    }
    
    // Update post
    const updatedPost = await Post.update(id, {
      title,
      content,
      category_id,
      slug: slug || existingPost.slug,
      thumbnail: thumbnailPath,
      thumbnail_alt: thumbnail_alt !== undefined ? thumbnail_alt : existingPost.thumbnail_alt
    });
    
    res.json(updatedPost);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Xóa bài viết
exports.deletePost = async (req, res) => {
  try {
    // Kiểm tra xem bài viết có tồn tại không
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    // Kiểm tra quyền (chỉ tác giả hoặc admin mới có thể xóa)
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xóa bài viết này' });
    }

    // Xóa bài viết
    const deleted = await Post.delete(req.params.id);

    if (!deleted) {
      return res.status(500).json({ message: 'Không thể xóa bài viết' });
    }

    res.json({ message: 'Xóa bài viết thành công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi máy chủ');
  }
};
