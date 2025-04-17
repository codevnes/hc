import axios from 'axios';
import { StockMetrics } from './stockDataTypes';

const API_URL = 'http://localhost:5000/api';

// Lấy token từ localStorage
const getToken = () => localStorage.getItem('token');

// Tạo headers với token
const getHeaders = () => ({
  headers: {
    'x-auth-token': getToken()
  }
});

// Lấy tất cả stock_metrics
export const getAllStockMetrics = async (limit = 100, offset = 0) => {
  const response = await axios.get(`${API_URL}/stock-metrics?limit=${limit}&offset=${offset}`, getHeaders());
  return response.data;
};

// Lấy stock_metrics theo symbol
export const getStockMetricsBySymbol = async (symbol: string) => {
  const response = await axios.get(`${API_URL}/stock-metrics/symbol/${symbol}`, getHeaders());
  return response.data;
};

// Lấy stock_metrics theo date
export const getStockMetricsByDate = async (date: string) => {
  const response = await axios.get(`${API_URL}/stock-metrics/date/${date}`, getHeaders());
  return response.data;
};

// Lấy stock_metrics theo khoảng thời gian
export const getStockMetricsByDateRange = async (startDate: string, endDate: string, symbol?: string) => {
  let url = `${API_URL}/stock-metrics/range?startDate=${startDate}&endDate=${endDate}`;
  if (symbol) {
    url += `&symbol=${symbol}`;
  }
  const response = await axios.get(url, getHeaders());
  return response.data;
};

// Lấy stock_metrics theo symbol và date
export const getStockMetricsBySymbolAndDate = async (symbol: string, date: string) => {
  const response = await axios.get(`${API_URL}/stock-metrics/${symbol}/${date}`, getHeaders());
  return response.data;
};

// Lấy stock_metrics theo ID
export const getStockMetricsById = async (id: number) => {
  const response = await axios.get(`${API_URL}/stock-metrics/id/${id}`, getHeaders());
  return response.data;
};

// Tạo stock_metrics mới (admin only)
export const createStockMetrics = async (stockMetricsData: StockMetrics) => {
  const response = await axios.post(`${API_URL}/stock-metrics`, stockMetricsData, getHeaders());
  return response.data;
};

// Cập nhật stock_metrics theo symbol và date (admin only)
export const updateStockMetrics = async (symbol: string, date: string, stockMetricsData: Partial<StockMetrics>) => {
  const response = await axios.put(`${API_URL}/stock-metrics/${symbol}/${date}`, stockMetricsData, getHeaders());
  return response.data;
};

// Cập nhật stock_metrics theo ID (admin only)
export const updateStockMetricsById = async (id: number, stockMetricsData: Partial<StockMetrics>) => {
  const response = await axios.put(`${API_URL}/stock-metrics/${id}`, stockMetricsData, getHeaders());
  return response.data;
};

// Xóa stock_metrics theo symbol và date (admin only)
export const deleteStockMetrics = async (symbol: string, date: string) => {
  const response = await axios.delete(`${API_URL}/stock-metrics/${symbol}/${date}`, getHeaders());
  return response.data;
};

// Xóa stock_metrics theo ID (admin only)
export const deleteStockMetricsById = async (id: number) => {
  const response = await axios.delete(`${API_URL}/stock-metrics/${id}`, getHeaders());
  return response.data;
};

// Xóa nhiều stock_metrics theo symbol và date (admin only)
export const deleteMultipleStockMetrics = async (items: { symbol: string; date: string }[]) => {
  const response = await axios.delete(`${API_URL}/stock-metrics`, {
    ...getHeaders(),
    data: { items }
  });
  return response.data;
};

// Xóa nhiều stock_metrics theo ID (admin only)
export const deleteMultipleStockMetricsByIds = async (ids: number[]) => {
  const response = await axios.delete(`${API_URL}/stock-metrics/ids`, {
    ...getHeaders(),
    data: { ids }
  });
  return response.data;
};

// Import stock_metrics từ file CSV (admin only)
export const importStockMetricsFromCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/stock-metrics/import`, formData, {
    headers: {
      'x-auth-token': getToken(),
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
