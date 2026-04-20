import api from './api';

export async function uploadProductImage(file, productId = null, onProgress = null) {
  const formData = new FormData();
  formData.append('image', file);
  if (productId) formData.append('product_id', productId);
  const response = await api.post('/upload/product-image', formData, {
    // axios sets Content-Type with boundary automatically for FormData — do not override
    onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)); },
  });
  return response.data;
}

export async function uploadLogo(file, onProgress = null) {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/upload/logo', formData, {
    // axios sets Content-Type with boundary automatically for FormData — do not override
    onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)); },
  });
  return response.data;
}
