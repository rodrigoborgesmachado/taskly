import { useEffect, useState } from 'react';
import { loadConfig } from './config/appConfig';
import type { AppConfig } from './types/common';
import type { DynamicBoardData } from './services/boardService';
import type { TicketCard } from './types/board';
import { loadBoardDynamic } from './services/boardService';
import { canUseFS, createCardInStage, moveCardToStageName, pickRootDir, verifyPermission } from './services/fsWeb';
import { saveRootHandle, loadRootHandle, clearRootHandle } from './services/handleStore';
import {  } from './services/fsWeb';
import Board from './components/Board';
import CardModal from './components/CardModal';
import './App.css';
import NewCardModal from './components/NewCardModal';
import { copyText } from './utils/clipboard';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [root, setRoot] = useState<FileSystemDirectoryHandle | null>(null);
  const [board, setBoard] = useState<DynamicBoardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [activeCard, setActiveCard] = useState<TicketCard | null>(null);
  const [newStage, setNewStage] = useState<string | null>(null); 
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => { loadConfig().then(setConfig); }, []);

  useEffect(() => {
    if (!config) return;
    (async () => {
      setErr("");
      if (canUseFS) {
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
    } catch (e) {
      console.error(e);
      // opcional: toast/alert
    }
  };

  const handleNewCard = (stageKey: string) => {
    setNewStage(stageKey);
    setShowNewModal(true);
  };

  const doCreateCard = async (folderTitle: string, description: string) => {
    if (!root || !newStage) return;
    await createCardInStage(root, newStage, folderTitle, description, true);
    await doLoad();
  };    

  return (
    <div style={{ padding: 16 }}>
      <h1>Jira Folder Board</h1>
      {root && (
        <div style={{ fontSize: 13, opacity: .8, marginBottom: 12, display:'flex', gap:8, alignItems:'center' }}>
          <span>Pasta raiz: <strong>{(root as any).name}</strong></span>
          <button onClick={() => copyText((root as any).name)}>Copiar</button>
          <button onClick={async () => {
            try {
              const ok = await verifyPermission(root, 'read');
              if (ok) alert('Diretório já está aberto/permitido: ' + (root as any).name);
            } catch (e) {
              console.error(e);
            }
          }}>Abrir</button>
        </div>
      )}

      {err && <div style={{ padding:8, border:'1px solid #a33', marginBottom:12 }}>{err}</div>}

      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <button onClick={chooseRoot}>{root ? 'Trocar raiz' : 'Escolher raiz'}</button>
        <button onClick={() => doLoad()} disabled={!root || loading}>{loading ? 'Lendo…' : 'Recarregar'}</button>
        <button onClick={() => { clearRootHandle(); setRoot(null); setBoard(null); setActiveCard(null); }}>
          Esquecer raiz
        </button>
      </div>

      {!root && <div>Selecione a pasta raiz. Cada subpasta será uma coluna (ordenadas alfabeticamente).</div>}

      {board && <Board data={board} onOpenCard={setActiveCard} onDropCard={handleDropCard} onNewCard={handleNewCard}/>}

      <CardModal
        open={!!activeCard}
        card={activeCard}
        onClose={() => setActiveCard(null)}
        onSaved={() => doLoad()}
      />

      <NewCardModal
        open={showNewModal}
        stageName={newStage}
        onClose={() => setShowNewModal(false)}
        onCreate={doCreateCard}
      />  
    </div>
  );
}

export default App;
