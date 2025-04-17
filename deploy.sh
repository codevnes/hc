#!/bin/bash

# Xuất database
echo "Đang xuất dữ liệu database..."
chmod +x ./export_database.sh
./export_database.sh

# Tạo và chạy Docker
echo "Đang build và chạy các container Docker..."
docker-compose up -d --build

echo "Triển khai hoàn tất!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"

# Hiển thị logs
echo "Hiển thị logs của container (Ctrl+C để thoát):"
docker-compose logs -f 