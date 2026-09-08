import { Sheet } from './Sheet';
import { MAX_DAYS_AHEAD } from '../types';
import { addDays, dayMonth, pickerName, todayISO } from '../time';

interface DaySheetProps {
  open: boolean;
  title: string;
  now: number;
  selected: string | null;
  onPick: (iso: string) => void;
  onClose: () => void;
}

/** Today plus up to seven days out — the whole horizon the app allows. */
export function DaySheet({ open, title, now, selected, onPick, onClose }: DaySheetProps) {
  const base = todayISO(now);
  const days = Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => addDays(base, i));

  return (
    <Sheet open={open} title={title} onClose={onClose}>
      <p className="sheet-text">
        The list clears itself at <strong>4:00 AM</strong> the morning after the day you pick.
      </p>
      <div className="days">
        {days.map((iso) => (
          <button
            key={iso}
            className="day"
            aria-pressed={iso === selected}
            onClick={() => onPick(iso)}
          >
            <span className="day-mark" aria-hidden="true">
              {iso === selected ? '▸' : ''}
            </span>
            <span className="day-name">{pickerName(iso, now)}</span>
            <span className="day-dots" aria-hidden="true" />
            <span className="day-date">{dayMonth(iso)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
