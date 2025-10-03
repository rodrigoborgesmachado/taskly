import { useEffect, useState } from 'react';
import Modal from './Modal';
import type { Legend } from '../types/common';
import { loadLegends, saveLegends, normalizeLegendsList, normalizeLegendColor } from '../services/legendService';
import { toast } from '../utils/toast';
import LegendTag from './LegendTag';

interface LegendModalProps {
  open: boolean;
  root: FileSystemDirectoryHandle | null;
  onClose: () => void;
  onSaved: (legends: Legend[]) => void;
}

const DEFAULT_COLOR = '#4DA3FF';

function colorInputValue(color: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : DEFAULT_COLOR;
}

export default function LegendModal({ open, root, onClose, onSaved }: LegendModalProps) {
  const [items, setItems] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!root) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    loadLegends(root)
      .then(list => setItems(list))
      .catch(() => setError('Falha ao carregar as legendas.'))
      .finally(() => setLoading(false));
  }, [open, root]);

  const handleAdd = () => {
    setItems(prev => [...prev, { name: '', color: DEFAULT_COLOR }]);
  };

  const handleRemove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleNameChange = (index: number, name: string) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, name } : item)));
  };

  const handleColorChange = (index: number, color: string) => {
    const normalized = normalizeLegendColor(color);
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, color: normalized } : item)));
  };

  const handleSave = async () => {
    if (!root) {
      toast.error('Selecione uma pasta antes de salvar.');
      return;
    }

    const trimmed = items.map(item => ({ ...item, name: item.name.trim() }));
    if (trimmed.some(item => item.name.length === 0)) {
      setError('Informe um nome para todas as legendas.');
      return;
    }

    const duplicates = new Set<string>();
    const seen = new Set<string>();
    for (const item of trimmed) {
      if (seen.has(item.name)) duplicates.add(item.name);
      seen.add(item.name);
    }
    if (duplicates.size > 0) {
      setError(`Existem legendas com nomes duplicados: ${Array.from(duplicates).join(', ')}.`);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const normalized = normalizeLegendsList(trimmed);
      await saveLegends(root, normalized);
      setItems(normalized);
      onSaved(normalized);
      toast.success('Legendas salvas com sucesso');
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar as legendas.');
    } finally {
      setSaving(false);
    }
  };

  const canEdit = !!root;

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Gerenciar Legendas</h2>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
              Crie, edite ou remova legendas utilizadas nos cards.
            </p>
          </div>
          <button onClick={onClose}>Fechar</button>
        </header>

        {!canEdit && (
          <div style={{ fontSize: 14, opacity: 0.75 }}>
            Selecione uma pasta raiz para gerenciar as legendas.
          </div>
        )}

        {canEdit && (
          <div style={{ display: 'grid', gap: 12 }}>
            {error && (
              <div style={{ border: '1px solid #a33', padding: '8px 10px', borderRadius: 8 }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ opacity: 0.7 }}>Carregando…</div>
            ) : items.length === 0 ? (
              <div style={{ opacity: 0.7 }}>Nenhuma legenda cadastrada.</div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto',
                    gap: 12,
                    alignItems: 'center',
                    border: '1px solid #2a2a2a',
                    borderRadius: 10,
                    padding: '10px 12px',
                    background: '#0d0d0d',
                  }}
                >
                  <label style={{ display: 'grid', gap: 4 }}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>Nome</span>
                    <input
                      value={item.name}
                      onChange={e => handleNameChange(index, e.target.value)}
                      placeholder="Nome da legenda"
                      style={{
                        background: '#0c0c0c',
                        border: '1px solid #2a2a2a',
                        color: '#eee',
                        borderRadius: 8,
                        padding: '8px 10px',
                      }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ display: 'grid', gap: 4 }}>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>Cor</span>
                      <input
                        type="color"
                        value={colorInputValue(item.color)}
                        onChange={e => handleColorChange(index, e.target.value)}
                        style={{ width: 48, height: 32, border: 'none', background: 'transparent' }}
                      />
                    </label>
                    <span style={{ fontSize: 12, opacity: 0.65, fontFamily: 'monospace' }}>{item.color}</span>
                    <LegendTag legend={item} />
                  </div>

                  <button onClick={() => handleRemove(index)} style={{ justifySelf: 'end' }}>
                    Remover
                  </button>
                </div>
              ))
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <button onClick={handleAdd} disabled={!canEdit}>
                Adicionar legenda
              </button>
              <button onClick={handleSave} disabled={!canEdit || saving}>
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
