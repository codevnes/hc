-- Use the database
USE hc_stock;

-- Create stock_info table if not exists
CREATE TABLE IF NOT EXISTS stock_info (
  symbol VARCHAR(10) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create stocks table if not exists
CREATE TABLE IF NOT EXISTS stocks (
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(10, 2),
  high DECIMAL(10, 2),
  low DECIMAL(10, 2),
  close DECIMAL(10, 2),
  band_dow DECIMAL(10, 2),
  band_up DECIMAL(10, 2),
  trend_q DECIMAL(10, 2),
  fq DECIMAL(10, 2),
  qv1 BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (symbol, date),
  FOREIGN KEY (symbol) REFERENCES stock_info(symbol) ON DELETE CASCADE
);

-- Create index on stocks table
CREATE INDEX idx_stocks_symbol_date ON stocks (symbol, date);

-- Insert some sample stock_info data
INSERT IGNORE INTO stock_info (symbol, name, description)
VALUES
('VN30', 'VN30 Index', 'Chỉ số VN30'),
('VNINDEX', 'VN Index', 'Chỉ số VNINDEX'),
('FPT', 'FPT Corp', 'Công ty Cổ phần FPT'),
('VCB', 'Vietcombank', 'Ngân hàng TMCP Ngoại thương Việt Nam'),
('VIC', 'Vingroup', 'Tập đoàn Vingroup'),
('VHM', 'Vinhomes', 'Công ty Cổ phần Vinhomes');
