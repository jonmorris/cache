import { countdown, duration, expiresAt } from '../time';
import type { List } from '../types';

interface CountdownProps {
  list: List;
  now: number;
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
export function Countdown({ list, now, remaining, compare }: CountdownProps) {
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
