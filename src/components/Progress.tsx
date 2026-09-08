import type { Item } from '../types';

/**
 * One equal segment per item, in list order. A segment fills when *its* item is
 * done, so ticking the fourth thing first fills the fourth segment — the bar
 * shows which things are done, not just how many.
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
        <span key={item.id} className="seg" data-progress={item.progress}>
          <span className="seg-fill" />
        </span>
      ))}
    </div>
  );
}
