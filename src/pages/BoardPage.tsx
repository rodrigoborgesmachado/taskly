import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { loadConfig } from '../config/appConfig';
import type { AppConfig } from '../types/common';
import type { DynamicBoardData } from '../services/boardService';
import type { TicketCard } from '../types/board';
import { loadBoardDynamic } from '../services/boardService';
import { canUseFS, createCardInStage, moveCardToStageName, pickRootDir, saveCardLegends, verifyPermission } from '../services/fsWeb';
import { saveRootHandle, loadRootHandle, clearRootHandle, loadBoardHandles, removeBoardHandle } from '../services/handleStore';
import { Toaster, toast } from '../utils/toast';
import Board from '../components/Board';
import CardModal from '../components/CardModal';
import '../App.css';
import NewCardModal from '../components/NewCardModal';
import NewStageModal from '../components/NewStageModal';
import LegendModal from '../components/LegendModal';

function BoardPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [root, setRoot] = useState<FileSystemDirectoryHandle | null>(null);
  const [board, setBoard] = useState<DynamicBoardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [activeCard, setActiveCard] = useState<TicketCard | null>(null);
  const [newStage, setNewStage] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [savedBoards, setSavedBoards] = useState<FileSystemDirectoryHandle[]>([]);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadConfig().then(setConfig); }, []);

  useEffect(() => {
    if (!config) return;
    (async () => {
      setErr("");
      if (canUseFS) {
        const boards = await loadBoardHandles().catch(() => []);
        setSavedBoards(boards);
        const saved = await loadRootHandle().catch(() => null);
        if (saved) {
          const ok = await verifyPermission(saved, 'readwrite');
          if (ok) { setRoot(saved); return; }
          await clearRootHandle().catch(() => {});
        }
      }
    })();
  }, [config]);

  async function doLoad() {
    if (!root) return;
    setLoading(true);
    try {
      const b = await loadBoardDynamic(root);
      setBoard(b);
      if (activeCard) {
        const flat = Object.entries(b.itemsByStage)
          .flatMap(([stage, arr]) => arr.map(c => ({ stage, name: c.folderHandle.name, c })));
        const refreshed = flat.find(x => activeCard &&
          x.stage === activeCard.stage &&
          x.name === activeCard.folderHandle.name
        );
        if (refreshed) setActiveCard(refreshed.c);
        else setActiveCard(null);
      }
    } catch (e:any) {
      setErr(e?.message ?? 'Falha ao ler pastas');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { doLoad(); /* eslint-disable-next-line */ }, [root]);

  async function chooseRoot() {
    const h = await pickRootDir();
    if (!h) return;
    const ok = await verifyPermission(h, 'readwrite');
    if (!ok) { setErr('Sem permissão para acessar a pasta.'); return; }
    await saveRootHandle(h).catch(() => {});
    const boards = await loadBoardHandles().catch(() => []);
    setSavedBoards(boards);
    setRoot(h);
  }

  async function selectBoard(h: FileSystemDirectoryHandle) {
    const ok = await verifyPermission(h, 'readwrite');
    if (!ok) { setErr('Sem permissão para acessar a pasta.'); return; }
    await saveRootHandle(h).catch(() => {});
    const boards = await loadBoardHandles().catch(() => []);
    setSavedBoards(boards);
    setRoot(h);
  }

  const handleDropCard = async (targetStage: string, payload: { stage: string; name: string }) => {
    if (!root || !board) return;
    if (payload.stage === targetStage) return;

    // acha o card no board atual usando stage + nome da pasta
    const sourceList = board.itemsByStage[payload.stage] || [];
    const card = sourceList.find(c => c.folderHandle.name === payload.name);
    if (!card) return;

    try {
      setLoading(true);
      await moveCardToStageName(card, root, targetStage);
      await doLoad();
      toast.success('Card movido com sucesso');
    } catch (e) {
      console.error(e);
      setLoading(false);
      toast.error('Erro ao mover o card');
    }
  };

  const handleNewCard = (stageKey: string) => {
    setNewStage(stageKey);
    setShowNewModal(true);
  };

  const doCreateCard = async (folderTitle: string, description: string) => {
    if (!root || !newStage) return;
    try {
      await createCardInStage(root, newStage, folderTitle, description, true);
      await doLoad();
      toast.success('Card criado com sucesso');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar o card');
      throw e;
    }
  };

  const doCreateStage = async (stageName: string) => {
    if (!root) return;
    const ok = await verifyPermission(root, 'readwrite');
    if (!ok) { setErr('Sem permissão para criar pasta.'); return; }
    try {
      await root.getDirectoryHandle(stageName, { create: true });
      await doLoad();
      toast.success('Lista criada com sucesso');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar a lista');
    }
  };

  const handleUpdateCardLegends = async (card: TicketCard, legendNames: string[]) => {
    if (!board) return;

    const availableLegendNames = new Set(board.legends.map(l => l.name));
    const order = new Map(board.legends.map((legend, index) => [legend.name, index] as const));

    const sanitized = legendNames
      .filter(name => availableLegendNames.has(name))
      .sort((a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER));

    const currentLegends = (card.legends ?? [])
      .filter(name => availableLegendNames.has(name))
      .sort((a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER));

    if (sanitized.length === currentLegends.length && sanitized.every((name, index) => currentLegends[index] === name)) {
      return;
    }

    try {
      await saveCardLegends(card, sanitized);

      setBoard(prev => {
        if (!prev) return prev;
        const stageItems = prev.itemsByStage[card.stage] || [];
        const index = stageItems.findIndex(item => item.folderHandle.name === card.folderHandle.name);
        if (index === -1) return prev;

        const updatedStageItems = [...stageItems];
        updatedStageItems[index] = { ...stageItems[index], legends: sanitized };

        return {
          ...prev,
          itemsByStage: {
            ...prev.itemsByStage,
            [card.stage]: updatedStageItems,
          },
        };
      });

      setActiveCard(prev => {
        if (!prev) return prev;
        if (prev.stage === card.stage && prev.folderHandle.name === card.folderHandle.name) {
          return { ...prev, legends: sanitized };
        }
        return prev;
      });

      toast.success('Legendas atualizadas');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar legendas');
      throw error;
    }
  };

  return (
    <div className="board-page">
      {loading && (
        <div className="board-loading" role="status" aria-live="polite">
          <div className="board-loading__spinner" aria-hidden="true" />
          <span>Carregando...</span>
        </div>
      )}
      <Toaster />
      {root && (
        <div className="board-page__root-info">
          <span>Pasta raiz: <strong>{(root as any).name}</strong></span>
        </div>
      )}
      {err && <div className="board-page__error">{err}</div>}

      <div className="board-frame">
        <div className="board-tabs" role="tablist" aria-label="Boards">
          {!root && (
            <button
              type="button"
              className="board-tab board-tab--placeholder is-active"
              role="tab"
              aria-selected="true"
              disabled
            >
              Selecione uma pasta
            </button>
          )}
          {savedBoards.map((h, idx) => {
            const isActive = root && (h as any).name === (root as any).name;
            return (
              <button
                type="button"
                key={`${(h as any).name}-${idx}`}
                className={`board-tab${isActive ? ' is-active' : ''}`}
                onClick={() => selectBoard(h)}
                role="tab"
                aria-selected={!!isActive}
              >
                {(h as any).name}
              </button>
            );
          })}
          <button
            type="button"
            className="board-tab board-tab--add"
            onClick={chooseRoot}
            aria-label="Adicionar board"
            title="Adicionar board"
          >
            +
          </button>
        </div>

        <div className="board-window__actions">
          <button onClick={() => doLoad()} disabled={!root || loading}>{loading ? 'Lendo...' : 'Recarregar'}</button>
          <button
            onClick={async () => {
              if (!root) return;
              await clearRootHandle().catch(() => {});
              await removeBoardHandle((root as any).name).catch(() => {});
              const boards = await loadBoardHandles().catch(() => []);
              setSavedBoards(boards);
              setRoot(null);
              setBoard(null);
              setActiveCard(null);
              setShowLegendModal(false);
            }}
            disabled={!root}
          >
            Esquecer pasta
          </button>
          <button onClick={() => setShowStageModal(true)} disabled={!root}>
            Nova lista
          </button>
          <button onClick={() => setShowLegendModal(true)} disabled={!root}>
            Gerenciar Legendas
          </button>
          <button onClick={() => navigate('/ajuda')}>Ajuda</button>
        </div>

        {board && (
          <Board
            data={board}
            onOpenCard={setActiveCard}
            onDropCard={handleDropCard}
            onNewCard={handleNewCard}
            onUpdateCardLegends={handleUpdateCardLegends}
          />
        )}
      </div>

      {!root && <div>Selecione a pasta raiz. Cada subpasta ser­ uma coluna (ordenadas alfabeticamente).</div>}

      <CardModal
        open={!!activeCard}
        card={activeCard}
        onClose={() => setActiveCard(null)}
        onSaved={() => doLoad()}
        availableLegends={board?.legends ?? []}
      />

      <NewCardModal
        open={showNewModal}
        stageName={newStage}
        onClose={() => setShowNewModal(false)}
        onCreate={doCreateCard}
      />
      <NewStageModal
        open={showStageModal}
        onClose={() => setShowStageModal(false)}
        onCreate={doCreateStage}
      />
      <LegendModal
        open={showLegendModal}
        root={root}
        onClose={() => setShowLegendModal(false)}
        onSaved={(legends) => {
          setBoard(prev => prev ? { ...prev, legends } : prev);
          doLoad();
        }}
      />
    </div>
  );
}

export default BoardPage;
