import { useState, useEffect, type ReactNode } from 'react';
import Modal from './Modal';
import type { TicketCard } from '../types/board';
import { addAttachment, openAttachment, saveDescription, addComment } from '../services/fsWeb'; // <- add addComment
import { toast } from '../utils/toast';
import type { StageKey } from '../types/common';

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
}

function humanSize(n?: number) {
  if (!n) return '';
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0; let x = n;
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; }
  return `${x.toFixed(x < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

export default function CardModal({ open, card, onClose, onSaved }: CardModalProps) {
  const [text, setText] = useState(card?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  // comentários
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  const cardId = card ? `${card.stage}:${card.folderHandle.name}` : '';

  useEffect(() => {
    if (open) {
      setText(card?.description ?? '');
      setNewComment('');
    }
  }, [cardId, open, card?.description]);

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
            </div>
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
                      background: '#0d0d0d',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {renderCommentWithLinks(cmt)}
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
    </Modal>
  );
}
