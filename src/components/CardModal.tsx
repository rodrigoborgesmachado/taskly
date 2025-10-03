import { useState, useEffect, type ReactNode, type SVGProps } from 'react';
import Modal from './Modal';
import type { TicketCard } from '../types/board';
import { addAttachment, openAttachment, saveDescription, addComment, saveCardLegends } from '../services/fsWeb'; // <- add addComment
import { toast } from '../utils/toast';
import type { Legend, StageKey } from '../types/common';
import LegendTag from './LegendTag';

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
const TRAILING_PUNCTUATION_REGEX = /[),.;!?]+$/;

function renderCommentWithLinks(comment: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of comment.matchAll(URL_REGEX)) {
    const index = match.index ?? 0;
    const rawUrl = match[0];

    if (index > lastIndex) {
      const textSegment = comment.slice(lastIndex, index);
      nodes.push(<span key={`text-${key++}`}>{textSegment}</span>);
    }

    let url = rawUrl;
    let trailing = '';

    while (url && TRAILING_PUNCTUATION_REGEX.test(url[url.length - 1] ?? '')) {
      trailing = url[url.length - 1] + trailing;
      url = url.slice(0, -1);
    }

    if (url) {
      nodes.push(
        <a
          key={`link-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#4da3ff', textDecoration: 'underline' }}
        >
          {url}
        </a>,
      );
    }

    if (trailing) {
      nodes.push(<span key={`trail-${key++}`}>{trailing}</span>);
    }

    lastIndex = index + rawUrl.length;
  }

  if (lastIndex < comment.length) {
    nodes.push(<span key={`text-${key++}`}>{comment.slice(lastIndex)}</span>);
  }

  if (nodes.length === 0) {
    return [<span key="text-0">{comment}</span>];
  }

  return nodes;
}

interface CardModalProps {
  open: boolean;
  card: TicketCard | null;
  onClose: () => void;
  onSaved: () => void;      // recarrega board/coluna
  onMove?: (target: StageKey) => void;
  availableLegends: Legend[];
}

function humanSize(n?: number) {
  if (!n) return '';
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0; let x = n;
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; }
  return `${x.toFixed(x < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

export default function CardModal({ open, card, onClose, onSaved, availableLegends }: CardModalProps) {
  const [text, setText] = useState(card?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  // comentários
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  const [selectedLegends, setSelectedLegends] = useState<string[]>(card?.legends ?? []);
  const [updatingLegends, setUpdatingLegends] = useState(false);
  const [legendSelectorOpen, setLegendSelectorOpen] = useState(false);

  const cardId = card ? `${card.stage}:${card.folderHandle.name}` : '';

  const availableLegendNames = new Set(availableLegends.map(l => l.name));
  const unknownLegends = selectedLegends.filter(name => !availableLegendNames.has(name));
  const legendMap = new Map(availableLegends.map(legend => [legend.name, legend] as const));
  const selectedLegendObjects = selectedLegends
    .map(name => legendMap.get(name))
    .filter((legend): legend is Legend => Boolean(legend));

  useEffect(() => {
    if (open) {
      setText(card?.description ?? '');
      setNewComment('');
      setSelectedLegends(card?.legends ?? []);
      setLegendSelectorOpen(false);
      setUpdatingLegends(false);
    }
  }, [cardId, open, card?.description, card?.legends]);

  const doSave = async () => {
    if (!card) return;
    setSaving(true);
    try {
      await saveDescription(card, text ?? '');
      onSaved();
      toast.success('Descrição salva');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar descrição');
    } finally {
      setSaving(false);
    }
  };

  const doAttach = async () => {
    if (!card) return;
    setAdding(true);
    try {
      await addAttachment(card);
      onSaved();
      toast.success('Anexo adicionado');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao adicionar anexo');
    } finally {
      setAdding(false);
    }
  };

  const toggleLegend = async (name: string) => {
    if (!card || updatingLegends) return;

    const previous = selectedLegends;
    const exists = previous.includes(name);
    const order = new Map(availableLegends.map((legend, index) => [legend.name, index] as const));

    let next = exists ? previous.filter(item => item !== name) : [...previous, name];
    next = next.sort((a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER));

    const toPersist = next.filter(item => availableLegendNames.has(item));

    setSelectedLegends(next);
    setUpdatingLegends(true);

    try {
      await saveCardLegends(card, toPersist);
      setSelectedLegends(toPersist);
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar legendas');
      setSelectedLegends(previous);
    } finally {
      setUpdatingLegends(false);
    }
  };

  const doAddComment = async () => {
    if (!card) return;
    const msg = (newComment ?? '').trim();
    if (!msg) return;
    setAddingComment(true);
    try {
      await addComment(card, msg);
      setNewComment('');
      onSaved(); // recarrega e puxa comments.txt atualizado
      toast.success('Comentário adicionado');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao adicionar comentário');
    } finally {
      setAddingComment(false);
    }
  };

  const copyComment = async (comment: string) => {
    if (!navigator?.clipboard?.writeText) {
      toast.error('Área de transferência indisponível');
      return;
    }

    try {
      await navigator.clipboard.writeText(comment);
      toast.success('Comentário copiado');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao copiar comentário');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      {!card ? null : (
        <div style={{ display: 'grid', gap: 16 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{card.title}</div>
              <div style={{ fontSize: 12, opacity: .65 }}>
                {card.updatedAt ? `Atualizado: ${new Date(card.updatedAt).toLocaleString()}` : 'Sem data'}
              </div>
            </div>
            <button onClick={onClose} style={{ padding: '6px 10px' }}>Fechar</button>
          </header>

          {/* Descrição */}
          <section>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Descrição (info.txt)</div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Escreva a descrição aqui…"
              style={{
                width: '100%', height: 200, background: '#0c0c0c',
                border: '1px solid #2a2a2a', color: '#eee', borderRadius: 8, padding: 10
              }}
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button onClick={doSave} disabled={saving} style={{ padding: '6px 12px' }}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                onClick={() => setLegendSelectorOpen(true)}
                disabled={updatingLegends}
                style={{ padding: '6px 12px' }}
              >
                {updatingLegends ? 'Atualizando…' : 'Legendas'}
              </button>
            </div>
            {availableLegends.length === 0 && (
              <div style={{ opacity: .7, fontSize: 14, marginTop: 6 }}>
                Nenhuma legenda cadastrada. Utilize o menu "Gerenciar Legendas" para criar novas.
              </div>
            )}
            {selectedLegendObjects.length > 0 ? (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedLegendObjects.map(legend => (
                  <LegendTag key={legend.name} legend={legend} />
                ))}
              </div>
            ) : (
              <div style={{ opacity: .7, fontSize: 14, marginTop: 10 }}>
                Nenhuma legenda associada a este card.
              </div>
            )}
            {unknownLegends.length > 0 && (
              <div style={{ fontSize: 12, opacity: .7, marginTop: 6 }}>
                Legendas associadas sem cadastro: {unknownLegends.join(', ')} (serão removidas ao salvar).
              </div>
            )}
          </section>

          {/* Anexos */}
          <section>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Anexos</div>
            {card.attachments?.length ? (
              <ul style={{ display: 'grid', gap: 6 }}>
                {card.attachments.map((a, i) => (
                  <li key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 10px'
                  }}>
                    <span title={a.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {a.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: .8 }}>
                      <span style={{ fontSize: 12 }}>{humanSize(a.size)}</span>
                      <button onClick={() => openAttachment(a)} style={{ padding: '4px 8px' }}>Abrir</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ opacity: .7, fontSize: 14 }}>Sem anexos</div>
            )}
            <div style={{ marginTop: 8 }}>
              <button onClick={doAttach} disabled={adding} style={{ padding: '6px 12px' }}>
                {adding ? 'Anexando…' : 'Adicionar anexo'}
              </button>
            </div>
          </section>

          {/* Comentários */}
          <section>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Comentários (comments.txt)</div>

            {card.comments && card.comments.length > 0 ? (
              <ul style={{ display: 'grid', gap: 6 }}>
                {card.comments.map((cmt, i) => (
                  <li
                    key={i}
                    style={{
                      border: '1px solid #2a2a2a',
                      borderRadius: 8,
                      padding: '8px 10px',
                      background: '#0d0d0d'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          flex: 1,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {renderCommentWithLinks(cmt)}
                      </div>
                      <button
                        onClick={() => copyComment(cmt)}
                        title="Copiar comentário"
                        aria-label="Copiar comentário"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 6,
                          borderRadius: 6,
                          border: '1px solid #2a2a2a',
                          background: '#111',
                          color: '#eee',
                          flexShrink: 0
                        }}
                      >
                        <CopyIcon width={16} height={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ opacity: .7, fontSize: 14, marginBottom: 6 }}>Sem comentários</div>
            )}

            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Escreva um comentário e pressione Adicionar"
                style={{
                  flex: 1,
                  background: '#0c0c0c', border: '1px solid #2a2a2a', color: '#eee',
                  borderRadius: 8, padding: '8px 10px'
                }}
              />
              <button onClick={doAddComment} disabled={addingComment || !newComment.trim()} style={{ padding: '6px 12px' }}>
                {addingComment ? 'Adicionando…' : 'Adicionar'}
              </button>
            </div>
          </section>
        </div>
      )}
      <LegendSelectionModal
        open={legendSelectorOpen}
        onClose={() => setLegendSelectorOpen(false)}
        availableLegends={availableLegends}
        selectedLegends={selectedLegends}
        toggleLegend={toggleLegend}
        unknownLegends={unknownLegends}
        updating={updatingLegends}
      />
    </Modal>
  );
}

interface LegendSelectionModalProps {
  open: boolean;
  onClose: () => void;
  availableLegends: Legend[];
  selectedLegends: string[];
  toggleLegend: (name: string) => Promise<void> | void;
  unknownLegends: string[];
  updating: boolean;
}

function LegendSelectionModal({ open, onClose, availableLegends, selectedLegends, toggleLegend, unknownLegends, updating }: LegendSelectionModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Selecionar legendas</h2>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
              Marque as legendas que deseja associar ao card. As alterações são salvas automaticamente.
            </p>
          </div>
          <button onClick={onClose}>Fechar</button>
        </header>

        {availableLegends.length > 0 ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {availableLegends.map(legend => {
              const checked = selectedLegends.includes(legend.name);
              return (
                <label
                  key={legend.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: '1px solid #2a2a2a',
                    borderRadius: 8,
                    padding: '6px 10px',
                    background: checked ? 'rgba(44, 222, 191, 0.08)' : '#0d0d0d',
                    opacity: updating ? 0.6 : 1,
                    pointerEvents: updating ? 'none' : undefined
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLegend(legend.name)}
                    style={{ width: 16, height: 16 }}
                    disabled={updating}
                  />
                  <LegendTag legend={legend} />
                </label>
              );
            })}
          </div>
        ) : (
          <div style={{ opacity: .7, fontSize: 14 }}>
            Nenhuma legenda cadastrada. Utilize o menu "Gerenciar Legendas" para criar novas.
          </div>
        )}

        {unknownLegends.length > 0 && (
          <div style={{ fontSize: 12, opacity: .7 }}>
            Legendas associadas sem cadastro: {unknownLegends.join(', ')} (serão removidas ao salvar).
          </div>
        )}
        {updating && (
          <div style={{ fontSize: 12, opacity: 0.75 }}>Salvando alterações…</div>
        )}
      </div>
    </Modal>
  );
}

function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
