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
      style={{ border: '1px solid #2a2a2a', borderRadius: 12, padding: 10, minHeight: 120 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', fontWeight: 700 }}>{title}</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, opacity:.7 }}>{items.length}</span>
          <button onClick={() => onNewCard(stageKey)} title="Novo card">+ Novo</button>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
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
            <div style={{ fontWeight: 600 }}>{c.title}</div>
            <div style={{ fontSize: 12, opacity: .75, marginTop: 4 }}>
              {(c.description || '').split(/\r?\n/)[0] || 'Sem descrição'}
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
              background: '#121212',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              padding: '12px 14px',
              minWidth: 220,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              color: '#f2f2f2',
            }}
            onClick={event => event.stopPropagation()}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Legendas
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
              Clique para alternar as legendas do card "{contextMenu.card.title}".
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {legends.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.75 }}>
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
                        border: '1px solid transparent',
                        background: selected ? 'rgba(44, 222, 191, 0.12)' : '#0d0d0d',
                        color: '#f2f2f2',
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
                          border: '1px solid rgba(255,255,255,0.3)',
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
              <div style={{ marginTop: 10, fontSize: 12, color: '#ff8585' }}>
                {contextMenu.error}
              </div>
            )}
            {!!contextMenu.missing.length && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#ffb347' }}>
                Legendas não encontradas: {contextMenu.missing.join(', ')}
              </div>
            )}
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 10 }}>
              Clique fora para fechar o menu.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
