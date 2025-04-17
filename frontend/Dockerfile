FROM node:18-alpine AS base

# Cài đặt dependencies
FROM base AS deps
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package.json package-lock.json* ./
RUN npm ci

# Bước build ứng dụng
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Định nghĩa ARG cho biến môi trường build-time
ARG API_URL
ARG NEXT_PUBLIC_TINYMCE_API_KEY

# Tạo file .env.local từ các biến môi trường
RUN echo "API_URL=${API_URL}" > .env.local
RUN echo "NEXT_PUBLIC_TINYMCE_API_KEY=${NEXT_PUBLIC_TINYMCE_API_KEY}" >> .env.local

# Build ứng dụng
RUN npm run build

# Bước chạy ứng dụng
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Sao chép thư mục public
COPY --from=builder /app/public ./public

# Sao chép các file build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]