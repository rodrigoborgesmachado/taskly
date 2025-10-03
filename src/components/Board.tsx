import type { DynamicBoardData } from '../services/boardService';
import type { TicketCard } from '../types/board';
import Column from './Column';

interface BoardProps {
  data: DynamicBoardData;
  onOpenCard: (card: TicketCard) => void;
  onDropCard: (targetStage: string, payload: { stage: string; name: string }) => void;
  onNewCard: (stageKey: string) => void;
  onUpdateCardLegends: (card: TicketCard, legends: string[]) => Promise<void>;
}

export default function Board({ data, onOpenCard, onDropCard, onNewCard, onUpdateCardLegends }: BoardProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.stages.length}, 1fr)`, gap: 12 }}>
      {data.stages.map(s => (
        <Column
          key={s.key}
          stageKey={s.key}
          title={s.label}
          items={data.itemsByStage[s.key] || []}
          legends={data.legends}
          onOpen={onOpenCard}
          onDropCard={onDropCard}
          onNewCard={onNewCard}
          onLegendsChange={onUpdateCardLegends}
        />
      ))}
    </div>
  );
}
