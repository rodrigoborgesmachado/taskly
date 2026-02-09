import { useEffect, useState } from 'react';
import Modal from './Modal';

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (description: string, dueAt: string) => Promise<void> | void;
}

export default function NewTaskModal({ open, onClose, onCreate }: NewTaskModalProps) {
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    if (!open) return;
    setDescription('');
    setDueAt('');
    setSaving(false);
    setWarning('');
  }, [open]);

  const handleCreate = async () => {
    const desc = description.trim();
    if (desc.length < 3) return;
    if (!dueAt) return;

    const dueDate = new Date(dueAt);
    if (!Number.isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now()) {
      setWarning('Data no passado. A tarefa sera marcada como atrasada.');
    } else {
      setWarning('');
    }

    setSaving(true);
    try {
      await onCreate(desc, new Date(dueAt).toISOString());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const invalidDesc = description.trim().length < 3;
  const invalidDue = !dueAt;

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Nova tarefa</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Informe a descricao e a data/horario de vencimento.
            </p>
          </div>
          <button onClick={onClose}>Fechar</button>
        </header>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Descricao</span>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ex: Revisar documento"
            style={{ minHeight: 80 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Vencimento</span>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={e => setDueAt(e.target.value)}
          />
        </label>

        {warning && (
          <div style={{ fontSize: 12, color: 'var(--color-warning)' }}>{warning}</div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} disabled={saving}>Cancelar</button>
          <button
            onClick={handleCreate}
            disabled={saving || invalidDesc || invalidDue}
            style={{ padding: '6px 14px' }}
          >
            {saving ? 'Adicionando...' : 'Adicionar tarefa'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
