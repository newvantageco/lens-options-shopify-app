import { useAuthenticatedFetch as useShopifyAuthenticatedFetch } from '@shopify/app-bridge-react';

export const useAuthenticatedFetch = () => {
  const fetch = useShopifyAuthenticatedFetch();
  
  return async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  };
};
