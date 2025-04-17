const StockInfo = require('../models/StockInfo');
const StockDaily = require('../models/StockDaily');
const StockEPS = require('../models/StockEPS');
const StockAssets = require('../models/StockAssets');
const StockMetrics = require('../models/StockMetrics');
const StockPE = require('../models/StockPE');

// Hàm lấy tất cả dữ liệu cho một mã chứng khoán từ 6 bảng: stock_info, stock_daily, stock_eps, stock_assets, stock_metrics và stock_pe
exports.getProfileBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params;

    // Lấy thông tin từ bảng stock_info
    const stockInfo = await StockInfo.findBySymbol(symbol);
    if (!stockInfo) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin cổ phiếu' });
    }

    // Lấy dữ liệu từ bảng stock_daily
    const stockDaily = await StockDaily.findBySymbol(symbol);

    // Lấy dữ liệu từ bảng stock_eps
    const stockEPS = await StockEPS.findBySymbol(symbol);

    // Lấy dữ liệu từ bảng stock_assets
    const stockAssets = await StockAssets.findBySymbol(symbol);

    // Lấy dữ liệu từ bảng stock_metrics
    const stockMetrics = await StockMetrics.findBySymbol(symbol);

    // Lấy dữ liệu từ bảng stock_pe
    const stockPE = await StockPE.findBySymbol(symbol);

    // Tổng hợp dữ liệu
    const profileData = {
      stockInfo: stockInfo,
      stockDaily: stockDaily || [],
      stockEPS: stockEPS || [],
      stockAssets: stockAssets || [],
      stockMetrics: stockMetrics || [],
      stockPE: stockPE || []
    };

    res.json(profileData);
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu profile:', err.message);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};