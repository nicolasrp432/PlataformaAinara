'use server'

import { uploadPublicAsset } from '@/lib/services/storageService';

export async function uploadThumbnailAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');
    if (!file.type.startsWith('image/')) throw new Error('File must be an image');

    const url = await uploadPublicAsset(file, 'public_assets', 'thumbnails/formations');
    return { success: true, url };
  } catch (error: any) {
    console.error('Error uploading thumbnail:', error);
    return { success: false, error: error.message };
  }
}
