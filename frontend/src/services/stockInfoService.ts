import axios from 'axios';
import { API_URL } from '@/config';

// Lấy token từ localStorage
const getToken = () => localStorage.getItem('token');

// Tạo headers với token
const getHeaders = () => ({
  headers: {
    'x-auth-token': getToken()
  }
});

// Interface cho dữ liệu stock info
export interface StockInfo {
  id?: number;
  symbol: string;
  name: string;
  description?: string;
}

// Interface cho response phân trang
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Lấy tất cả stock info với phân trang
export const getAllStockInfo = async (
  page = 1,
  limit = 10,
  search = '',
  sortBy = 'symbol',
  sortOrder = 'asc'
): Promise<PaginatedResponse<StockInfo>> => {
  const response = await axios.get(
    `${API_URL}/stock-info?page=${page}&limit=${limit}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
    getHeaders()
  );
  return response.data;
};

// Lấy stock info theo ID
export const getStockInfoById = async (id: number): Promise<StockInfo> => {
  const response = await axios.get(`${API_URL}/stock-info/id/${id}`, getHeaders());
  return response.data;
};

// Lấy stock info theo symbol
export const getStockInfoBySymbol = async (symbol: string): Promise<StockInfo> => {
  const response = await axios.get(`${API_URL}/stock-info/${symbol}`, getHeaders());
  return response.data;
};

// Tạo stock info mới
export const createStockInfo = async (stockInfoData: StockInfo): Promise<StockInfo> => {
  const response = await axios.post(`${API_URL}/stock-info`, stockInfoData, getHeaders());
  return response.data;
};

// Cập nhật stock info
export const updateStockInfo = async (id: number, stockInfoData: Partial<StockInfo>): Promise<StockInfo> => {
  const response = await axios.put(`${API_URL}/stock-info/${id}`, stockInfoData, getHeaders());
  return response.data;
};

// Xóa stock info
export const deleteStockInfo = async (id: number): Promise<{ message: string }> => {
  const response = await axios.delete(`${API_URL}/stock-info/${id}`, getHeaders());
  return response.data;
};

// Import stock info từ file CSV
export const importStockInfoFromCSV = async (formData: FormData): Promise<any> => {
  const headers = {
    ...getHeaders().headers,
    'Content-Type': 'multipart/form-data'
  };

  const response = await axios.post(`${API_URL}/stock-info/import-csv`, formData, { headers });
  return response.data;
};
