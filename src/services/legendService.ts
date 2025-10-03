import type { Legend } from '../types/common';

const LEGENDS_FILE = 'legendas.txt';
const DEFAULT_COLOR = '#4DA3FF';

function normalizeColor(color: string | undefined): string {
  const value = (color ?? '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return `#${value.toUpperCase()}`;
  }
  return DEFAULT_COLOR;
}

function sanitizeLegend(legend: Legend): Legend {
  return {
    name: legend.name.trim(),
    color: normalizeColor(legend.color),
  };
}

export async function loadLegends(root: FileSystemDirectoryHandle): Promise<Legend[]> {
  const fh = await root.getFileHandle(LEGENDS_FILE).catch(() => null);
  if (!fh) return [];

  const file = await fh.getFile();
  const content = await file.text();
  const lines = content.split(/\r?\n/);

  const seen = new Set<string>();
  const legends: Legend[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const [namePart, colorPart] = line.split('|');
    const name = (namePart ?? '').trim();
    if (!name || seen.has(name)) continue;
    const color = normalizeColor(colorPart);
    legends.push({ name, color });
    seen.add(name);
  }

  return legends;
}

export async function saveLegends(
  root: FileSystemDirectoryHandle,
  legends: Legend[],
): Promise<void> {
  const sanitized = legends
    .map(sanitizeLegend)
    .filter(legend => legend.name.length > 0);

  const fh = await root.getFileHandle(LEGENDS_FILE, { create: true });
  const writable = await fh.createWritable();
  const lines = sanitized.map(legend => `${legend.name}|${legend.color}`);
  await writable.write(lines.join('\n'));
  await writable.close();
}

export function normalizeLegendsList(list: Legend[]): Legend[] {
  const normalized = list.map(sanitizeLegend).filter(l => l.name.length > 0);
  const seen = new Set<string>();
  const result: Legend[] = [];
  for (const legend of normalized) {
    if (seen.has(legend.name)) continue;
    seen.add(legend.name);
    result.push(legend);
  }
  return result;
}

export function normalizeLegendColor(color: string | undefined): string {
  return normalizeColor(color);
}

export { LEGENDS_FILE };
