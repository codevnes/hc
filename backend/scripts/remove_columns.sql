-- Remove open, high, low, close columns from stock_daily table
ALTER TABLE stock_daily
DROP COLUMN open,
DROP COLUMN high,
DROP COLUMN low,
DROP COLUMN close;
