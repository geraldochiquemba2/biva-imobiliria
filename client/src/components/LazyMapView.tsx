import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const MapView = lazy(() => import('@/components/MapView'));

const preloadMapResources = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/0/0';
  link.as = 'image';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

interface LazyMapViewProps {
  latitude: number;
  longitude: number;
  title?: string;
  userLocation?: { lat: number; lng: number } | null;
  onRouteInfo?: (distance: string, duration: string) => void;
}

export default function LazyMapView(props: LazyMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasPreloaded, setHasPreloaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (!hasPreloaded) {
              preloadMapResources();
              setHasPreloaded(true);
            }
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasPreloaded]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px]">
      {isVisible ? (
        <Suspense fallback={
          <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <Skeleton className="w-full h-full" data-testid="skeleton-map-loading" />
          </div>
        }>
          <MapView {...props} />
        </Suspense>
      ) : (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center">
          <Skeleton className="w-full h-full" data-testid="skeleton-map-loading" />
        </div>
      )}
    </div>
  );
}
