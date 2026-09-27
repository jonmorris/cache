import { useEffect, useState } from 'react';

/**
 * A second hand for the one component that needs it, paused while the page is
 * hidden. Pass `active: false` to stop it entirely when nothing on screen
 * depends on the time.
 */
export function useNow(active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    let timer: number | undefined;
    const stop = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const sync = () => {
      stop();
      if (document.visibilityState !== 'visible') return;
      setNow(Date.now());
      timer = window.setInterval(() => setNow(Date.now()), 1000);
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [active]);
  return now;
}
