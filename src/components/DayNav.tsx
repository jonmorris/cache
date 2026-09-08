import { MAX_DAYS_AHEAD } from '../types';
import { addDays, dayMonth, pickerName, todayISO } from '../time';

interface DayNavProps {
  /** The day being viewed. */
  date: string;
  now: number;
  /** Days that already hold a list, so the strip shows what is planned. */
  planned: Set<string>;
  onPick: (date: string) => void;
}

/**
 * Steps across today and the seven days after it. The strip underneath marks
 * which of those days already have a list, so a plan made for Friday is visible
 * from Tuesday without walking there.
 */
export function DayNav({ date, now, planned, onPick }: DayNavProps) {
  const today = todayISO(now);
  const days = Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => addDays(today, i));
  const index = days.indexOf(date);

  return (
    <div className="daynav">
      <div className="daynav-head">
        <button
          className="daynav-arrow"
          onClick={() => onPick(days[index - 1])}
          disabled={index <= 0}
          aria-label="Previous day"
        >
          ‹
        </button>
        <div className="daynav-label">
          <span className="daynav-day">{pickerName(date, now)}</span>
          <span className="daynav-date">{dayMonth(date)}</span>
        </div>
        <button
          className="daynav-arrow"
          onClick={() => onPick(days[index + 1])}
          disabled={index < 0 || index >= days.length - 1}
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <div className="daystrip">
        {days.map((iso) => (
          <button
            key={iso}
            className="daystrip-day"
            data-current={iso === date}
            data-planned={planned.has(iso)}
            aria-current={iso === date ? 'true' : undefined}
            aria-label={`${dayMonth(iso)}${planned.has(iso) ? ', has a list' : ', empty'}`}
            onClick={() => onPick(iso)}
          >
            {iso.slice(8)}
          </button>
        ))}
      </div>
    </div>
  );
}
