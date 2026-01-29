import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing modal state and preventing body scroll
 */
export function useModalState(isOpen) {
  useEffect(() => {
    if (isOpen) {
      // When modal opens
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // When modal closes
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }
  }, [isOpen]);
}

/**
 * Custom hook for handling error messages with toast notifications
 */
export function useErrorHandler(error, setError) {
  useEffect(() => {
    if (error) {
      toast.error(error);
      if (setError) {
        setError(null);
      }
    }
  }, [error, setError]);
}

/**
 * Custom hook for infinite scroll
 */
export function useInfiniteScroll(ref, callback, hasMore, isLoading) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          callback();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref, callback, hasMore, isLoading]);
}

/**
 * Custom hook for debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
