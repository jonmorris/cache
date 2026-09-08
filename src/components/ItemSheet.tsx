import { useEffect, useRef, useState } from 'react';
import { Sheet } from './Sheet';
import { DURATIONS } from '../types';
import { duration } from '../time';

interface ItemSheetProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialName?: string;
  initialMinutes?: number;
  onSubmit: (name: string, minutes: number) => void;
  onClose: () => void;
}

export function ItemSheet({
  open,
  mode,
  initialName = '',
  initialMinutes = 30,
  onSubmit,
  onClose,
}: ItemSheetProps) {
  const [name, setName] = useState(initialName);
  const [minutes, setMinutes] = useState(initialMinutes);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setMinutes(initialMinutes);
    // Focus after the sheet has finished sliding up; focusing mid-transition
    // makes iOS scroll the page under the keyboard.
    const timer = setTimeout(() => input.current?.focus(), 260);
    return () => clearTimeout(timer);
  }, [open, initialName, initialMinutes]);

  const trimmed = name.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    onSubmit(trimmed, minutes);
  };

  return (
    <Sheet open={open} title={mode === 'add' ? 'Add item' : 'Edit item'} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span className="field-label">Item</span>
          <input
            ref={input}
            className="input"
            value={name}
            maxLength={120}
            placeholder="What needs doing?"
            enterKeyHint="done"
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

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

        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={!trimmed}>
            {mode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
