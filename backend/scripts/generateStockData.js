const mysql = require('mysql2/promise');
const moment = require('moment');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Timem.2302',
  database: 'hc_stock'
};

// Function to generate random stock data
async function generateStockData() {
  try {
    // Create connection
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Generate data for 5 years (approximately 1250 trading days)
    const startDate = moment().subtract(5, 'years');
    const endDate = moment();

    // Initial price
    let previousClose = 80000; // Starting price for VNM
    const volatility = 0.02; // Daily volatility

    // Batch size for inserts
    const batchSize = 100;
    let batch = [];
    let totalInserted = 0;

    // Generate data for each trading day (excluding weekends)
    let currentDate = moment(startDate);

    while (currentDate.isSameOrBefore(endDate)) {
      // Skip weekends
      if (currentDate.day() !== 0 && currentDate.day() !== 6) {
        // Generate random price movement
        const changePercent = (Math.random() - 0.5) * 2 * volatility;
        const change = previousClose * changePercent;

        // Calculate OHLC values
        const open = previousClose;
        const close = Math.round(previousClose + change);
        const high = Math.round(Math.max(open, close) * (1 + Math.random() * 0.01));
        const low = Math.round(Math.min(open, close) * (1 - Math.random() * 0.01));

        // Generate random volume
        const volume = Math.floor(Math.random() * 1000000) + 500000;

        // Calculate market cap
        const marketCap = close * 1000000000; // Assuming 1 billion shares

        // Create data object
        const stockData = {
          symbol: 'VNM',
          date: currentDate.format('YYYY-MM-DD'),
          open: open,
          high: high,
          low: low,
          close: close,
          volume: volume,
          close_price: close,
          return_value: changePercent * 100,
          kldd: volume,
          von_hoa: marketCap
        };

        // Add to batch
        batch.push(stockData);

        // If batch is full, insert into database
        if (batch.length >= batchSize) {
          await insertBatch(connection, batch);
          totalInserted += batch.length;
          console.log(`Inserted ${totalInserted} records`);
          batch = [];
        }

        // Update previous close for next iteration
        previousClose = close;
      }

      // Move to next day
      currentDate.add(1, 'day');
    }

    // Insert any remaining records
    if (batch.length > 0) {
      await insertBatch(connection, batch);
      totalInserted += batch.length;
      console.log(`Inserted ${totalInserted} records`);
    }

    console.log('Data generation complete');

    // Close connection
    await connection.end();
    console.log('Connection closed');

  } catch (error) {
    console.error('Error generating stock data:', error);
  }
}

// Function to insert a batch of records
async function insertBatch(connection, batch) {
  // Create placeholders for the SQL query
  const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');

  // Flatten the batch into a single array of values
  const values = batch.flatMap(record => [
    record.symbol,
    record.date,
    record.open,
    record.high,
    record.low,
    record.close,
    record.volume,
    record.close_price,
    record.return_value,
    record.kldd,
    record.von_hoa
  ]);

  // SQL query
  const sql = `INSERT INTO stock_daily
               (symbol, trade_date, open, high, low, close, volume, close_price, return_value, kldd, von_hoa)
               VALUES ${placeholders}
               ON DUPLICATE KEY UPDATE
               open = VALUES(open),
               high = VALUES(high),
               low = VALUES(low),
               close = VALUES(close),
               volume = VALUES(volume),
               close_price = VALUES(close_price),
               return_value = VALUES(return_value),
               kldd = VALUES(kldd),
               von_hoa = VALUES(von_hoa)`;

  // Execute query
  await connection.query(sql, values);
}

// Run the function
generateStockData();
