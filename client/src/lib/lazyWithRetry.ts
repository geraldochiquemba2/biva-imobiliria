import { lazy, ComponentType } from 'react';

interface ImportFunction<T> {
  (): Promise<{ default: ComponentType<T> }>;
}

export function lazyWithRetry<T = any>(
  importFunction: ImportFunction<T>,
  retries = 3,
  delay = 1000
): ReturnType<typeof lazy> {
  return lazy(() => {
    return new Promise<{ default: ComponentType<T> }>((resolve, reject) => {
      const attemptImport = async (retriesLeft: number) => {
        try {
          const module = await importFunction();
          resolve(module);
        } catch (error) {
          if (retriesLeft <= 0) {
            console.error('Failed to load module after retries:', error);
            reject(error);
            return;
          }

          console.warn(`Failed to load module. Retrying... (${retriesLeft} attempts left)`);
          
          setTimeout(() => {
            attemptImport(retriesLeft - 1);
          }, delay);
        }
      };

      attemptImport(retries);
    });
  });
}
