import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

interface UseClampToggleResult<T extends HTMLElement> {
  valueRef: RefObject<T | null>;
  isExpanded: boolean;
  canToggle: boolean;
  toggle: () => void;
}

export function useClampToggle<T extends HTMLElement = HTMLElement>(
  dependency: unknown,
): UseClampToggleResult<T> {
  const valueRef = useRef<T>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  const measure = useCallback(() => {
    const node = valueRef.current;
    if (!node) return;
    setCanToggle(node.scrollHeight > node.offsetHeight);
  }, []);

  useEffect(() => {
    if (isExpanded) return;
    measure();

    const node = valueRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);
    return () => observer.disconnect();
  }, [isExpanded, dependency, measure]);

  const toggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  return { valueRef, isExpanded, canToggle, toggle };
}
