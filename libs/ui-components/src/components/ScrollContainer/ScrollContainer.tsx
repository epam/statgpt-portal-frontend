'use client';

import { FC, useEffect, useRef, useState } from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const ScrollContainer: FC<Props> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = () => {
    setScrolling(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setScrolling(false);
    }, 800);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll);

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-container ${scrolling ? 'scroll-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
