import { useMemo, useState } from 'react';
import Modal from './Modal';
import type { DynamicBoardData } from '../services/boardService';
import type { TicketCard } from '../types/board';

interface BoardReportModalProps {
  open: boolean;
  board: DynamicBoardData | null;
  onClose: () => void;
}

type ListCount = { listId: string; listName: string; count: number };
type LegendCount = { legendName: string; color: string; count: number; percent: number };
type ActivityPoint = { date: string; count: number };

const NO_LEGEND_LABEL = 'Sem legenda';
const NO_LEGEND_COLOR = '#64748b';

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateTime(ts?: number) {
  if (!ts) return 'Sem atividade';
  return new Date(ts).toLocaleString();
}

function csvEscape(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCards(board: DynamicBoardData): TicketCard[] {
  return board.stages.flatMap(stage => board.itemsByStage[stage.key] || []);
}

function buildActivity(cards: TicketCard[], rangeDays: number): ActivityPoint[] {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (rangeDays - 1));

  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!card.updatedAt) continue;
    const day = startOfDay(new Date(card.updatedAt));
    if (day < start || day > today) continue;
    const key = toDateKey(day);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series: ActivityPoint[] = [];
  for (let i = 0; i < rangeDays; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toDateKey(d);
    series.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return series;
}

function BarChart({ data }: { data: ListCount[] }) {
  const max = Math.max(1, ...data.map(item => item.count));
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {data.map(item => (
        <div key={item.listId} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 48px', gap: 10, alignItems: 'center' }}>
          <span style={{ textAlign: 'left', fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.listName}</span>
          <div style={{ background: 'var(--color-surface-muted)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(item.count / max) * 100}%`,
                height: '100%',
                background: 'var(--color-accent)',
              }}
            />
          </div>
          <span style={{ fontSize: 12, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data, total }: { data: LegendCount[]; total: number }) {
  const size = 180;
  const center = size / 2;
  const outer = 70;
  const inner = 40;

  let startAngle = -Math.PI / 2;
  const segments = data.filter(item => item.count > 0);

  const paths = segments.map((item, index) => {
    const value = item.count;
    const angle = total > 0 ? (value / total) * Math.PI * 2 : 0;
    const endAngle = startAngle + angle;

    const x1 = center + outer * Math.cos(startAngle);
    const y1 = center + outer * Math.sin(startAngle);
    const x2 = center + outer * Math.cos(endAngle);
    const y2 = center + outer * Math.sin(endAngle);

    const xi1 = center + inner * Math.cos(endAngle);
    const yi1 = center + inner * Math.sin(endAngle);
    const xi2 = center + inner * Math.cos(startAngle);
    const yi2 = center + inner * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    const d = [
      `M ${x1} ${y1}`,
      `A ${outer} ${outer} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi1} ${yi1}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${xi2} ${yi2}`,
      'Z',
    ].join(' ');

    startAngle = endAngle;

    return <path key={`${item.legendName}-${index}`} d={d} fill={item.color} />;
  });

  return (
    <svg width={size} height={size} role="img" aria-label="Legenda">
      <circle cx={center} cy={center} r={outer} fill="var(--color-surface-muted)" />
      {paths}
      <circle cx={center} cy={center} r={inner} fill="var(--color-surface)" />
      <text x={center} y={center - 2} textAnchor="middle" fontSize="16" fill="var(--color-text-primary)" fontWeight="600">
        {total}
      </text>
      <text x={center} y={center + 16} textAnchor="middle" fontSize="11" fill="var(--color-text-secondary)">
        cards
      </text>
    </svg>
  );
}

function ActivityBarChart({ data }: { data: ActivityPoint[] }) {
  const width = 680;
  const height = 480;
  const padding = 24;
  const bottomPadding = 36;
  const max = Math.max(1, ...data.map(item => item.count));
  const labelEvery = Math.max(1, Math.ceil(data.length / 10));

  const usableHeight = height - padding - bottomPadding;
  const barGap = 3;
  const barCount = Math.max(1, data.length);
  const barWidth = Math.max(4, Math.floor((width - padding - barGap * (barCount - 1)) / barCount));

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Atividade">
      <path d={`M ${padding} 444 L ${width - padding} 444`} stroke="var(--color-border-strong)" strokeWidth="1" />
      {data.map((item, index) => {
        const x = padding + index * (barWidth + barGap);
        const barHeight = (item.count / max) * usableHeight;
        const y = height - bottomPadding - barHeight;
        const labelX = x + barWidth / 2;
        return (
        <g key={`${index}`}>
          <rect
            x={x}
            y={y}
            width={barWidth}
            height={Math.max(2, barHeight)}
            rx="2"
            fill="var(--color-accent)"
          />
          <>
            <text x={labelX} y={Math.max(12, y - 8)} textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)">
              {item.count}
            </text>
            <text
              x={labelX}
              y={height - 24}
              textAnchor="end"
              fontSize="9"
              fill="var(--color-text-secondary)"
              transform={`rotate(-45 ${labelX} ${height - 12})`}
            >
              {item.date.split('-')[2]}/{item.date.split('-')[1]}
            </text>
          </>
          <title>{`${item.date}: ${item.count} atividades`}</title>
        </g>
        );
      })}
    </svg>
  );
}

export default function BoardReportModal({ open, board, onClose }: BoardReportModalProps) {
  const [rangeDays, setRangeDays] = useState(30);

  const report = useMemo(() => {
    if (!board) return null;
    const cards = buildCards(board);
    const totalCards = cards.length;
    const lastActivity = cards.reduce((max, card) => Math.max(max, card.updatedAt ?? 0), 0);
    const active7d = cards.filter(card => (card.updatedAt ?? 0) >= Date.now() - 7 * 24 * 60 * 60 * 1000).length;

    const listCounts: ListCount[] = board.stages.map(stage => ({
      listId: stage.key,
      listName: stage.label,
      count: (board.itemsByStage[stage.key] || []).length,
    }));

    const legendMap = new Map(board.legends.map(legend => [legend.name, legend.color] as const));
    const legendCountsMap = new Map<string, number>();
    for (const legend of board.legends) legendCountsMap.set(legend.name, 0);
    legendCountsMap.set(NO_LEGEND_LABEL, 0);

    for (const card of cards) {
      const cardLegends = card.legends?.length ? card.legends : [NO_LEGEND_LABEL];
      for (const legendName of cardLegends) {
        legendCountsMap.set(legendName, (legendCountsMap.get(legendName) ?? 0) + 1);
      }
    }

    const legendCounts: LegendCount[] = Array.from(legendCountsMap.entries()).map(([legendName, count]) => ({
      legendName,
      color: legendName === NO_LEGEND_LABEL ? NO_LEGEND_COLOR : (legendMap.get(legendName) ?? NO_LEGEND_COLOR),
      count,
      percent: totalCards ? Math.round((count / totalCards) * 100) : 0,
    }));

    legendCounts.sort((a, b) => b.count - a.count);
    const topLegend = legendCounts[0] ?? null;

    const topList = listCounts.slice().sort((a, b) => b.count - a.count)[0] ?? null;

    const activityByDay = buildActivity(cards, rangeDays);

    return {
      cards,
      totalCards,
      listCounts,
      legendCounts,
      topLegend,
      topList,
      activityByDay,
      lastActivity,
      active7d,
    };
  }, [board, rangeDays]);

  const handleExportCsv = () => {
    if (!report || !board) return;
    const stageLabel = new Map(board.stages.map(stage => [stage.key, stage.label] as const));
    const header = ['cardId', 'title', 'listName', 'legendNames', 'createdAt', 'updatedAt'];
    const rows = report.cards.map(card => {
      const listName = stageLabel.get(card.stage) ?? card.stage;
      const legendNames = (card.legends ?? []).join('|');
      return [
        card.folderHandle?.name ?? '',
        card.title ?? '',
        listName,
        legendNames,
        '',
        card.updatedAt ? new Date(card.updatedAt).toISOString() : '',
      ].map(value => csvEscape(String(value)));
    });

    const csv = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskly-report-${toDateKey(new Date())}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Relatorio do board</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Resumo gerado a partir do estado atual do board.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExportCsv} disabled={!report}>Exportar CSV</button>
            <button onClick={onClose}>Fechar</button>
          </div>
        </header>

        {!board && (
          <div style={{ color: 'var(--color-text-secondary)' }}>Carregue um board para ver o relatorio.</div>
        )}

        {report && (
          <>
            <section style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, background: 'var(--color-surface)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Total de cards</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{report.totalCards}</div>
                </div>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, background: 'var(--color-surface)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Lista com mais cards</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {report.topList?.listName || 'Sem listas'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {report.topList?.count ?? 0} cards
                  </div>
                </div>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, background: 'var(--color-surface)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Legenda mais usada</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {report.topLegend?.legendName || NO_LEGEND_LABEL}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {report.topLegend?.count ?? 0} cards
                  </div>
                </div>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, background: 'var(--color-surface)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Ultima atividade</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{formatDateTime(report.lastActivity)}</div>
                </div>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, background: 'var(--color-surface)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Cards movimentados últimos 7d</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{report.active7d}</div>
                </div>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 14, background: 'var(--color-surface)' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>Cards por lista</h3>
                <BarChart data={report.listCounts} />
              </div>

              <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 14, background: 'var(--color-surface)', display: 'grid', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>Cards por legenda</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, alignItems: 'center' }}>
                  <DonutChart data={report.legendCounts} total={report.totalCards} />
                  <div style={{ display: 'grid', gap: 6 }}>
                    {report.legendCounts.map(item => (
                      <div key={item.legendName} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 999, background: item.color }} />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{item.legendName}</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)' }}>
                          {item.count} ({item.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 14, background: 'var(--color-surface)', display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>Atividade por dia</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Intervalo
                  <select value={rangeDays} onChange={e => setRangeDays(Number(e.target.value))}>
                    {[30, 60, 90].map(value => (
                      <option key={value} value={value}>{value} dias</option>
                    ))}
                  </select>
                </label>
              </div>
              {report.activityByDay.every(item => item.count === 0) ? (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Sem atividade recente.</div>
              ) : (
                <ActivityBarChart data={report.activityByDay} />
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
