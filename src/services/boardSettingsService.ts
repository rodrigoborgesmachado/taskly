import type { BoardSettings } from '../types/common';

const BOARD_SETTINGS_FILE = 'configuracoes.json';

export const DEFAULT_BOARD_SETTINGS: BoardSettings = {
  cardRating: false,
};

export async function loadBoardSettings(root: FileSystemDirectoryHandle): Promise<BoardSettings> {
  const fh = await root.getFileHandle(BOARD_SETTINGS_FILE).catch(() => null);
  if (!fh) return { ...DEFAULT_BOARD_SETTINGS };

  try {
    const file = await fh.getFile();
    const parsed = JSON.parse((await file.text()) || '{}') as Partial<BoardSettings>;
    return {
      cardRating: !!parsed.cardRating,
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
