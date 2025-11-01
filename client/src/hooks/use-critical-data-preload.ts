import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

async function fetchProperties(filters: any = {}) {
  const params = new URLSearchParams();
  
  if (filters.type) params.append('type', filters.type);
  
  const queryString = params.toString();
  const url = `/api/properties${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export function useCriticalDataPreload() {
  useEffect(() => {
    const preloadCritical = async () => {
      await Promise.all([
        import('@/pages/Imoveis'),
        import('@/pages/Arrendar'),
        import('@/pages/Comprar'),
      ]);
      
      queryClient.prefetchQuery({
        queryKey: ['/api/properties', {}],
        queryFn: () => fetchProperties({}),
        staleTime: 10 * 60 * 1000,
      });
      
      queryClient.prefetchQuery({
        queryKey: ['/api/properties', { type: 'Arrendar' }],
        queryFn: () => fetchProperties({ type: 'Arrendar' }),
        staleTime: 10 * 60 * 1000,
      });
      
      queryClient.prefetchQuery({
        queryKey: ['/api/properties', { type: 'Vender' }],
        queryFn: () => fetchProperties({ type: 'Vender' }),
        staleTime: 10 * 60 * 1000,
      });
    };

    const timeoutId = setTimeout(preloadCritical, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);
}
