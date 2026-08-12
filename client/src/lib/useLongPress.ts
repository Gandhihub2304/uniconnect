import { useRef, useCallback } from 'react';

// Fires onLongPress after holding for `delay`ms; falls back to onClick for a normal tap.
// Cancels on move/leave so a scroll gesture doesn't trigger it.
export function useLongPress(onLongPress: () => void, onClick?: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const start = useCallback(() => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback(() => {
    if (!firedRef.current) onClick?.();
  }, [onClick]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onClick: handleClick,
  };
}
