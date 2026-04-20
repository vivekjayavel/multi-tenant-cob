import uploadApi from './uploadApi';

export async function uploadProductImage(file, productId = null, onProgress = null) {
  const formData = new FormData();
  formData.append('image', file);
  if (productId) formData.append('product_id', String(productId));

  const response = await uploadApi.post('/upload/product-image', formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return response.data;
}

export async function uploadLogo(file, onProgress = null) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await uploadApi.post('/upload/logo', formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return response.data;
}
