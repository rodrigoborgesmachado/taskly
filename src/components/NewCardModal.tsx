import { useEffect, useState } from 'react';
import Modal from './Modal';

interface Props {
  open: boolean;
  stageName: string | null;
  onClose: () => void;
  onCreate: (folderTitle: string, description: string) => Promise<void>;
}

export default function NewCardModal({ open, stageName, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDesc('');
      setBusy(false);
    }
  }, [open, stageName]);

  const canSave = !!stageName && title.trim().length > 0 && !busy;

  const handleCreate = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await onCreate(title.trim(), desc);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Novo card {stageName ? `em “${stageName}”` : ''}</h3>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Título da pasta (ex.: ABC-0123 - Descrição)</span>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="XXX-0001 - Título do ticket"
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Descrição inicial (info.txt)</span>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Digite a descrição inicial..."
            style={{ height: 140 }}
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
