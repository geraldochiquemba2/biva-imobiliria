import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { VirtualTourWithRooms } from '@shared/schema';

const VirtualTourViewer = lazy(() => import('@/components/VirtualTourViewer'));

interface LazyVirtualTourViewerProps {
  tour: VirtualTourWithRooms;
}

export default function LazyVirtualTourViewer({ tour }: LazyVirtualTourViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasPreloaded, setHasPreloaded] = useState(false);

  useEffect(() => {
    if (!hasPreloaded && tour.rooms && tour.rooms.length > 0) {
      const firstRoom = tour.rooms[0];
      if (firstRoom.image) {
        const img = new Image();
        img.src = firstRoom.image;
        setHasPreloaded(true);
      }
    }
  }, [tour.rooms, hasPreloaded]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full aspect-video">
      {isVisible ? (
        <Suspense fallback={
          <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
            <Skeleton className="w-full h-full" data-testid="skeleton-tour-loading" />
          </div>
        }>
          <VirtualTourViewer tour={tour} />
        </Suspense>
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
          <Skeleton className="w-full h-full" data-testid="skeleton-tour-loading" />
        </div>
      )}
    </div>
  );
}
