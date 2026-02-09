import { useMemo, useState } from 'react';
import type { TicketCard } from '../types/board';
import type { Legend, StageInfo } from '../types/common';
import Modal from './Modal';
import LegendTag from './LegendTag';
import { getVisibleStages } from '../utils/archive';

interface ArchivedCardsModalProps {
  open: boolean;
  cards: TicketCard[];
  stages: StageInfo[];
  legends: Legend[];
  onClose: () => void;
  onRestore: (card: TicketCard) => Promise<void>;
}

export default function ArchivedCardsModal({ open, cards, stages, legends, onClose, onRestore }: ArchivedCardsModalProps) {
  const [query, setQuery] = useState('');

  const stageLabelMap = useMemo(() => {
    const map = new Map(stages.map(stage => [stage.key, stage.label] as const));
    return map;
  }, [stages]);

  const visibleStages = useMemo(() => getVisibleStages(stages), [stages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...cards].sort((a, b) => {
      const aTime = new Date(a.archivedAt ?? 0).getTime();
      const bTime = new Date(b.archivedAt ?? 0).getTime();
      return bTime - aTime;
    });
    if (!q) return base;
    return base.filter(card => (card.title || '').toLowerCase().includes(q));
  }, [cards, query]);

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Cards arquivados</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {cards.length} card(s) arquivado(s)
            </p>
          </div>
          <button onClick={onClose}>Fechar</button>
        </header>

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por titulo"
        />

        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {filtered.map(card => {
              const originalListId = card.archivedFromListId ?? '';
              const originalLabel = stageLabelMap.get(originalListId) || card.archivedFromListName || '';
              const originalExists = !!stageLabelMap.get(originalListId);
              const fallbackStage = visibleStages[0];
              const fallbackLabel = fallbackStage ? fallbackStage.label : 'Nenhuma lista';
              return (
                <div
                  key={`${card.stage}-${card.folderHandle.name}`}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    background: 'var(--color-surface)',
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{card.title}</div>
                    <button onClick={() => onRestore(card)} style={{ padding: '6px 10px' }}>
                      Restaurar
                    </button>
                  </div>
                  {!!card.legends?.length && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {card.legends
                        .map(name => legends.find(l => l.name === name))
                        .filter((legend): legend is Legend => !!legend)
                        .map(legend => (
                          <LegendTag key={legend.name} legend={legend} />
                        ))}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Arquivado em: {card.archivedAt ? new Date(card.archivedAt).toLocaleString() : 'Sem data'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Vai voltar para: {originalExists ? originalLabel : fallbackLabel}
                  </div>
                  {!originalExists && (
                    <div style={{ fontSize: 12, color: 'var(--color-warning)' }}>
                      Lista original nao existe mais, card sera movido para {fallbackLabel}.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-secondary)' }}>Nenhum card arquivado.</div>
        )}
      </div>
    </Modal>
  );
}
