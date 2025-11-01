import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const MapView = lazy(() => import('@/components/MapView'));

interface LazyMapViewProps {
  latitude: number;
  longitude: number;
  title?: string;
  userLocation?: { lat: number; lng: number } | null;
  onRouteInfo?: (distance: string, duration: string) => void;
}

export default function LazyMapView(props: LazyMapViewProps) {
  return (
    <Suspense fallback={
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <Skeleton className="w-full h-full" data-testid="skeleton-map-loading" />
      </div>
    }>
      <MapView {...props} />
    </Suspense>
  );
}
