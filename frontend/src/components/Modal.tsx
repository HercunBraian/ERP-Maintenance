import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({
  open, onClose, title, children, maxWidth = 600,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: number;
}) {
  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-xl shadow-card-lg max-h-[90vh] w-full flex flex-col overflow-hidden"
        style={{ maxWidth }}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold text-fg">{title}</h2>
          <button
            onClick={onClose}
            className="text-fg-muted hover:text-fg p-1 rounded transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
