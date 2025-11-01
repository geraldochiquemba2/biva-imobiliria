import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let errorMessage = res.statusText;
    
    try {
      if (contentType?.includes('application/json')) {
        const json = await res.json();
        errorMessage = json.error || json.message || res.statusText;
      } else {
        const text = await res.text();
        errorMessage = text || res.statusText;
      }
    } catch (e) {
      errorMessage = res.statusText;
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if data is FormData (for file uploads)
  const isFormData = data instanceof FormData;
  
  const res = await fetch(url, {
    method,
    // Don't set Content-Type for FormData - browser will set it with boundary
    headers: (data && !isFormData) ? { "Content-Type": "application/json" } : {},
    // Don't stringify FormData - send it as is
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - real estate data doesn't change frequently
      gcTime: 10 * 60 * 1000, // 10 minutes - keep cached data longer
      retry: 2, // Retry twice to handle transient errors on free tier hosting
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff: 1s, 2s, max 5s
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});
