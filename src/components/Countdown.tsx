import { useEffect, useState } from 'react';
import { countdown, duration, expiresAt } from '../time';
import type { List } from '../types';

interface CountdownProps {
  list: List;
  /** Minutes of work still open. */
  remaining: number;
  /** Suppressed while the list is locked: you cannot start it yet anyway. */
  compare: boolean;
}

/**
 * Live clock to the deadline. When the work still open no longer fits in the
 * time left, it says so — having both numbers on screen is the point of
 * estimating in the first place.
 */
export function Countdown({ list, remaining, compare }: CountdownProps) {
  /*
   * The second hand lives here rather than in App: only this strip changes
   * every second, so a ticking clock does not re-render the whole screen (and
   * every open sheet) underneath the user.
   */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
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
  }, []);

  const left = expiresAt(list) - now;
  const overBy = remaining * 60_000 - left;
  const over = compare && overBy > 0;
  const soon = left <= 15 * 60_000;

  return (
    <div className="countdown" data-state={soon ? 'soon' : over ? 'over' : 'ok'}>
      <div className="countdown-row">
        <span className="countdown-label">Time left</span>
        <span className="countdown-dots" aria-hidden="true" />
        <span className="countdown-value">{countdown(left)}</span>
      </div>
      {over && (
        <p className="countdown-note">Over by {duration(Math.ceil(overBy / 60_000))}</p>
      )}
    </div>
  );
}
