import Modal from './Modal';
import RatingStars from './RatingStars';
import type { CardRating } from '../types/board';

interface RatingHistoryModalProps {
  open: boolean;
  onClose: () => void;
  history: CardRating[];
}

function formatRatingDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString();
}

export default function RatingHistoryModal({ open, onClose, history }: RatingHistoryModalProps) {
  const items = [...history].reverse();

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Avaliações</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Histórico de avaliações do card, da mais recente para a mais antiga.
            </p>
          </div>
          <button onClick={onClose}>Fechar</button>
        </header>

        {items.length > 0 ? (
          <ul style={{ display: 'grid', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
            {items.map((item, index) => (
              <li
                key={`${item.date}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  background: 'var(--color-surface)',
                }}
              >
                <RatingStars rating={item.rating} size={18} />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {formatRatingDate(item.date)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Nenhuma avaliação registrada.</div>
        )}
      </div>
    </Modal>
  );
}
