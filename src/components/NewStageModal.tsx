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
        <h3 style={{ margin: 0 }}>Nova lista</h3>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, opacity: .8 }}>Nome da pasta</span>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nome da lista"
            style={{ background:'#0c0c0c', color:'#eee', border:'1px solid #2a2a2a', borderRadius:8, padding:'8px 10px' }}
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
