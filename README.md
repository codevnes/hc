# HC Stock

Ứng dụng quản lý và hiển thị thông tin chứng khoán.

## Cài đặt trên môi trường phát triển

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Triển khai lên VPS

### Yêu cầu

- Docker và Docker Compose đã được cài đặt trên VPS
- Git đã được cài đặt trên VPS

### Bước 1: Clone repository

```bash
git clone https://github.com/your-username/hc-stock.git
cd hc-stock
```

### Bước 2: Cấu hình môi trường

Chỉnh sửa file `.env` để cấu hình đúng:

```
# Thay domain.com bằng tên miền hoặc IP của VPS
API_URL=http://domain.com:5000/api
CORS_ORIGINS=http://localhost:3000,http://domain.com:3000,http://domain.com
```

### Bước 3: Xuất dữ liệu và triển khai

```bash
# Cấp quyền thực thi cho script
chmod +x deploy.sh
chmod +x export_database.sh

# Chạy script triển khai
./deploy.sh
```

### Bước 4: Truy cập ứng dụng

- Frontend: http://domain.com:3000
- Backend: http://domain.com:5000

## Quản lý Docker

### Xem logs

```bash
docker-compose logs -f
```

### Dừng dịch vụ

```bash
docker-compose down
```

### Khởi động lại dịch vụ

```bash
docker-compose up -d
```

### Rebuild khi có cập nhật mã nguồn

```bash
docker-compose up -d --build
```

## Gỡ lỗi

### Kiểm tra trạng thái container

```bash
docker-compose ps
```

### Kiểm tra logs của từng dịch vụ

```bash
docker-compose logs frontend
docker-compose logs backend
docker-compose logs db
```

### Truy cập vào container

```bash
docker-compose exec frontend sh
docker-compose exec backend sh
docker-compose exec db bash
``` 