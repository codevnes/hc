import axios from 'axios';
import { StockPE } from './stockDataTypes';
import { API_URL } from '@/config';

// Lấy token từ localStorage
const getToken = () => localStorage.getItem('token');

// Tạo headers với token
const getHeaders = () => ({
  headers: {
    'x-auth-token': getToken()
  }
});

export const getProfile = async (symbol: string) => {
  try {
    // Don't send auth headers since this endpoint doesn't require authentication
    const response = await axios.get(`${API_URL}/profile/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

// Keep the misspelled function for backward compatibility
export const getProfle = getProfile;
