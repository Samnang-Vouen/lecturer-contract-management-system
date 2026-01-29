import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Custom hook for managing URL search parameters
 * Handles pagination and other query params
 */
export const useUrlParams = (page, setPage, limit, setLimit) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync URL when page/limit change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;
    if (params.get('page') !== String(page)) { 
      params.set('page', String(page)); 
      changed = true; 
    }
    if (params.get('limit') !== String(limit)) { 
      params.set('limit', String(limit)); 
      changed = true; 
    }
    if (changed) setSearchParams(params, { replace: true });
  }, [page, limit, searchParams, setSearchParams]);

  // React to manual URL changes (back/forward)
  useEffect(() => {
    const urlPage = Math.max(parseInt(searchParams.get('page')) || 1, 1);
    const urlLimit = Math.min(Math.max(parseInt(searchParams.get('limit')) || limit, 1), 100);
    if (urlPage !== page) setPage(urlPage);
    if (urlLimit !== limit) setLimit(urlLimit);
  }, [searchParams, page, limit, setPage, setLimit]);

  return { searchParams, setSearchParams };
};
