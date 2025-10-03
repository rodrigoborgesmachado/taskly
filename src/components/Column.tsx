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
}

export default function Column({ stageKey, title, items, legends, onOpen, onDropCard, onNewCard }: ColumnProps) {
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
    </div>
  );
}
