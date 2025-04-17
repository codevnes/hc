import axios from 'axios';
import { StockDaily } from './stockDataTypes';

const API_URL = 'http://localhost:5000/api';

// Lấy token từ localStorage
const getToken = () => localStorage.getItem('token');

// Tạo headers với token
const getHeaders = () => ({
  headers: {
    'x-auth-token': getToken()
  }
});

// Lấy tất cả stock_daily
export const getAllStockDaily = async (limit = 100, offset = 0) => {
  const response = await axios.get(`${API_URL}/stock-daily?limit=${limit}&offset=${offset}`, getHeaders());
  return response.data;
};

// Lấy stock_daily theo symbol
export const getStockDailyBySymbol = async (symbol: string) => {
  const response = await axios.get(`${API_URL}/stock-daily/symbol/${symbol}`, getHeaders());
  return response.data;
};

// Lấy stock_daily theo date
export const getStockDailyByDate = async (date: string) => {
  const response = await axios.get(`${API_URL}/stock-daily/date/${date}`, getHeaders());
  return response.data;
};

// Lấy stock_daily theo khoảng thời gian
export const getStockDailyByDateRange = async (startDate: string, endDate: string, symbol?: string) => {
  let url = `${API_URL}/stock-daily/range?startDate=${startDate}&endDate=${endDate}`;
  if (symbol) {
    url += `&symbol=${symbol}`;
  }
  const response = await axios.get(url, getHeaders());
  return response.data;
};

// Lấy stock_daily theo symbol và date
export const getStockDailyBySymbolAndDate = async (symbol: string, date: string) => {
  const response = await axios.get(`${API_URL}/stock-daily/${symbol}/${date}`, getHeaders());
  return response.data;
};

// Lấy stock_daily theo ID
export const getStockDailyById = async (id: number) => {
  const response = await axios.get(`${API_URL}/stock-daily/id/${id}`, getHeaders());
  return response.data;
};

// Tạo stock_daily mới (admin only)
export const createStockDaily = async (stockDailyData: StockDaily) => {
  const response = await axios.post(`${API_URL}/stock-daily`, stockDailyData, getHeaders());
  return response.data;
};

// Cập nhật stock_daily theo symbol và date (admin only)
export const updateStockDaily = async (symbol: string, date: string, stockDailyData: Partial<StockDaily>) => {
  const response = await axios.put(`${API_URL}/stock-daily/${symbol}/${date}`, stockDailyData, getHeaders());
  return response.data;
};

// Cập nhật stock_daily theo ID (admin only)
export const updateStockDailyById = async (id: number, stockDailyData: Partial<StockDaily>) => {
  const response = await axios.put(`${API_URL}/stock-daily/id/${id}`, stockDailyData, getHeaders());
  return response.data;
};

// Xóa stock_daily (admin only)
export const deleteStockDaily = async (id: number) => {
  const response = await axios.delete(`${API_URL}/stock-daily/${id}`, getHeaders());
  return response.data;
};

// Xóa nhiều stock_daily (admin only)
export const deleteMultipleStockDaily = async (items: { symbol: string; date: string }[]) => {
  const response = await axios.delete(`${API_URL}/stock-daily`, {
    ...getHeaders(),
    data: { items }
  });
  return response.data;
};

// Import stock_daily từ file CSV (admin only)
export const importStockDailyFromCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/stock-daily/import`, formData, {
    headers: {
      'x-auth-token': getToken(),
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
