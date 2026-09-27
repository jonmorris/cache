import { fraction, shownProgress, type Item } from '../types';

/**
 * One equal segment per item, in list order. A segment fills when *its* item is
 * done, so ticking the fourth thing first fills the fourth segment — the bar
 * shows which things are done, not just how many.
 *
 * Transit keeps a full-width segment — every item gets an equal one, that is
 * the rule — and is set back by height instead, so the bar still reads left to
 * right as the shape of the day.
 *
 * A timed item fills as its timer runs, so a long job three-quarters through
 * reads three-quarters full rather than waiting on the next tick.
 */
export function Progress({ items, now }: { items: Item[]; now: number }) {
  const done = items.filter((i) => i.progress === 1).length;
  const half = items.filter((i) => shownProgress(i, now) === 0.5).length;

  return (
    <div
      className="segments"
      role="img"
      aria-label={`${done} of ${items.length} items done${half ? `, ${half} half done` : ''}`}
    >
      {items.map((item) => (
        <span
          key={item.id}
          className="seg"
          data-progress={shownProgress(item, now)}
          data-kind={item.kind}
        >
          <span className="seg-fill" style={{ width: `${fraction(item, now) * 100}%` }} />
        </span>
      ))}
    </div>
  );
}
