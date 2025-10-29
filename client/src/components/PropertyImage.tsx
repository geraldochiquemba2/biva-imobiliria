
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { X, ImageOff } from 'lucide-react';
import logoWatermark from '@assets/BIVA LOG300.300_1761652396256.png';

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
  variant?: 'cover' | 'contain';
}

export default function PropertyImage({ 
  src, 
  alt, 
  className = '', 
  variant = 'contain' 
}: PropertyImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      <div 
        className={`relative overflow-hidden cursor-pointer ${className}`}
        onClick={() => !hasError && setIsModalOpen(true)}
        data-testid="image-property"
      >
        {isLoading && (
          <Skeleton className="absolute inset-0 w-full h-full" data-testid="skeleton-image-loading" />
        )}
        
        {hasError ? (
          <div 
            className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground"
            data-testid="image-error-placeholder"
          >
            <ImageOff className="h-12 w-12 mb-2" />
            <p className="text-sm">Imagem não disponível</p>
          </div>
        ) : (
          <>
            <img
              src={src}
              alt={alt}
              className={`w-full h-full object-${variant} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              style={{ objectPosition: 'center' }}
              loading="lazy"
              decoding="async"
              onLoad={handleImageLoad}
              onError={handleImageError}
              data-testid="img-property-main"
            />
            {!isLoading && (
              <img
                src={logoWatermark}
                alt="BIVA Imobiliária"
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none w-1/3 max-w-[200px] select-none"
                style={{ mixBlendMode: 'normal' }}
                loading="lazy"
                decoding="async"
                draggable={false}
                data-testid="img-watermark"
              />
            )}
          </>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black/95">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
              data-testid="button-close-modal"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <div className="relative max-w-full max-h-[90vh] flex items-center justify-center p-8">
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain"
                fetchpriority="high"
                decoding="async"
                data-testid="img-property-modal"
              />
              <img
                src={logoWatermark}
                alt="BIVA Imobiliária"
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none w-1/4 max-w-[300px] select-none"
                style={{ mixBlendMode: 'normal' }}
                decoding="async"
                draggable={false}
                data-testid="img-watermark-modal"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
