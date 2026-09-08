import type { Item } from '../types';

/**
 * One equal segment per item, in list order. A segment fills when *its* item is
 * done, so ticking the fourth thing first fills the fourth segment — the bar
 * shows which things are done, not just how many.
 */
export function Progress({ items }: { items: Item[] }) {
  const done = items.filter((i) => i.done).length;

  return (
    <div className="segments" role="img" aria-label={`${done} of ${items.length} items done`}>
      {items.map((item) => (
        <span key={item.id} className="seg" data-done={item.done} />
      ))}
    </div>
  );
}
