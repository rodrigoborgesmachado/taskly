import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-overlay)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(800px, 96vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
