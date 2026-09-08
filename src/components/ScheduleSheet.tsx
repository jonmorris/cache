import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { defaultDeadline, pickerName, timeOn } from '../time';

interface ScheduleSheetProps {
  open: boolean;
  title: string;
  cta: string;
  now: number;
  /** The day this list is for. Set by navigation, not editable here. */
  date: string;
  deadline: string | null;
  onSubmit: (deadline: string) => void;
  onClose: () => void;
}

/**
 * A deadline, and nothing else. When work has to begin is a consequence of the
 * deadline and what is on the list, so the HUD derives it rather than asking.
 */
export function ScheduleSheet(props: ScheduleSheetProps) {
  const { open, title, cta, now, date, onSubmit, onClose } = props;
  const [time, setTime] = useState(props.deadline ?? defaultDeadline(date, now));

  useEffect(() => {
    if (!open) return;
    setTime(props.deadline ?? defaultDeadline(date, Date.now()));
  }, [open, date, props.deadline]);

  const passed = Boolean(time) && timeOn(date, time) <= now;
  const valid = Boolean(time) && !passed;

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
          <button className="btn primary" disabled={!valid} onClick={() => valid && onSubmit(time)}>
            {cta}
          </button>
        </div>
      }
    >
      <p className="sheet-text">
        The list is destroyed at the deadline on{' '}
        <strong>{pickerName(date, now).toLowerCase()}</strong>, finished or not. Cache works out the
        latest you can start from what is on it.
      </p>

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
          ? 'Pick a deadline.'
          : passed
            ? `${time} has already gone by. Pick a later deadline.`
            : `Destroyed at ${time} on ${pickerName(date, now).toLowerCase()}.`}
      </p>
    </Sheet>
  );
}
