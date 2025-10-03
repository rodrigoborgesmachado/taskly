import type { Legend } from '../types/common';

interface LegendTagProps {
  legend: Legend;
}

function parseHexColor(color: string): { r: number; g: number; b: number } | null {
  const value = color.trim();
  const hexMatch = value.match(/^#?([0-9a-fA-F]{6})$/);
  if (!hexMatch) return null;
  const hex = hexMatch[1];
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b };
}

function getContrastColor(color: string): string {
  const rgb = parseHexColor(color);
  if (!rgb) return '#111';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? '#111' : '#f5f5f5';
}

export default function LegendTag({ legend }: LegendTagProps) {
  const bg = legend.color || '#4DA3FF';
  const color = getContrastColor(bg);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 600,
        border: '1px solid rgba(0,0,0,0.2)',
      }}
    >
      {legend.name}
    </span>
  );
}
