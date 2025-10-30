import { Client } from '@replit/object-storage';

// Lazy initialization of Replit Object Storage client
let client: Client | null = null;
let storageAvailable: boolean | null = null; // null = not checked yet
let initAttempted = false;

async function initializeStorage(): Promise<boolean> {
  if (initAttempted) {
    return storageAvailable === true;
  }

  initAttempted = true;

  try {
    client = new Client();
    // Try a simple operation to verify it works
    await client.list();
    storageAvailable = true;
    console.log('✓ Object Storage initialized successfully');
    return true;
  } catch (error) {
    storageAvailable = false;
    client = null;
    console.log('⚠ Object Storage not configured - using base64 fallback');
    console.log('  To enable Object Storage: Create a bucket in Replit Tools → Object Storage');
    return false;
  }
}

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
  // Try to initialize storage if not done yet
  const available = await initializeStorage();

  // If Object Storage is not available, return base64 fallback
  if (!available || !client) {
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    return {
      success: true,
      url: dataUrl
    };
  }

  try {
    // Generate unique filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const extension = filename.split('.').pop() || 'jpg';
    const uniqueFilename = `properties/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

    // Upload to Object Storage
    const { ok, error } = await client.uploadFromBytes(uniqueFilename, buffer);

    if (!ok) {
      console.error('Object Storage upload failed:', error);
      // Fallback to base64
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      return {
        success: true,
        url: dataUrl
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
    // Fallback to base64
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    return {
      success: true,
      url: dataUrl
    };
  }
}

/**
 * Get an image from Object Storage
 * @param filename - Filename in storage
 * @returns Promise with image buffer or null
 */
export async function getImage(filename: string): Promise<any> {
  const available = await initializeStorage();

  if (!available || !client) {
    return null;
  }

  try {
    const { ok, value, error} = await client.downloadAsBytes(filename);

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

export function isStorageAvailable(): boolean {
  return storageAvailable === true;
}

/**
 * Delete an image from Object Storage
 * @param filename - Filename in storage
 * @returns Promise with success status
 */
export async function deleteImage(filename: string): Promise<boolean> {
  const available = await initializeStorage();

  if (!available || !client) {
    return false;
  }

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
  const available = await initializeStorage();

  if (!available || !client) {
    return [];
  }

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
