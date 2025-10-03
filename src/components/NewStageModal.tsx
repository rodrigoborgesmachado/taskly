import { useEffect, useState } from 'react';
import Modal from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export default function NewStageModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setBusy(false);
    }
  }, [open]);

  const canSave = title.trim().length > 0 && !busy;

  const handleCreate = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await onCreate(title.trim());
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Nova lista</h3>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Nome da pasta</span>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nome da lista"
          />
        </label>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop: 8 }}>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleCreate} disabled={!canSave} style={{ padding:'6px 12px' }}>
            {busy ? 'Criando…' : 'Criar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
