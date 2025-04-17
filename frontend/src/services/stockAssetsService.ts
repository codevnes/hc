import axios from 'axios';
import { StockAssets } from './stockDataTypes';

const API_URL = 'http://localhost:5000/api';

// Lấy token từ localStorage
const getToken = () => localStorage.getItem('token');

// Tạo headers với token
const getHeaders = () => ({
  headers: {
    'x-auth-token': getToken()
  }
});

// Lấy tất cả stock_assets
export const getAllStockAssets = async (limit = 100, offset = 0) => {
  const response = await axios.get(`${API_URL}/stock-assets?limit=${limit}&offset=${offset}`, getHeaders());
  return response.data;
};

// Lấy stock_assets theo symbol
export const getStockAssetsBySymbol = async (symbol: string) => {
  const response = await axios.get(`${API_URL}/stock-assets/symbol/${symbol}`, getHeaders());
  return response.data;
};

// Lấy stock_assets theo date
export const getStockAssetsByDate = async (date: string) => {
  const response = await axios.get(`${API_URL}/stock-assets/date/${date}`, getHeaders());
  return response.data;
};

// Lấy stock_assets theo khoảng thời gian
export const getStockAssetsByDateRange = async (startDate: string, endDate: string, symbol?: string) => {
  let url = `${API_URL}/stock-assets/range?startDate=${startDate}&endDate=${endDate}`;
  if (symbol) {
    url += `&symbol=${symbol}`;
  }
  const response = await axios.get(url, getHeaders());
  return response.data;
};

// Lấy stock_assets theo symbol và date
export const getStockAssetsBySymbolAndDate = async (symbol: string, date: string) => {
  const response = await axios.get(`${API_URL}/stock-assets/${symbol}/${date}`, getHeaders());
  return response.data;
};

// Lấy stock_assets theo ID
export const getStockAssetsById = async (id: number) => {
  const response = await axios.get(`${API_URL}/stock-assets/id/${id}`, getHeaders());
  return response.data;
};

// Tạo stock_assets mới (admin only)
export const createStockAssets = async (stockAssetsData: StockAssets) => {
  const response = await axios.post(`${API_URL}/stock-assets`, stockAssetsData, getHeaders());
  return response.data;
};

// Cập nhật stock_assets theo symbol và date (admin only)
export const updateStockAssets = async (symbol: string, date: string, stockAssetsData: Partial<StockAssets>) => {
  const response = await axios.put(`${API_URL}/stock-assets/${symbol}/${date}`, stockAssetsData, getHeaders());
  return response.data;
};

// Cập nhật stock_assets theo ID (admin only)
export const updateStockAssetsById = async (id: number, stockAssetsData: Partial<StockAssets>) => {
  const response = await axios.put(`${API_URL}/stock-assets/${id}`, stockAssetsData, getHeaders());
  return response.data;
};

// Xóa stock_assets theo symbol và date (admin only)
export const deleteStockAssets = async (symbol: string, date: string) => {
  const response = await axios.delete(`${API_URL}/stock-assets/${symbol}/${date}`, getHeaders());
  return response.data;
};

// Xóa stock_assets theo ID (admin only)
export const deleteStockAssetsById = async (id: number) => {
  const response = await axios.delete(`${API_URL}/stock-assets/${id}`, getHeaders());
  return response.data;
};

// Xóa nhiều stock_assets theo symbol và date (admin only)
export const deleteMultipleStockAssets = async (items: { symbol: string; date: string }[]) => {
  const response = await axios.delete(`${API_URL}/stock-assets`, {
    ...getHeaders(),
    data: { items }
  });
  return response.data;
};

// Xóa nhiều stock_assets theo ID (admin only)
export const deleteMultipleStockAssetsByIds = async (ids: number[]) => {
  const response = await axios.delete(`${API_URL}/stock-assets/ids`, {
    ...getHeaders(),
    data: { ids }
  });
  return response.data;
};

// Import stock_assets từ file CSV (admin only)
export const importStockAssetsFromCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/stock-assets/import`, formData, {
    headers: {
      'x-auth-token': getToken(),
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
