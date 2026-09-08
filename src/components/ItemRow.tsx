import type { Item } from '../types';
import { duration } from '../time';

interface ItemRowProps {
  item: Item;
  /** Future-dated lists are visible but cannot be ticked off yet. */
  lockTicking: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ItemRow({ item, lockTicking, onToggle, onEdit, onDelete }: ItemRowProps) {
  return (
    <li className="item" data-done={item.done}>
      <button
        className="tick"
        onClick={onToggle}
        disabled={lockTicking}
        aria-pressed={item.done}
        aria-label={`${item.done ? 'Not done' : 'Done'}: ${item.name}`}
      >
        {item.done ? '[x]' : '[ ]'}
      </button>
      <button className="item-main" onClick={onEdit} aria-label={`Edit ${item.name}`}>
        <span className="item-name">{item.name}</span>
        <span className="item-dur">{duration(item.minutes)}</span>
      </button>
      <button className="item-del" onClick={onDelete} aria-label={`Delete ${item.name}`}>
        ✕
      </button>
    </li>
  );
}
