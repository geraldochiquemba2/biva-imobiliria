import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';
        const quality = supportsWebP ? 0.85 : 0.82;
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao comprimir imagem'));
              return;
            }
            
            const extension = mimeType === 'image/webp' ? '.webp' : '.jpg';
            const newName = file.name.replace(/\.[^/.]+$/, extension);
            
            const compressedFile = new File([blob], newName, {
              type: mimeType,
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
}
