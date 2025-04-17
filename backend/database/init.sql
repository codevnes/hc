-- Tạo database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS hc_stock;
USE hc_stock;

-- Bao gồm các câu lệnh tạo bảng
SOURCE /docker-entrypoint-initdb.d/create_tables.sql; 