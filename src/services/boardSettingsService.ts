import type { BoardSettings } from '../types/common';

const BOARD_SETTINGS_FILE = 'configuracoes.json';

export const MIN_RATING_STARS = 3;
export const MAX_RATING_STARS = 10;

export const DEFAULT_BOARD_SETTINGS: BoardSettings = {
  cardRating: false,
  ratingStars: 5,
  confirmArchiveCard: false,
};

export function normalizeRatingStars(value: unknown): number {
  const stars = Math.round(Number(value));
  if (!stars) return DEFAULT_BOARD_SETTINGS.ratingStars;
  return Math.min(MAX_RATING_STARS, Math.max(MIN_RATING_STARS, stars));
}

export async function loadBoardSettings(root: FileSystemDirectoryHandle): Promise<BoardSettings> {
  const fh = await root.getFileHandle(BOARD_SETTINGS_FILE).catch(() => null);
  if (!fh) return { ...DEFAULT_BOARD_SETTINGS };

  try {
    const file = await fh.getFile();
    const parsed = JSON.parse((await file.text()) || '{}') as Partial<BoardSettings>;
    return {
      cardRating: !!parsed.cardRating,
      ratingStars: normalizeRatingStars(parsed.ratingStars),
      confirmArchiveCard: !!parsed.confirmArchiveCard,
    };
  } catch (e) {
    console.warn('Erro lendo configuracoes.json', e);
    return { ...DEFAULT_BOARD_SETTINGS };
  }
}

export async function saveBoardSettings(
  root: FileSystemDirectoryHandle,
  settings: BoardSettings,
): Promise<void> {
  const fh = await root.getFileHandle(BOARD_SETTINGS_FILE, { create: true });
  const writable = await fh.createWritable();
  await writable.write(JSON.stringify(settings, null, 2));
  await writable.close();
}
