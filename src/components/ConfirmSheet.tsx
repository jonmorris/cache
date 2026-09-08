import type { ReactNode } from 'react';
import { Sheet } from './Sheet';

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  return (
    <Sheet open={open} title={title} onClose={onClose}>
      <p className="sheet-text">{body}</p>
      <div className="sheet-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
