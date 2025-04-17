-- Thêm trường thumbnail_alt vào bảng posts
ALTER TABLE posts ADD COLUMN thumbnail_alt VARCHAR(255) DEFAULT '' AFTER thumbnail; 