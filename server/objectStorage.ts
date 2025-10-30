import { Client } from '@replit/object-storage';

// Initialize Replit Object Storage client
const client = new Client();

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image to Replit Object Storage
 * @param buffer - Image buffer from multer
 * @param filename - Original filename
 * @param mimeType - Image MIME type
 * @returns Promise with upload result containing URL or error
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadResult> {
  try {
    // Generate unique filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const extension = filename.split('.').pop() || 'jpg';
    const uniqueFilename = `properties/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

    // Upload to Object Storage
    const { ok, error } = await client.uploadFromBytes(uniqueFilename, buffer);

    if (!ok) {
      console.error('Object Storage upload failed:', error);
      return {
        success: false,
        error: error?.message || 'Falha ao fazer upload'
      };
    }

    // Return URL path that will be served by our endpoint
    const url = `/api/storage/${uniqueFilename}`;

    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('Error uploading to Object Storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Get an image from Object Storage
 * @param filename - Filename in storage
 * @returns Promise with image buffer or null
 */
export async function getImage(filename: string): Promise<any> {
  try {
    const { ok, value, error } = await client.downloadAsBytes(filename);

    if (!ok || !value) {
      console.error('Object Storage download failed:', error);
      return null;
    }

    // Value is returned as a Buffer
    return value;
  } catch (error) {
    console.error('Error downloading from Object Storage:', error);
    return null;
  }
}

/**
 * Delete an image from Object Storage
 * @param filename - Filename in storage
 * @returns Promise with success status
 */
export async function deleteImage(filename: string): Promise<boolean> {
  try {
    const { ok, error } = await client.delete(filename);

    if (!ok) {
      console.error('Object Storage delete failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting from Object Storage:', error);
    return false;
  }
}

/**
 * List all images in Object Storage
 * @returns Promise with list of filenames
 */
export async function listImages(): Promise<string[]> {
  try {
    const { ok, value, error } = await client.list();

    if (!ok || !value) {
      console.error('Object Storage list failed:', error);
      return [];
    }

    // Filter only property images
    return value
      .filter((item: any) => item.name.startsWith('properties/'))
      .map((item: any) => item.name);
  } catch (error) {
    console.error('Error listing from Object Storage:', error);
    return [];
  }
}

export { client };
