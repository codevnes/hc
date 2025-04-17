#!/bin/bash

# Thông số kết nối database
DB_USER="root"
DB_PASS="Timem.2302"
DB_NAME="hc_stock"
OUTPUT_DIR="./backend/database"

# Tạo thư mục nếu chưa tồn tại
mkdir -p "$OUTPUT_DIR"

# Export schema
echo "Đang xuất cấu trúc database..."
mysqldump -u $DB_USER -p$DB_PASS --no-data --skip-comments $DB_NAME > "$OUTPUT_DIR/create_tables.sql"

# Export dữ liệu
echo "Đang xuất dữ liệu..."
mysqldump -u $DB_USER -p$DB_PASS --no-create-info --skip-comments $DB_NAME > "$OUTPUT_DIR/data.sql"

echo "Xuất database hoàn tất!"
echo "Schema: $OUTPUT_DIR/create_tables.sql"
echo "Dữ liệu: $OUTPUT_DIR/data.sql"

# Cập nhật file init.sql
cat > "$OUTPUT_DIR/init.sql" << EOL
-- Tạo database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS hc_stock;
USE hc_stock;

-- Bao gồm các câu lệnh tạo bảng
SOURCE /docker-entrypoint-initdb.d/create_tables.sql;

-- Bao gồm dữ liệu
SOURCE /docker-entrypoint-initdb.d/data.sql;
EOL

echo "Đã tạo file init.sql" 