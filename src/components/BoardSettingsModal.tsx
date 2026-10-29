import { useEffect, useState } from 'react';
import Modal from './Modal';
import type { BoardSettings } from '../types/common';
import { DEFAULT_BOARD_SETTINGS } from '../services/boardSettingsService';

interface BoardSettingsModalProps {
  open: boolean;
  settings: BoardSettings | null;
  onClose: () => void;
  onSave: (settings: BoardSettings) => Promise<void>;
}

export default function BoardSettingsModal({ open, settings, onClose, onSave }: BoardSettingsModalProps) {
  const [form, setForm] = useState<BoardSettings>(DEFAULT_BOARD_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(settings ?? DEFAULT_BOARD_SETTINGS);
      setSaving(false);
    }
  }, [open, settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Configurações do board</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Defina as opções utilizadas neste board.
            </p>
          </div>
          <button onClick={onClose}>Fechar</button>
        </header>

        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '12px 14px',
            background: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Avaliação de card</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Exibe 5 estrelas em cada card para avaliá-lo.
            </span>
          </div>
          <input
            type="checkbox"
            checked={form.cardRating}
            onChange={e => setForm(prev => ({ ...prev, cardRating: e.target.checked }))}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '6px 12px' }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
