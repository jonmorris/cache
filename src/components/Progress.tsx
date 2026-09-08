import type { Item } from '../types';

/**
 * One equal segment per item, in list order. A segment fills when *its* item is
 * done, so ticking the fourth thing first fills the fourth segment — the bar
 * shows which things are done, not just how many.
 *
 * Transit keeps a full-width segment — every item gets an equal one, that is
 * the rule — and is set back by height instead, so the bar still reads left to
 * right as the shape of the day.
 */
export function Progress({ items }: { items: Item[] }) {
  const done = items.filter((i) => i.progress === 1).length;
  const half = items.filter((i) => i.progress === 0.5).length;

  return (
    <div
      className="segments"
      role="img"
      aria-label={`${done} of ${items.length} items done${half ? `, ${half} half done` : ''}`}
    >
      {items.map((item) => (
        <span key={item.id} className="seg" data-progress={item.progress} data-kind={item.kind}>
          <span className="seg-fill" />
        </span>
      ))}
    </div>
  );
}
