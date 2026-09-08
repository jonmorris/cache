import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { MAX_DAYS_AHEAD } from '../types';
import { addDays, clockLabel, dayMonth, defaultDeadline, pickerName, timeOn, todayISO } from '../time';

interface ScheduleSheetProps {
  open: boolean;
  title: string;
  cta: string;
  now: number;
  /** Prefilled when editing an existing list; null when starting a new one. */
  date: string | null;
  deadline: string | null;
  onSubmit: (date: string, deadline: string) => void;
  onClose: () => void;
}

/**
 * Day plus deadline in one step. Every list gets a hard stop, so there is no
 * path through here that leaves the deadline unset.
 */
export function ScheduleSheet(props: ScheduleSheetProps) {
  const { open, title, cta, now, onSubmit, onClose } = props;
  const today = todayISO(now);
  const [date, setDate] = useState(props.date ?? today);
  const [time, setTime] = useState(props.deadline ?? defaultDeadline(today, now));

  useEffect(() => {
    if (!open) return;
    const start = props.date ?? todayISO(Date.now());
    setDate(start);
    setTime(props.deadline ?? defaultDeadline(start, Date.now()));
  }, [open, props.date, props.deadline]);

  const days = Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => addDays(today, i));
  const at = time ? timeOn(date, time) : NaN;
  const passed = Number.isFinite(at) && at <= now;
  const valid = Boolean(time) && !passed;

  /** Keep the deadline reachable when the day changes under it. */
  const pickDay = (iso: string) => {
    setDate(iso);
    if (time && timeOn(iso, time) <= now) setTime(defaultDeadline(iso, now));
  };

  return (
    <Sheet
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="sheet-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={!valid} onClick={() => valid && onSubmit(date, time)}>
            {cta}
          </button>
        </div>
      }
    >
      <p className="sheet-text">
        The list is destroyed at the deadline, finished or not. A countdown runs until then.
      </p>

      <div className="days">
        {days.map((iso) => (
          <button key={iso} className="day" aria-pressed={iso === date} onClick={() => pickDay(iso)}>
            <span className="day-mark" aria-hidden="true">
              {iso === date ? '▸' : ''}
            </span>
            <span className="day-name">{pickerName(iso, now)}</span>
            <span className="day-dots" aria-hidden="true" />
            <span className="day-date">{dayMonth(iso)}</span>
          </button>
        ))}
      </div>

      <label className="field field-deadline">
        <span className="field-label">Deadline</span>
        <input
          className="input"
          type="time"
          value={time}
          required
          onChange={(e) => setTime(e.target.value)}
        />
      </label>

      <p className="field-hint" data-tone={passed ? 'error' : undefined}>
        {!time
          ? 'Pick a time.'
          : passed
            ? `${clockLabel(time)} has already gone by. Pick a later time or another day.`
            : `Destroyed ${pickerName(date, now).toLowerCase()} at ${clockLabel(time)}.`}
      </p>
    </Sheet>
  );
}
