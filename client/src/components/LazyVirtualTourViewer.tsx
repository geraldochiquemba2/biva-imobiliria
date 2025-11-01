import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { VirtualTourWithRooms } from '@shared/schema';

const VirtualTourViewer = lazy(() => import('@/components/VirtualTourViewer'));

interface LazyVirtualTourViewerProps {
  tour: VirtualTourWithRooms;
}

export default function LazyVirtualTourViewer({ tour }: LazyVirtualTourViewerProps) {
  return (
    <Suspense fallback={
      <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
        <Skeleton className="w-full h-full" data-testid="skeleton-tour-loading" />
      </div>
    }>
      <VirtualTourViewer tour={tour} />
    </Suspense>
  );
}
