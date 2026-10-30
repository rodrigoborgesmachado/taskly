import { DEFAULT_BOARD_SETTINGS } from '../services/boardSettingsService';

const RATING_COLOR = '#FACC15';

interface RatingStarsProps {
  rating?: number | null;
  stars?: number;
  size?: number;
  onRate?: (rating: number) => void;
}

export default function RatingStars({ rating, stars = DEFAULT_BOARD_SETTINGS.ratingStars, size = 16, onRate }: RatingStarsProps) {
  return (
    <div style={{ display: 'flex', gap: 2, fontSize: size, lineHeight: 1, flexShrink: 0 }}>
      {Array.from({ length: stars }, (_, index) => index + 1).map(star => (
        <span
          key={star}
          role={onRate ? 'button' : undefined}
          title={onRate ? `Avaliar com ${star} estrela(s)` : undefined}
          onClick={onRate ? (event) => {
            event.stopPropagation();
            onRate(star);
          } : undefined}
          style={{
            cursor: onRate ? 'pointer' : 'default',
            color: (rating ?? 0) >= star ? RATING_COLOR : 'var(--color-border-strong)',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
