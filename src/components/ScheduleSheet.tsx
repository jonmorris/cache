import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { MAX_DAYS_AHEAD } from '../types';
import { addDays, dayMonth, defaultDeadline, defaultStart, pickerName, timeOn, todayISO } from '../time';

interface ScheduleSheetProps {
  open: boolean;
  title: string;
  cta: string;
  now: number;
  /** Prefilled when editing an existing list; null when starting a new one. */
  date: string | null;
  start: string | null;
  deadline: string | null;
  onSubmit: (date: string, start: string, deadline: string) => void;
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
  const [from, setFrom] = useState(props.start ?? defaultStart(today, now));
  const [to, setTo] = useState(props.deadline ?? defaultDeadline(today, now));

  useEffect(() => {
    if (!open) return;
    const day = props.date ?? todayISO(Date.now());
    setDate(day);
    setFrom(props.start ?? defaultStart(day, Date.now()));
    setTo(props.deadline ?? defaultDeadline(day, Date.now()));
  }, [open, props.date, props.start, props.deadline]);

  const days = Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => addDays(today, i));

  // The start may be in the past — you can already be underway. The deadline
  // may not, and must leave a window to work in.
  const passed = Boolean(to) && timeOn(date, to) <= now;
  const inverted = Boolean(from && to) && timeOn(date, from) >= timeOn(date, to);
  const valid = Boolean(from) && Boolean(to) && !passed && !inverted;

  /** Keep the deadline reachable when the day changes under it. */
  const pickDay = (iso: string) => {
    setDate(iso);
    if (to && timeOn(iso, to) <= now) setTo(defaultDeadline(iso, now));
    if (!props.start) setFrom(defaultStart(iso, now));
  };

  const hint = !from || !to
    ? 'Set a start and a deadline.'
    : passed
      ? `${to} has already gone by. Pick a later deadline or another day.`
      : inverted
        ? 'The deadline has to be after the start.'
        : `${from} to ${to} on ${pickerName(date, now).toLowerCase()}.`;

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
          <button
            className="btn primary"
            disabled={!valid}
            onClick={() => valid && onSubmit(date, from, to)}
          >
            {cta}
          </button>
        </div>
      }
    >
      <p className="sheet-text">
        Work runs from the start to the deadline. The list is destroyed at the deadline, finished
        or not.
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

      <div className="field-times">
        <label className="field">
          <span className="field-label">Start</span>
          <input className="input" type="time" value={from} required onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Deadline</span>
          <input className="input" type="time" value={to} required onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <p className="field-hint" data-tone={passed || inverted ? 'error' : undefined}>
        {hint}
      </p>
    </Sheet>
  );
}
