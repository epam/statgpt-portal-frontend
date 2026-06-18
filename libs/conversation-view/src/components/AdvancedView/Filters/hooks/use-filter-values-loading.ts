'use client';

import { useCallback, useRef, useState } from 'react';

export const useFilterValuesLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const loadingRequestsRef = useRef(0);

  const startLoading = useCallback(() => {
    loadingRequestsRef.current += 1;
    if (loadingRequestsRef.current === 1) {
      setIsLoading(true);
    }
  }, []);

  const finishLoading = useCallback(() => {
    loadingRequestsRef.current = Math.max(loadingRequestsRef.current - 1, 0);
    if (loadingRequestsRef.current === 0) {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    startLoading,
    finishLoading,
  };
};
