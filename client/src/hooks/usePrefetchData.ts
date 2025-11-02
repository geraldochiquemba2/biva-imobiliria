import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

export function usePrefetchData() {
  useEffect(() => {
    const prefetchData = async () => {
      try {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['/api/properties'],
            staleTime: 15 * 60 * 1000,
          }),
          
          queryClient.prefetchQuery({
            queryKey: ['/api/properties/featured'],
            staleTime: 15 * 60 * 1000,
          }),
          
          queryClient.prefetchQuery({
            queryKey: ['/api/advertisements'],
            staleTime: 15 * 60 * 1000,
          }),
        ]);

        try {
          await queryClient.prefetchQuery({
            queryKey: ['/api/auth/me'],
            staleTime: 15 * 60 * 1000,
          });
        } catch (error) {
          return;
        }

        const userData = queryClient.getQueryData(['/api/auth/me']);
        
        if (userData) {
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: ['/api/notifications'],
              staleTime: 5 * 60 * 1000,
            }).catch(() => null),
            
            queryClient.prefetchQuery({
              queryKey: ['/api/notifications/unread'],
              staleTime: 2 * 60 * 1000,
            }).catch(() => null),
            
            queryClient.prefetchQuery({
              queryKey: ['/api/visits'],
              staleTime: 10 * 60 * 1000,
            }).catch(() => null),
            
            queryClient.prefetchQuery({
              queryKey: ['/api/contracts'],
              staleTime: 10 * 60 * 1000,
            }).catch(() => null),
          ]);
        }
      } catch (error) {
        console.log('Prefetch concluído com alguns erros esperados');
      }
    };

    prefetchData();
  }, []);
}
