import { useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';

const routePreloadMap: Record<string, () => Promise<any>> = {
  '/': () => import('@/pages/Home'),
  '/imoveis': () => import('@/pages/Imoveis'),
  '/arrendar': () => import('@/pages/Arrendar'),
  '/comprar': () => import('@/pages/Comprar'),
  '/explorar-mapa': () => import('@/pages/ExplorarMapa'),
  '/servicos': () => import('@/pages/Servicos'),
  '/sobre': () => import('@/pages/Sobre'),
  '/contacto': () => import('@/pages/Contacto'),
  '/login': () => import('@/pages/Login'),
  '/cadastro': () => import('@/pages/Cadastro'),
  '/dashboard': () => import('@/pages/Dashboard'),
};

async function fetchProperties(filters: any = {}) {
  const params = new URLSearchParams();
  
  if (filters.type) params.append('type', filters.type);
  if (filters.category) params.append('category', filters.category);
  if (filters.provincia) params.append('provincia', filters.provincia);
  if (filters.municipio) params.append('municipio', filters.municipio);
  if (filters.bedrooms !== undefined) params.append('bedrooms', filters.bedrooms.toString());
  if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
  
  const queryString = params.toString();
  const url = `/api/properties${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`${res.status}: ${res.statusText}`);
  }
  return res.json();
}

const routeDataPrefetchMap: Record<string, () => void> = {
  '/imoveis': () => {
    queryClient.prefetchQuery({
      queryKey: ['/api/properties', {}],
      queryFn: () => fetchProperties({}),
      staleTime: 10 * 60 * 1000,
    });
  },
  '/arrendar': () => {
    queryClient.prefetchQuery({
      queryKey: ['/api/properties', { type: 'Arrendar' }],
      queryFn: () => fetchProperties({ type: 'Arrendar' }),
      staleTime: 10 * 60 * 1000,
    });
  },
  '/comprar': () => {
    queryClient.prefetchQuery({
      queryKey: ['/api/properties', { type: 'Vender' }],
      queryFn: () => fetchProperties({ type: 'Vender' }),
      staleTime: 10 * 60 * 1000,
    });
  },
  '/explorar-mapa': () => {
    queryClient.prefetchQuery({
      queryKey: ['/api/properties'],
      staleTime: 10 * 60 * 1000,
    });
  },
};

export function usePrefetch() {
  const prefetchRoute = useCallback((path: string) => {
    const preloadFn = routePreloadMap[path];
    if (preloadFn) {
      preloadFn().catch(() => {});
    }
    
    const dataPrefetchFn = routeDataPrefetchMap[path];
    if (dataPrefetchFn) {
      dataPrefetchFn();
    }
  }, []);

  const prefetchOnHover = useCallback((path: string) => {
    return {
      onMouseEnter: () => prefetchRoute(path),
      onTouchStart: () => prefetchRoute(path),
    };
  }, [prefetchRoute]);

  return { prefetchRoute, prefetchOnHover };
}
