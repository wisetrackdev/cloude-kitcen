import { API_BASE_URL } from './apiConfig';

/**
 * Uploads a local image URI (from camera or gallery) to the backend.
 * Returns the secure remote URL (Cloudinary) returned by the server.
 */
export const uploadImageToServer = async (uri: string): Promise<string> => {
  if (!uri) return '';
  
  // If it's already an HTTP/HTTPS URL, don't upload it again
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'upload.jpg';
  
  // Infer file type
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;
  
  // Construct file object for FormData
  // @ts-ignore
  formData.append('file', {
    uri,
    name: filename,
    type,
  });

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('Server upload error response:', errorText);
    throw new Error('Image upload failed');
  }

  const json = await response.json();
  if (json.success && json.data) {
    return json.data; // Secure Cloudinary URL
  } else {
    throw new Error(json.message || 'Image upload failed');
  }
};
