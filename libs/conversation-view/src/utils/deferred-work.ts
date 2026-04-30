type CancelDeferredWork = () => void;

export function scheduleDeferredWork(callback: () => void): CancelDeferredWork {
  if (typeof window === 'undefined') {
    callback();
    return () => undefined;
  }

  let timeoutId: number | undefined;
  const frameId = window.requestAnimationFrame(() => {
    timeoutId = window.setTimeout(callback, 0);
  });

  return () => {
    window.cancelAnimationFrame(frameId);
    if (timeoutId != null) {
      window.clearTimeout(timeoutId);
    }
  };
}
