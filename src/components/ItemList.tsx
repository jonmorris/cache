import { useRef, useState } from 'react';
import { Grip } from './Grip';
import { duration } from '../time';
import { canHalve, nextProgress, type Item } from '../types';

const GLYPH: Record<number, string> = { 0: '[ ]', 0.5: '[/]', 1: '[x]' };
const STATE: Record<number, string> = { 0: 'not started', 0.5: 'half done', 1: 'done' };

interface ItemListProps {
  items: Item[];
  /** Future-dated lists are visible but cannot be ticked off yet. */
  lockTicking: boolean;
  onReorder: (from: number, to: number) => void;
  onToggle: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

interface Drag {
  from: number;
  to: number;
  dy: number;
  height: number;
}

/**
 * The list, with press-and-drag reordering on the grip.
 *
 * Row geometry is measured once at drag start rather than read per move, so a
 * move never reads back a layout it is itself shifting.
 */
export function ItemList({ items, lockTicking, onReorder, onToggle, onEdit, onDelete }: ItemListProps) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const geometry = useRef<{ tops: number[]; heights: number[] } | null>(null);
  const originY = useRef(0);

  const start = (event: React.PointerEvent, index: number) => {
    const rects = items.map((item) => rows.current.get(item.id)?.getBoundingClientRect());
    if (rects.some((r) => !r)) return;
    geometry.current = {
      tops: rects.map((r) => r!.top),
      heights: rects.map((r) => r!.height),
    };
    originY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ from: index, to: index, dy: 0, height: rects[index]!.height });
  };

  const move = (event: React.PointerEvent) => {
    const geo = geometry.current;
    if (!drag || !geo) return;
    const dy = event.clientY - originY.current;
    const centre = geo.tops[drag.from] + geo.heights[drag.from] / 2 + dy;
    // The target is the last row whose midpoint the dragged row has passed.
    let to = 0;
    for (let i = 0; i < geo.tops.length; i++) {
      if (centre > geo.tops[i] + geo.heights[i] / 2) to = i;
    }
    setDrag({ ...drag, dy, to });
  };

  const end = () => {
    if (drag && drag.to !== drag.from) onReorder(drag.from, drag.to);
    geometry.current = null;
    setDrag(null);
  };

  /** Keyboard equivalent, so reordering is not drag-only. */
  const nudge = (event: React.KeyboardEvent, index: number) => {
    const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!delta) return;
    const to = index + delta;
    if (to < 0 || to >= items.length) return;
    event.preventDefault();
    onReorder(index, to);
  };

  /** How far a row slides to make room for the one being dragged. */
  const shift = (index: number) => {
    if (!drag) return 0;
    if (index === drag.from) return drag.dy;
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -drag.height;
    if (drag.to < drag.from && index >= drag.to && index < drag.from) return drag.height;
    return 0;
  };

  return (
    <ul className="items" data-reordering={drag !== null}>
      {items.map((item, index) => (
        <li
          key={item.id}
          className="item"
          data-progress={item.progress}
          data-kind={item.kind}
          data-dragging={drag?.from === index}
          ref={(el) => {
            if (el) rows.current.set(item.id, el);
            else rows.current.delete(item.id);
          }}
          style={{ transform: `translateY(${shift(index)}px)` }}
        >
          <button
            className="grip"
            aria-label={`Reorder ${item.name}, position ${index + 1} of ${items.length}`}
            onPointerDown={(e) => start(e, index)}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onKeyDown={(e) => nudge(e, index)}
          >
            <Grip />
          </button>
          <button
            className="tick"
            onClick={() => onToggle(item.id)}
            disabled={lockTicking}
            aria-label={`${item.name}: ${STATE[item.progress]}. Tap to mark ${
              STATE[nextProgress(item)]
            }.`}
            title={canHalve(item.minutes) ? 'Tap through half done, then done' : undefined}
          >
            {GLYPH[item.progress]}
          </button>
          <button
            className="item-main"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.kind === 'transit' ? 'transit: ' : ''}${item.name}`}
          >
            {item.kind === 'transit' && (
              <span className="item-lead" aria-hidden="true">
                →
              </span>
            )}
            <span className="item-name">{item.name}</span>
            <span className="item-dur">{duration(item.minutes)}</span>
          </button>
          <button className="item-del" onClick={() => onDelete(item)} aria-label={`Delete ${item.name}`}>
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
