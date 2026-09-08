import { useEffect, useState } from 'react';
import {
  availableMs,
  countdown,
  deadlineLabel,
  dueAt,
  duration,
  signedDuration,
  startsAt,
} from '../time';
import { Progress } from './Progress';
import { MAX_ITEMS, taskCount, type List } from '../types';

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
 *
 * The grid is work on the left, time on the right: what you took on against
 * what you have, then what is left of each. There is deliberately no "window"
 * figure — it is fixed at deadline less start, so before work begins it is
 * exactly what `available` reads, and the strip above already names both ends
 * of it. Two cells showing one number is a wasted cell.
 */
export function Hud({ list, onEditTimes }: HudProps) {
  const planned = list.items.reduce((sum, i) => sum + i.minutes, 0);
  // Rounded once over the whole sum: halving an odd estimate (0:45, 1:15,
  // 1:45) leaves a half minute that should not compound across items.
  const remaining = Math.round(
    list.items.reduce((sum, i) => sum + i.minutes * (1 - i.progress), 0),
  );
  const done = list.items.filter((i) => i.progress === 1).length;
  const half = list.items.filter((i) => i.progress === 0.5).length;
  // Only tasks are capped, so the tally counts them and notes transit beside it.
  const tasks = taskCount(list.items);
  const transit = list.items.length - tasks;

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
  const usable = availableMs(list, now);
  /* What is left of the window to spend. Equal to the window until the start
     goes by, and thereafter counting down to the deadline. Rounded the same
     way as `remaining`, so available - to do is exactly extra on screen for
     the whole life of the list. The clamp only bites in the moment between
     the deadline passing and the list being deleted: time available cannot go
     negative, whereas extra must, since that is the overrun it reports. */
  const available = Math.max(0, Math.round(usable / MINUTE));
  const extra = Math.round((usable - remaining * MINUTE) / MINUTE);

  const beforeStart = start !== null && now < start;
  const left = dueAt(list) - now;
  // Three degrees, most severe first. Overdue is a fact: the deadline has
  // gone. Over is a forecast: the work no longer fits in what is left. Soon is
  // only a nudge that the deadline is close, which is fine if nothing is open.
  const overdue = left <= 0;
  const over = !overdue && extra < 0;
  const soon = !overdue && !over && left <= 15 * MINUTE;

  /* Pressure: how much of the time left is already spoken for. Full means you
     are at the last moment you could start; past full, you are behind. */
  const committed = usable > 0 ? Math.min(1, (remaining * MINUTE) / usable) : 1;

  return (
    <section className="hud" data-state={overdue ? 'overdue' : over ? 'over' : soon ? 'soon' : 'ok'}>
      <button className="hud-window" onClick={onEditTimes} aria-label="Change the start and deadline">
        {list.start ? (
          <>
            <span className="hud-time">{list.start}</span>
            <span className="hud-arrow" aria-hidden="true">
              →
            </span>
          </>
        ) : (
          <span className="hud-label">Due</span>
        )}
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
        <Stat label="Available" value={duration(available)} />
        <Stat label="To do" value={duration(remaining)} />
        <Stat label="Extra" value={signedDuration(extra)} tone={over ? 'bad' : undefined} />
      </div>

      <div className="hud-clock">
        <span className="hud-clock-label">
          {overdue ? 'Late by' : beforeStart ? 'Starts in' : 'Time left'}
        </span>
        <span className="hud-clock-dots" aria-hidden="true" />
        <span className="hud-clock-value">
          {countdown(overdue ? -left : beforeStart ? (start as number) - now : left)}
        </span>
      </div>

      {over && <p className="hud-note">Over by {duration(Math.abs(extra))}</p>}

      {list.items.length > 0 && (
        <div className="hud-items">
          <Progress items={list.items} />
          <p className="hud-counts">
            <span>
              {done}/{list.items.length} done{half > 0 ? ` · ${half} half` : ''}
            </span>
            <span>
              {tasks}/{MAX_ITEMS} tasks{transit > 0 ? ` +${transit}` : ''}
            </span>
          </p>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bad' }) {
  return (
    <div className="hud-stat" data-tone={tone}>
      <span className="hud-stat-label">{label}</span>
      <span className="hud-stat-value">{value}</span>
    </div>
  );
}
