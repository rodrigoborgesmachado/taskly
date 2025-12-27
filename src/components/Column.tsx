import { useEffect, useMemo, useState } from 'react';
import type { TicketCard } from '../types/board';
import type { Legend } from '../types/common';
import LegendTag from './LegendTag';

interface ColumnProps {
  stageKey: string;
  title: string;
  items: TicketCard[];
  legends: Legend[];
  onOpen: (card: TicketCard) => void;
  onDropCard: (targetStage: string, payload: { stage: string; name: string }) => void;
  onNewCard: (stageKey: string) => void;
  onLegendsChange: (card: TicketCard, legendNames: string[]) => Promise<void>;
}

interface ContextMenuState {
  card: TicketCard;
  x: number;
  y: number;
  selected: string[];
  missing: string[];
  pending: boolean;
  error: string | null;
}

export default function Column({ stageKey, title, items, legends, onOpen, onDropCard, onNewCard, onLegendsChange }: ColumnProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const txt = e.dataTransfer.getData('text/plain');
      const payload = JSON.parse(txt) as { stage: string; name: string };
      if (payload?.name && payload?.stage) {
        onDropCard(stageKey, payload);
      }
    } catch { /* ignore */ }
  };

  function fmtDate(n?: number) {
    if (!n) return '';
    const d = new Date(n);
    return d.toLocaleString(); // ou toLocaleDateString()
  }

  const legendOrder = useMemo(() => {
    return new Map(legends.map((legend, index) => [legend.name, index] as const));
  }, [legends]);

  const openContextMenu = (event: React.MouseEvent<HTMLButtonElement>, card: TicketCard) => {
    event.preventDefault();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 240;
    const menuHeightEstimate = Math.min(Math.max(legends.length, 1) * 36 + 80, 320);

    let x = event.clientX;
    let y = event.clientY;

    if (x + menuWidth > viewportWidth) {
      x = Math.max(8, viewportWidth - menuWidth - 8);
    }

    if (y + menuHeightEstimate > viewportHeight) {
      y = Math.max(8, viewportHeight - menuHeightEstimate - 8);
    }

    const currentLegends = card.legends ?? [];
    const available = currentLegends.filter(name => legendOrder.has(name));
    const missing = currentLegends.filter(name => !legendOrder.has(name));

    setContextMenu({
      card,
      x,
      y,
      selected: available,
      missing,
      pending: false,
      error: null,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeContextMenu();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [contextMenu]);

  const toggleLegendFromMenu = async (legendName: string) => {
    setContextMenu(prev => {
      if (!prev) return prev;
      if (prev.pending) return prev;
      const exists = prev.selected.includes(legendName);
      let nextSelected = exists
        ? prev.selected.filter(item => item !== legendName)
        : [...prev.selected, legendName];

      nextSelected = nextSelected
        .filter(name => legendOrder.has(name))
        .sort((a, b) => (legendOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (legendOrder.get(b) ?? Number.MAX_SAFE_INTEGER));

      return { ...prev, selected: nextSelected, pending: true, error: null };
    });

    const state = contextMenu;
    if (!state) return;

    const previousSelected = state.selected;
    const exists = previousSelected.includes(legendName);
    let nextSelected = exists
      ? previousSelected.filter(item => item !== legendName)
      : [...previousSelected, legendName];

    nextSelected = nextSelected
      .filter(name => legendOrder.has(name))
      .sort((a, b) => (legendOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (legendOrder.get(b) ?? Number.MAX_SAFE_INTEGER));

    try {
      await onLegendsChange(state.card, nextSelected);
      setContextMenu(prev => (prev ? { ...prev, pending: false, selected: nextSelected } : prev));
    } catch (e) {
      console.error(e);
      setContextMenu(prev => (prev ? { ...prev, pending: false, selected: previousSelected, error: 'Não foi possível atualizar as legendas.' } : prev));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        border: '1px solid var(--color-list-border)',
        borderRadius: 12,
        padding: 12,
        minHeight: 120,
        background: 'var(--color-list-bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: '16rem',
        flex: '1 0 16rem',
        maxHeight: '70vh',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color: 'var(--color-text-secondary)' }}>{items.length}</span>
          <button onClick={() => onNewCard(stageKey)} title="Novo card">+ Novo</button>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gap: 8,
          overflowY: 'auto',
          padding: '4px'
        }}
      >
        {items.map((c, i) => (
          <button
            key={i}
            onClick={() => onOpen(c)}
            onContextMenu={(event) => openContextMenu(event, c)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', JSON.stringify({
                stage: c.stage,
                name: c.folderHandle.name
              }));
              e.dataTransfer.dropEffect = 'move';
            }}
            className="ticket-card"
          >
            <div style={{ fontWeight: 600 }}>{c.title.slice(0, 80)}</div>
            <div style={{ fontSize: 12, opacity: .75, marginTop: 4 }}>
              {((c.description || '').split(/\r?\n/)[0].slice(0, 150)) || 'Sem descrição'}
            </div>
            {c.updatedAt && (
              <div style={{ fontSize: 11, opacity: .6, marginTop: 4 }}>
                Atualizado: {fmtDate(c.updatedAt)}
              </div>
            )}
            {c.attachments.length > 0 && (
              <div style={{ fontSize: 11, opacity: .65, marginTop: 6 }}>
                {c.attachments.length} anexo(s)
              </div>
            )}
            {!!c.legends?.length && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {c.legends
                  .map(name => legends.find(l => l.name === name))
                  .filter((legend): legend is Legend => !!legend)
                  .map(legend => (
                    <LegendTag key={legend.name} legend={legend} />
                  ))}
              </div>
            )}
          </button>
        ))}
        {items.length === 0 && <div style={{ opacity: .7, fontSize: 14 }}>Vazio</div>}
      </div>

      {contextMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={closeContextMenu}
        >
          <div
            style={{
              position: 'absolute',
              top: contextMenu.y,
              left: contextMenu.x,
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 12,
              padding: '14px 16px',
              minWidth: 240,
              boxShadow: '0 18px 38px rgba(15, 23, 42, 0.35)',
              color: 'var(--color-text-primary)',
            }}
            onClick={event => event.stopPropagation()}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Legendas
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
              Clique para alternar as legendas do card "{contextMenu.card.title}".
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {legends.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Nenhuma legenda disponível.
                </div>
              ) : (
                legends.map(legend => {
                  const selected = contextMenu.selected.includes(legend.name);
                  return (
                    <button
                      key={legend.name}
                      onClick={() => toggleLegendFromMenu(legend.name)}
                      disabled={contextMenu.pending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: selected ? '1px solid var(--color-accent)' : '1px solid transparent',
                        background: selected ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)' : 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        cursor: contextMenu.pending ? 'progress' : 'pointer',
                        fontSize: 13,
                        textAlign: 'left',
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: legend.color,
                          border: '1px solid rgba(15, 23, 42, 0.3)',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1 }}>{legend.name}</span>
                      {selected && (
                        <span aria-hidden style={{ opacity: 0.8 }}>✓</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            {contextMenu.error && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-danger)' }}>
                {contextMenu.error}
              </div>
            )}
            {!!contextMenu.missing.length && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-warning)' }}>
                Legendas não encontradas: {contextMenu.missing.join(', ')}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 10 }}>
              Clique fora para fechar o menu.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
