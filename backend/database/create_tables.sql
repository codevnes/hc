-- Bảng 2: Dữ liệu giao dịch hàng ngày
CREATE TABLE IF NOT EXISTS stock_daily (
    symbol VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    close_price DECIMAL(10, 2) NOT NULL,
    return_value DECIMAL(10, 6),
    kldd BIGINT,
    von_hoa DECIMAL(20, 2),
    pe DECIMAL(10, 6),
    roa DECIMAL(10, 6),
    roe DECIMAL(10, 6),
    eps DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (symbol, date),
    FOREIGN KEY (symbol) REFERENCES stock_info(symbol)
);
CREATE INDEX idx_stock_daily_symbol_date ON stock_daily (symbol, date);

-- Bảng 3: Thông tin tài sản và vốn cổ đông
CREATE TABLE IF NOT EXISTS stock_assets (
    symbol VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    tts DECIMAL(20, 2),
    vcsh DECIMAL(20, 2),
    tb_tts_nganh DECIMAL(20, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (symbol, date),
    FOREIGN KEY (symbol) REFERENCES stock_info(symbol)
);
CREATE INDEX idx_stock_assets_symbol_date ON stock_assets (symbol, date);

-- Bảng 4: Chỉ số ROA và ROE
CREATE TABLE IF NOT EXISTS stock_metrics (
    symbol VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    roa DECIMAL(10, 6),
    roe DECIMAL(10, 6),
    tb_roa_nganh DECIMAL(10, 6),
    tb_roe_nganh DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (symbol, date),
    FOREIGN KEY (symbol) REFERENCES stock_info(symbol)
);
CREATE INDEX idx_stock_metrics_symbol_date ON stock_metrics (symbol, date);

-- Bảng 5: EPS và EPS ngành
CREATE TABLE IF NOT EXISTS stock_eps (
    symbol VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    eps DECIMAL(10, 2),
    eps_nganh DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (symbol, date),
    FOREIGN KEY (symbol) REFERENCES stock_info(symbol)
);
CREATE INDEX idx_stock_eps_symbol_date ON stock_eps (symbol, date);

-- Bảng 6: PE và PE ngành
CREATE TABLE IF NOT EXISTS stock_pe (
    symbol VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    pe DECIMAL(10, 6),
    pe_nganh DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (symbol, date),
    FOREIGN KEY (symbol) REFERENCES stock_info(symbol)
);
CREATE INDEX idx_stock_pe_symbol_date ON stock_pe (symbol, date);
