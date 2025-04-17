FROM node:18-alpine

WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package.json package-lock.json ./

# Cài đặt dependencies
RUN npm ci --only=production

# Sao chép source code
COPY . .

# Tạo thư mục uploads nếu chưa có
RUN mkdir -p uploads

# Mở cổng 5000
EXPOSE 5000

# Chạy ứng dụng
CMD ["node", "server.js"] 