import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

export function usePrefetchData() {
  useEffect(() => {
    const prefetchData = async () => {
      try {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['/api/properties'],
            staleTime: 10 * 60 * 1000,
          }),
          
          queryClient.prefetchQuery({
            queryKey: ['/api/advertisements'],
            staleTime: 10 * 60 * 1000,
          }),
          
          queryClient.prefetchQuery({
            queryKey: ['/api/auth/me'],
            staleTime: 5 * 60 * 1000,
          }).catch(() => null),
        ]);
      } catch (error) {
        console.log('Prefetch concluído com alguns erros esperados');
      }
    };

    prefetchData();
  }, []);
}
