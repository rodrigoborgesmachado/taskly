import type { DynamicBoardData } from '../services/boardService';
import type { TicketCard } from '../types/board';
import Column from './Column';
import { getVisibleStages } from '../utils/archive';

interface BoardProps {
  data: DynamicBoardData;
  onOpenCard: (card: TicketCard) => void;
  onDropCard: (targetStage: string, payload: { stage: string; name: string }) => void;
  onNewCard: (stageKey: string) => void;
  onUpdateCardLegends: (card: TicketCard, legends: string[]) => Promise<void>;
  onArchiveCard: (card: TicketCard) => Promise<void>;
  onRestoreCard: (card: TicketCard) => Promise<void>;
}

export default function Board({ data, onOpenCard, onDropCard, onNewCard, onUpdateCardLegends, onArchiveCard, onRestoreCard }: BoardProps) {
  const visibleStages = getVisibleStages(data.stages);
  return (
    <div
      className="board-surface"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 8,
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {visibleStages.map(s => (
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
          onArchiveCard={onArchiveCard}
          onRestoreCard={onRestoreCard}
        />
      ))}
    </div>
  );
}
