-- Thêm cột ID cho bảng stocks
ALTER TABLE stocks
ADD COLUMN id BIGINT AUTO_INCREMENT FIRST,
DROP PRIMARY KEY,
ADD PRIMARY KEY (id),
ADD UNIQUE KEY unique_symbol_date (symbol, date);

-- Thêm cột ID cho bảng stock_daily
ALTER TABLE stock_daily
ADD COLUMN id BIGINT AUTO_INCREMENT FIRST,
DROP PRIMARY KEY,
ADD PRIMARY KEY (id),
ADD UNIQUE KEY unique_symbol_date (symbol, date);

-- Thêm cột ID cho bảng stock_assets
ALTER TABLE stock_assets
ADD COLUMN id BIGINT AUTO_INCREMENT FIRST,
DROP PRIMARY KEY,
ADD PRIMARY KEY (id),
ADD UNIQUE KEY unique_symbol_date (symbol, date);

-- Thêm cột ID cho bảng stock_metrics
ALTER TABLE stock_metrics
ADD COLUMN id BIGINT AUTO_INCREMENT FIRST,
DROP PRIMARY KEY,
ADD PRIMARY KEY (id),
ADD UNIQUE KEY unique_symbol_date (symbol, date);

-- Thêm cột ID cho bảng stock_eps
ALTER TABLE stock_eps
ADD COLUMN id BIGINT AUTO_INCREMENT FIRST,
DROP PRIMARY KEY,
ADD PRIMARY KEY (id),
ADD UNIQUE KEY unique_symbol_date (symbol, date);

-- Thêm cột ID cho bảng stock_pe
ALTER TABLE stock_pe
ADD COLUMN id BIGINT AUTO_INCREMENT FIRST,
DROP PRIMARY KEY,
ADD PRIMARY KEY (id),
ADD UNIQUE KEY unique_symbol_date (symbol, date); 