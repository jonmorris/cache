import { useEffect, useState } from 'react';
import {
  availableMs,
  countdown,
  deadlineLabel,
  duration,
  expiresAt,
  signedDuration,
  startsAt,
  windowMs,
} from '../time';
import { Progress } from './Progress';
import { MAX_ITEMS, type List } from '../types';

interface HudProps {
  list: List;
  onEditTimes: () => void;
}

const MINUTE = 60_000;

/**
 * The state of the plan at a glance.
 *
 * Clock times live in their own strip and durations in their own grid, because
 * the two read at different widths — mixing them in one right-aligned column is
 * what made the old ledger jump around whenever a value changed shape. Times
 * are 24-hour so every glyph is the same width.
 */
export function Hud({ list, onEditTimes }: HudProps) {
  const planned = list.items.reduce((sum, i) => sum + i.minutes, 0);
  const remaining = list.items.reduce((sum, i) => (i.done ? sum : sum + i.minutes), 0);
  const done = list.items.filter((i) => i.done).length;

  /*
   * The second hand lives here rather than in App: only this panel changes
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

  const start = startsAt(list);
  const span = windowMs(list);
  const available = availableMs(list, now);
  const slack = Math.round((available - remaining * MINUTE) / MINUTE);

  const beforeStart = start !== null && now < start;
  const left = expiresAt(list) - now;
  const soon = left <= 15 * MINUTE;
  const over = slack < 0;

  /* How far through the window we are; nothing to show before it opens. */
  const elapsed = span && span > 0 ? Math.min(1, Math.max(0, (now - (start ?? now)) / span)) : 0;

  return (
    <section className="hud" data-state={soon ? 'soon' : over ? 'over' : 'ok'}>
      <button className="hud-window" onClick={onEditTimes} aria-label="Change start and deadline">
        {list.start ? (
          <>
            <span className="hud-time">{list.start}</span>
            <span className="hud-arrow" aria-hidden="true">
              →
            </span>
            <span className="hud-time">{deadlineLabel(list)}</span>
          </>
        ) : (
          <>
            <span className="hud-arrow" aria-hidden="true">
              →
            </span>
            <span className="hud-time">{deadlineLabel(list)}</span>
          </>
        )}
        <span className="hud-window-edit" aria-hidden="true">
          Edit
        </span>
      </button>

      {span !== null && (
        <div
          className="hud-bar"
          role="img"
          aria-label={`${Math.round(elapsed * 100)}% through the window`}
        >
          <span className="hud-bar-fill" style={{ width: `${elapsed * 100}%` }} />
        </div>
      )}

      <div className="hud-stats">
        <Stat label="Planned" value={duration(planned)} />
        <Stat label="Window" value={span === null ? '—' : duration(Math.round(span / MINUTE))} />
        <Stat label="To do" value={duration(remaining)} />
        <Stat label="Slack" value={signedDuration(slack)} tone={over ? 'warn' : undefined} />
      </div>

      <div className="hud-clock">
        <span className="hud-clock-label">{beforeStart ? 'Starts in' : 'Time left'}</span>
        <span className="hud-clock-dots" aria-hidden="true" />
        <span className="hud-clock-value">
          {countdown(beforeStart ? (start as number) - now : left)}
        </span>
      </div>

      {over && <p className="hud-note">Over by {duration(Math.abs(slack))}</p>}

      {list.items.length > 0 && (
        <div className="hud-items">
          <Progress items={list.items} />
          <p className="hud-counts">
            <span>
              {done}/{list.items.length} done
            </span>
            <span>
              {list.items.length}/{MAX_ITEMS} items
            </span>
          </p>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <div className="hud-stat" data-tone={tone}>
      <span className="hud-stat-label">{label}</span>
      <span className="hud-stat-value">{value}</span>
    </div>
  );
}
