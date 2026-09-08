import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { defaultDeadline, defaultStart, pickerName, timeOn } from '../time';

interface ScheduleSheetProps {
  open: boolean;
  title: string;
  cta: string;
  now: number;
  /** The day this list is for. Set by navigation, not editable here. */
  date: string;
  start: string | null;
  deadline: string | null;
  onSubmit: (start: string, deadline: string) => void;
  onClose: () => void;
}

/**
 * Start and deadline for the day being viewed. Every list gets both, so there
 * is no path through here that leaves either unset.
 */
export function ScheduleSheet(props: ScheduleSheetProps) {
  const { open, title, cta, now, date, onSubmit, onClose } = props;
  const [from, setFrom] = useState(props.start ?? defaultStart(date, now));
  const [to, setTo] = useState(props.deadline ?? defaultDeadline(date, now));

  useEffect(() => {
    if (!open) return;
    setFrom(props.start ?? defaultStart(date, Date.now()));
    setTo(props.deadline ?? defaultDeadline(date, Date.now()));
  }, [open, date, props.start, props.deadline]);

  // The start may be in the past — you can already be underway. The deadline
  // may not, and must leave a window to work in.
  const passed = Boolean(to) && timeOn(date, to) <= now;
  const inverted = Boolean(from && to) && timeOn(date, from) >= timeOn(date, to);
  const valid = Boolean(from) && Boolean(to) && !passed && !inverted;

  const hint = !from || !to
    ? 'Set a start and a deadline.'
    : passed
      ? `${to} has already gone by. Pick a later deadline.`
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
            onClick={() => valid && onSubmit(from, to)}
          >
            {cta}
          </button>
        </div>
      }
    >
      <p className="sheet-text">
        Work runs from the start to the deadline on <strong>{pickerName(date, now).toLowerCase()}</strong>.
        The list is destroyed at the deadline, finished or not.
      </p>

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
