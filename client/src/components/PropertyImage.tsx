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
  variant = 'cover' 
}: PropertyImageProps) {
  return (
    <div className={`relative ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-${variant}`}
      />
      <img
        src={logoWatermark}
        alt="BIVA Imobiliária"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none w-1/3 max-w-[200px] select-none"
        style={{ mixBlendMode: 'normal' }}
        draggable={false}
      />
    </div>
  );
}
