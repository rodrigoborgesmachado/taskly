import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { loadConfig } from '../config/appConfig';
import type { AppConfig } from '../types/common';
import type { DynamicBoardData } from '../services/boardService';
import type { TicketCard } from '../types/board';
import { loadBoardDynamic } from '../services/boardService';
import { canUseFS, createCardInStage, moveCardToStageName, pickRootDir, verifyPermission } from '../services/fsWeb';
import { saveRootHandle, loadRootHandle, clearRootHandle, loadBoardHandles } from '../services/handleStore';
import { Toaster, toast } from '../utils/toast';
import Board from '../components/Board';
import CardModal from '../components/CardModal';
import '../App.css';
import NewCardModal from '../components/NewCardModal';
import NewStageModal from '../components/NewStageModal';
import BoardsModal from '../components/BoardsModal';
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
  const [showBoardsModal, setShowBoardsModal] = useState(false);
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

  const handleDropCard = async (targetStage: string, payload: { stage: string; name: string }) => {
    if (!root || !board) return;
    if (payload.stage === targetStage) return;

    // acha o card no board atual usando stage + nome da pasta
    const sourceList = board.itemsByStage[payload.stage] || [];
    const card = sourceList.find(c => c.folderHandle.name === payload.name);
    if (!card) return;

    try {
      await moveCardToStageName(card, root, targetStage);
      await doLoad(); // recarrega a UI após mover
      toast.success('Card movido com sucesso');
    } catch (e) {
      console.error(e);
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

  return (
    <div style={{ padding: 16 }}>
      <Toaster />
      <h1>Taskly</h1>
      {root && (
        <div style={{ fontSize: 13, opacity: .8, marginBottom: 12, display:'flex', gap:8, alignItems:'center' }}>
          <span>Pasta raiz: <strong>{(root as any).name}</strong></span>
        </div>
      )}

      {err && <div style={{ padding:8, border:'1px solid #a33', marginBottom:12 }}>{err}</div>}

      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <button onClick={chooseRoot}>{root ? 'Trocar' : 'Escolher'} pasta</button>
        <button onClick={() => doLoad()} disabled={!root || loading}>{loading ? 'Lendo…' : 'Recarregar'}</button>
        <button onClick={() => { clearRootHandle(); setRoot(null); setBoard(null); setActiveCard(null); setShowLegendModal(false); }}>
          Esquecer pasta
        </button>
        <button onClick={() => setShowStageModal(true)} disabled={!root}>
          Nova lista
        </button>
        <button onClick={() => setShowLegendModal(true)} disabled={!root}>
          Gerenciar Legendas
        </button>
        <button onClick={() => setShowBoardsModal(true)}>Boards</button>
        <button onClick={() => navigate('/ajuda')}>Ajuda</button>
      </div>

      {!root && <div>Selecione a pasta raiz. Cada subpasta será uma coluna (ordenadas alfabeticamente).</div>}

      {board && <Board data={board} onOpenCard={setActiveCard} onDropCard={handleDropCard} onNewCard={handleNewCard}/>}

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
      <BoardsModal
        open={showBoardsModal}
        boards={savedBoards}
        onClose={() => setShowBoardsModal(false)}
        onSelect={async (h) => {
          const ok = await verifyPermission(h, 'readwrite');
          if (!ok) { setErr('Sem permissão para acessar a pasta.'); return; }
          await saveRootHandle(h).catch(() => {});
          const boards = await loadBoardHandles().catch(() => []);
          setSavedBoards(boards);
          setRoot(h);
          setShowBoardsModal(false);
        }}
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
