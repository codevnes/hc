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

// Interface cho dữ liệu stock
export interface Stock {
  id?: number;
  symbol: string;
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  band_dow?: number;
  band_up?: number;
  trend_q?: number;
  fq?: number;
  qv1?: number;
  stock_name?: string;
}

// Interface cho dữ liệu stock info
export interface StockInfo {
  id?: number;
  symbol: string;
  name: string;
  description?: string;
}

// Lấy tất cả stocks với phân trang
export const getAllStocks = async (page = 1, limit = 10): Promise<{ data: Stock[], totalCount: number }> => {
  const offset = (page - 1) * limit;
  const response = await axios.get(`${API_URL}/stocks?limit=${limit}&offset=${offset}`, getHeaders());
  return {
    data: response.data.data || [],
    totalCount: response.data.totalCount || 0
  };
};

// Lấy stocks theo symbol
export const getStocksBySymbol = async (symbol: string) => {
  try {
    // Don't send auth headers since this endpoint doesn't require authentication
    const response = await axios.get(`${API_URL}/stocks/symbol/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stocks by symbol:', error);
    return [];
  }
};

// Lấy stocks theo khoảng thời gian
export const getStocksByDateRange = async (startDate: string, endDate: string, symbol?: string) => {
  let url = `${API_URL}/stocks/range?startDate=${startDate}&endDate=${endDate}`;
  if (symbol) {
    url += `&symbol=${symbol}`;
  }
  const response = await axios.get(url, getHeaders());
  return response.data;
};

// Tạo stock mới
export const createStock = async (stockData: Stock) => {
  const response = await axios.post(`${API_URL}/stocks`, stockData, getHeaders());
  return response.data;
};

// Lấy stock theo ID
export const getStockById = async (id: number) => {
  const response = await axios.get(`${API_URL}/stocks/${id}`, getHeaders()); // Assume backend has GET /api/stocks/:id
  return response.data;
};

// Lấy stock theo ID và khoảng thời gian
export const getStockByIdAndDateRange = async (id: number, startDate: string, endDate: string) => {
  const response = await axios.get(`${API_URL}/stocks/id-range/${id}?startDate=${startDate}&endDate=${endDate}`, getHeaders());
  return response.data;
};

// Cập nhật stock bằng ID
export const updateStockById = async (id: number, stockData: Partial<Stock>) => {
  const response = await axios.put(`${API_URL}/stocks/${id}`, stockData, getHeaders());
  return response.data;
};

// Xóa stock bằng ID
export const deleteStockById = async (id: number) => {
  const response = await axios.delete(`${API_URL}/stocks/${id}`, getHeaders());
  return response.data;
};

// Xóa nhiều stocks bằng ID
export const deleteMultipleStocksByIds = async (ids: number[]) => {
  const response = await axios.delete(`${API_URL}/stocks`, {
    ...getHeaders(),
    data: { ids }
  });
  return response.data;
};

// Import stocks từ file CSV
export const importStocksFromCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/stocks/import`, formData, {
    headers: {
      'x-auth-token': getToken(),
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

// Lấy danh sách các symbol có sẵn
export const getAvailableSymbols = async () => {
  try {
    // First try to get from the stocks/symbols endpoint
    const response = await axios.get(`${API_URL}/stocks/symbols`, getHeaders());
    return response.data;
  } catch (error) {
    // If that fails, fall back to getting all stock info
    console.log('Falling back to stock-info endpoint');
    const response = await axios.get(`${API_URL}/stock-info`, getHeaders());
    return response.data;
  }
};

// Lấy tất cả stock info
export const getAllStockInfo = async () => {
  const response = await axios.get(`${API_URL}/stock-info`, getHeaders());
  return response.data;
};

// Lấy stock info theo symbol
export const getStockInfoBySymbol = async (symbol: string) => {
  const response = await axios.get(`${API_URL}/stock-info/${symbol}`, getHeaders());
  return response.data;
};

// Tạo stock info mới (admin only)
export const createStockInfo = async (stockInfoData: StockInfo) => {
  const response = await axios.post(`${API_URL}/stock-info`, stockInfoData, getHeaders());
  return response.data;
};

// Cập nhật stock info bằng ID (admin only)
export const updateStockInfoById = async (id: number, stockInfoData: Partial<StockInfo>) => {
  const response = await axios.put(`${API_URL}/stock-info/${id}`, stockInfoData, getHeaders());
  return response.data;
};

// Xóa stock info bằng ID (admin only)
export const deleteStockInfoById = async (id: number) => {
  const response = await axios.delete(`${API_URL}/stock-info/${id}`, getHeaders());
  return response.data;
};

// Add similar updates for other stock data types (PE, EPS, etc.)
// Example for StockPE:
export interface StockPE {
  id?: number;
  symbol: string;
  date: string;
  pe?: number;
  pe_nganh?: number;
  stock_name?: string;
}

export const updateStockPEById = async (id: number, peData: Partial<StockPE>) => {
  const response = await axios.put(`${API_URL}/stock-pe/${id}`, peData, getHeaders());
  return response.data;
};

export const deleteStockPEById = async (id: number) => {
  const response = await axios.delete(`${API_URL}/stock-pe/${id}`, getHeaders());
  return response.data;
};

// (Repeat for StockEPS, StockMetrics, StockAssets, StockDaily)
// ... Implement update/delete functions using ID for other types ...

// Interface for search results
export interface StockSearchResult {
  symbol: string;
  name?: string; // Optional name from StockInfo
  matchType?: 'exact' | 'startsWith' | 'contains' | 'nameMatch'; // Type of match for highlighting
}

export interface SearchResponse {
  query: string;
  results: StockSearchResult[];
  count: number;
  timestamp: string;
}

// Search for stock symbols with improved error handling and response parsing
export const searchStockSymbols = async (query: string, limit = 10): Promise<StockSearchResult[]> => {
  if (!query.trim()) {
    return [];
  }
  try {
    const response = await axios.get<SearchResponse>(`${API_URL}/stocks/search`, {
      params: {
        q: query,
        limit
      },
      ...getHeaders() // Include auth headers if the search endpoint requires it
    });

    // Check if response has the expected structure
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    } else if (Array.isArray(response.data)) {
      // Fallback for backward compatibility
      return response.data;
    }

    return [];
  } catch (error) {
    console.error("Error searching stock symbols:", error);
    return []; // Return empty array on error
  }
};
