/**
 * Upload an image for the editor
 */
export const uploadEditorImage = async (token: string, file: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/editor`, {
    method: 'POST',
    headers: {
      'x-auth-token': token
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload image');
  }
  
  const result = await response.json();
  return result.location;
};
