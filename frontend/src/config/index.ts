// Configuration file for environment variables and app settings

// API URL - use environment variable or fallback to localhost
export const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Other configuration settings can be added here
export const APP_NAME = 'HC Stock';
export const DEFAULT_PAGINATION_LIMIT = 10;
