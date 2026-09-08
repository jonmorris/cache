import { useEffect, useState } from 'react';
import {
  availableMs,
  countdown,
  deadlineLabel,
  duration,
  signedDuration,
  startByLabel,
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

  const left = availableMs(list, now);
  const slack = Math.round((left - remaining * MINUTE) / MINUTE);
  const soon = left <= 15 * MINUTE;
  const over = slack < 0;

  /* Pressure: how much of the time left is already spoken for. Full means you
     are at the last moment you could start; past full, you are behind. */
  const committed = left > 0 ? Math.min(1, (remaining * MINUTE) / left) : 1;

  return (
    <section className="hud" data-state={soon ? 'soon' : over ? 'over' : 'ok'}>
      <button className="hud-window" onClick={onEditTimes} aria-label="Change the deadline">
        <span className="hud-label">Due</span>
        <span className="hud-time">{deadlineLabel(list)}</span>
        <span className="hud-window-edit" aria-hidden="true">
          Edit
        </span>
      </button>

      <div
        className="hud-bar"
        role="img"
        aria-label={`${Math.round(committed * 100)}% of the time left is committed`}
      >
        <span className="hud-bar-fill" style={{ width: `${committed * 100}%` }} />
      </div>

      <div className="hud-stats">
        <Stat label="Planned" value={duration(planned)} />
        <Stat
          label="Start by"
          value={startByLabel(list, remaining)}
          tone={over ? 'warn' : undefined}
        />
        <Stat label="To do" value={duration(remaining)} />
        <Stat label="Slack" value={signedDuration(slack)} tone={over ? 'warn' : undefined} />
      </div>

      <div className="hud-clock">
        <span className="hud-clock-label">Time left</span>
        <span className="hud-clock-dots" aria-hidden="true" />
        <span className="hud-clock-value">{countdown(left)}</span>
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
