import { MediaItem } from '@/types/media';

const API_URL = 'http://localhost:5000/api';

/**
 * Fetch all media items with pagination
 */
export const fetchMedia = async (token: string, page: number = 1, limit: number = 12) => {
  const offset = (page - 1) * limit;
  const response = await fetch(`${API_URL}/media?limit=${limit}&offset=${offset}`, {
    headers: {
      'x-auth-token': token
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch media');
  }
  
  return response.json();
};

/**
 * Search media items
 */
export const searchMedia = async (token: string, query: string) => {
  const response = await fetch(`${API_URL}/media/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'x-auth-token': token
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to search media');
  }
  
  return response.json();
};

/**
 * Upload a new media item
 */
export const uploadMedia = async (token: string, file: File, metadata: { title: string, alt_text: string, caption: string }) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', metadata.title);
  formData.append('alt_text', metadata.alt_text);
  formData.append('caption', metadata.caption);
  
  const response = await fetch(`${API_URL}/media`, {
    method: 'POST',
    headers: {
      'x-auth-token': token
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload media');
  }
  
  return response.json();
};

/**
 * Update media metadata
 */
export const updateMedia = async (token: string, id: number, metadata: { title: string, alt_text: string, caption: string }) => {
  const response = await fetch(`${API_URL}/media/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token
    },
    body: JSON.stringify(metadata)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update media');
  }
  
  return response.json();
};

/**
 * Delete a media item
 */
export const deleteMedia = async (token: string, id: number) => {
  const response = await fetch(`${API_URL}/media/${id}`, {
    method: 'DELETE',
    headers: {
      'x-auth-token': token
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete media');
  }
  
  return response.json();
};
