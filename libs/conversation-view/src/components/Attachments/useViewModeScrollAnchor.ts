'use client';

import { RefObject, useCallback, useEffect, useRef } from 'react';

/** Class of the scrolling conversation container (see `styles-tailwind.scss`). */
const SCROLL_CONTAINER_SELECTOR = '.scroll-hidden-container';
/**
 * How long we keep the scroll position locked after a switch. Must outlast the
 * chart's async build (deferred work + echarts init) so its final resize is
 * absorbed. A manual scroll aborts early.
 */
const SETTLE_MS = 1000;

/**
 * Keeps the conversation content and the attachment's tabs/buttons row fixed on
 * screen while the user switches the visualization (e.g. grid ↔ chart) and the
 * new content has a different height.
 *
 * Call {@link captureAnchor} synchronously right before triggering the switch.
 * It simply locks `scrollTop` for a short settle window:
 *
 * - **Taller / same-size new view** → `scrollTop` is valid throughout, so the
 *   view stays exactly put (no jump), even while the chart builds.
 * - **Shorter new view** → holding the old `scrollTop` is only clamped by the
 *   browser when it now exceeds the maximum, which happens exactly when the user
 *   was at the very bottom of the taller view. In that case the content settles
 *   down by the height difference (the one allowed movement); otherwise it still
 *   stays put.
 *
 * Native scroll anchoring is suspended during the window (its heuristic is
 * unreliable for the last message / at the bottom), and re-enabled afterwards.
 * A manual scroll (wheel / touch) hands control back to the user immediately.
 *
 * No-op when `enabled` is false (e.g. advanced view has no such scroll
 * container).
 */
export function useViewModeScrollAnchor<T extends HTMLElement>(
  anchorRef: RefObject<T | null>,
  enabled: boolean,
) {
  const rafRef = useRef<number | null>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const prevOverflowAnchorRef = useRef<string>('');
  const detachListenersRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (scrollerRef.current) {
      scrollerRef.current.style.overflowAnchor = prevOverflowAnchorRef.current;
    }
    detachListenersRef.current?.();
    detachListenersRef.current = null;
    scrollerRef.current = null;
  }, []);

  const captureAnchor = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const scroller = anchorRef.current?.closest(
      SCROLL_CONTAINER_SELECTOR,
    ) as HTMLElement | null;
    if (!scroller) return;

    // Abort any lock still in flight from a previous switch.
    stop();

    const targetScrollTop = scroller.scrollTop;
    scrollerRef.current = scroller;
    prevOverflowAnchorRef.current = scroller.style.overflowAnchor;
    scroller.style.overflowAnchor = 'none';

    // Hand control back the moment the user scrolls on their own.
    const onUserScroll = () => stop();
    scroller.addEventListener('wheel', onUserScroll, { passive: true });
    scroller.addEventListener('touchmove', onUserScroll, { passive: true });
    detachListenersRef.current = () => {
      scroller.removeEventListener('wheel', onUserScroll);
      scroller.removeEventListener('touchmove', onUserScroll);
    };

    const start = performance.now();
    const step = () => {
      const currentScroller = scrollerRef.current;
      if (!currentScroller) {
        stop();
        return;
      }

      // Re-assert the locked position. When the new content is shorter and the
      // user was at the bottom, the browser clamps this to the new maximum,
      // producing the allowed settle-down; otherwise it holds exactly.
      if (currentScroller.scrollTop !== targetScrollTop) {
        currentScroller.scrollTop = targetScrollTop;
      }

      if (performance.now() - start >= SETTLE_MS) {
        stop();
      } else {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, [enabled, anchorRef, stop]);

  // Cancel any in-flight lock (and restore native anchoring) on unmount.
  useEffect(() => stop, [stop]);

  return { captureAnchor };
}
