import { API_BASE_URL } from './apiConfig';

export const uploadImage = async (localUri: string): Promise<string | null> => {
  try {
    const filename = localUri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    const formData = new FormData();
    // @ts-ignore
    formData.append('file', { uri: localUri, name: filename, type });

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data; // Hosted image URL returned by the backend
      }
    }
    return null;
  } catch (err) {
    console.warn('Failed to upload image:', err);
    return null;
  }
};
