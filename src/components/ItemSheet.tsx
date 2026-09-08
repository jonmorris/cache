import { useEffect, useRef, useState } from 'react';
import { Sheet } from './Sheet';
import { DURATIONS, type Kind } from '../types';
import { duration } from '../time';

interface ItemSheetProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialName?: string;
  initialMinutes?: number;
  initialKind?: Kind;
  /** True when seven tasks already exist, so only transit can be chosen. */
  tasksFull?: boolean;
  onSubmit: (name: string, minutes: number, kind: Kind) => void;
  onClose: () => void;
}

const FORM_ID = 'item-form';

const KINDS: { value: Kind; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'transit', label: 'Transit' },
];

export function ItemSheet({
  open,
  mode,
  initialName = '',
  initialMinutes = 30,
  initialKind = 'task',
  tasksFull = false,
  onSubmit,
  onClose,
}: ItemSheetProps) {
  const [name, setName] = useState(initialName);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [kind, setKind] = useState<Kind>(initialKind);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setMinutes(initialMinutes);
    // Task is the default, but it cannot be chosen once the seven are used, so
    // opening on a full list lands on transit rather than a disabled option.
    setKind(tasksFull && initialKind === 'task' ? 'transit' : initialKind);
    // Focus after the sheet has finished sliding up; focusing mid-transition
    // makes iOS scroll the page under the keyboard.
    const timer = setTimeout(() => input.current?.focus(), 260);
    return () => clearTimeout(timer);
  }, [open, initialName, initialMinutes, initialKind, tasksFull]);

  const trimmed = name.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    onSubmit(trimmed, minutes, kind);
  };

  /* Task is barred once the seven are used — except when editing one of those
     seven, which holds its own slot and may keep it. Adding is never exempt:
     there is no existing slot to keep. */
  const holdsASlot = mode === 'edit' && initialKind === 'task';
  const barred = (k: Kind) => k === 'task' && tasksFull && !holdsASlot;

  return (
    <Sheet
      open={open}
      title={mode === 'add' ? 'Add item' : 'Edit item'}
      onClose={onClose}
      footer={
        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          {/* Outside the form, so `form` is what still submits it. */}
          <button type="submit" form={FORM_ID} className="btn primary" disabled={!trimmed}>
            {mode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={submit}>
        <label className="field">
          <span className="field-label">Item</span>
          <input
            ref={input}
            className="input"
            value={name}
            maxLength={120}
            placeholder={kind === 'transit' ? 'Getting where?' : 'What needs doing?'}
            enterKeyHint="done"
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="field">
          <span className="field-label">Kind</span>
          <div className="kind-pick" role="radiogroup" aria-label="Kind of item">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                role="radio"
                aria-checked={kind === k.value}
                disabled={barred(k.value)}
                className="kind-opt"
                onClick={() => setKind(k.value)}
              >
                {k.label}
              </button>
            ))}
          </div>
          {/* Only when Task is refused: a disabled option needs a reason, but
              two labelled buttons do not need explaining. */}
          {barred('task') && (
            <p className="field-hint">All seven tasks are used. Transit does not need a slot.</p>
          )}
        </div>

        <label className="field">
          <span className="field-label">Estimate</span>
          <span className="select-wrap">
            <select
              className="select"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {duration(d)}
                </option>
              ))}
            </select>
            <span className="select-caret" aria-hidden="true">
              ▼
            </span>
          </span>
        </label>
      </form>
    </Sheet>
  );
}
