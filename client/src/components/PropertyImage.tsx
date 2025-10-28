
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
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

  return (
    <>
      <div 
        className={`relative overflow-hidden cursor-pointer ${className}`}
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-${variant}`}
          style={{ objectPosition: 'center' }}
        />
        <img
          src={logoWatermark}
          alt="BIVA Imobiliária"
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none w-1/3 max-w-[200px] select-none"
          style={{ mixBlendMode: 'normal' }}
          draggable={false}
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black/95">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <div className="relative max-w-full max-h-[90vh] flex items-center justify-center p-8">
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain"
              />
              <img
                src={logoWatermark}
                alt="BIVA Imobiliária"
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none w-1/4 max-w-[300px] select-none"
                style={{ mixBlendMode: 'normal' }}
                draggable={false}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
