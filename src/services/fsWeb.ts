import type { TicketCard } from '../types/board';
import type { AppConfig, StageInfo, StageKey } from '../types/common';

export const canUseFS = typeof window !== 'undefined' && !!(window as any).showDirectoryPicker;

export async function pickRootDir(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const h = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    return h as FileSystemDirectoryHandle;
  } catch {
    return null;
  }
}

export async function ensureSubdir(parent: FileSystemDirectoryHandle, name: string) {
  try {
    return await parent.getDirectoryHandle(name, { create: false });
  } catch {
    return await parent.getDirectoryHandle(name, { create: true });
  }
}

async function readText(fileHandle: FileSystemFileHandle) {
  const file = await fileHandle.getFile();
  return await file.text();
}

export async function readTicketFromFolder(
  stageKey: string,
  folderHandle: FileSystemDirectoryHandle
) {
  let description = '';
  const attachments: TicketCard['attachments'] = [];
  let updatedAt = 0;
  let comments: string[] = []; // <- novo

  // info.txt
  try {
    const info = await folderHandle.getFileHandle('info.txt').catch(() => null);
    if (info) {
      const f = await info.getFile();
      description = await f.text();
      updatedAt = Math.max(updatedAt, f.lastModified);
    }
  } catch (e) {
    console.warn('Erro lendo info.txt em', (folderHandle as any).name, e);
  }

  // comments.txt (cada linha = um comentário)
  try {
    const ch = await folderHandle.getFileHandle('comments.txt').catch(() => null);
    if (ch) {
      const f = await ch.getFile();
      const raw = await f.text();
      // quebra por linhas; remove vazias finais
      comments = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
      updatedAt = Math.max(updatedAt, f.lastModified);
    }
  } catch (e) {
    console.warn('Erro lendo comments.txt em', (folderHandle as any).name, e);
  }

  // anexos
  try {
    for await (const [name, h] of (folderHandle as any).entries()) {
      if (name === 'info.txt' || name === 'comments.txt') continue;
      if (h.kind === 'file') {
        try {
          const f = await (h as FileSystemFileHandle).getFile();
          attachments.push({ name, size: f.size, handle: h as FileSystemFileHandle, lastModified: f.lastModified });
          updatedAt = Math.max(updatedAt, f.lastModified);
        } catch (e) {
          console.warn('Ignorando anexo inacessível', name, e);
        }
      }
    }
  } catch (e) {
    console.warn('Erro listando anexos em', (folderHandle as any).name, e);
  }

  attachments.sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0));

  return {
    title: (folderHandle as any).name as string,
    description,
    folderHandle,
    stage: stageKey,
    attachments,
    updatedAt,
    comments, // <- novo
  } as TicketCard;
}

export async function saveDescription(card: TicketCard, text: string) {
  const info = await card.folderHandle.getFileHandle('info.txt', { create: true });
  const writable = await info.createWritable();
  await writable.write(text ?? '');
  await writable.close();
}

export async function addAttachment(card: TicketCard): Promise<void> {
  const [fileHandle] = await (window as any).showOpenFilePicker({ multiple: false });
  const srcFile = await fileHandle.getFile();
  const dest = await card.folderHandle.getFileHandle(srcFile.name, { create: true });
  const w = await dest.createWritable();
  await w.write(await srcFile.arrayBuffer());
  await w.close();
}

export async function openAttachment(att: { handle: FileSystemFileHandle }) {
  const file = await att.handle.getFile();
  const url = URL.createObjectURL(file);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function verifyPermission(handle: FileSystemDirectoryHandle, mode: 'read'|'readwrite'='readwrite') {
  // @ts-ignore
  const q = await handle.queryPermission?.({ mode });
  if (q === 'granted') return true;
  // @ts-ignore
  const r = await handle.requestPermission?.({ mode });
  return r === 'granted';
}

// 2) Tenta pegar a subpasta; cria se permitido em config; senão retorna null
export async function ensureStageDir(
  root: FileSystemDirectoryHandle,
  stageFolderName: string,
  allowCreate: boolean
): Promise<FileSystemDirectoryHandle | null> {
  try {
    // tenta abrir sem criar
    return await root.getDirectoryHandle(stageFolderName, { create: false });
  } catch (e) {
    if (!allowCreate) return null;
    try {
      return await root.getDirectoryHandle(stageFolderName, { create: true });
    } catch {
      return null;
    }
  }
}

export async function listStages(root: FileSystemDirectoryHandle) {
  const ok = await verifyPermission(root, 'readwrite');
  if (!ok) throw new Error('Sem permissão para ler a raiz');
  const stages: { key: string; label: string }[] = [];
  try {
    for await (const [name, handle] of (root as any).entries()) {
      try {
        if (handle.kind === 'directory') stages.push({ key: name, label: name });
      } catch (e) {
        console.warn('Ignorando estágio que sumiu:', name, e);
      }
    }
  } catch (e) {
    console.error('Falha ao enumerar estágios na raiz:', e);
  }
  stages.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  return stages;
}

export async function listStageTicketsByHandle(
  stageHandle: FileSystemDirectoryHandle,
  stageKey: string
) {
  const out: TicketCard[] = [];
  try {
    for await (const [name, handle] of (stageHandle as any).entries()) {
      try {
        if (handle.kind !== 'directory') continue;
        const card = await readTicketFromFolder(stageKey, handle as FileSystemDirectoryHandle);
        out.push(card);
      } catch (e) {
        console.warn('Ignorando ticket que sumiu durante a leitura:', name, e);
      }
    }
  } catch (e) {
    console.error('Falha ao listar itens do estágio', stageKey, e);
  }
  out.sort(
    (a, b) =>
      (b.updatedAt ?? 0) - (a.updatedAt ?? 0) ||
      a.title.localeCompare(b.title, undefined, { numeric: true })
  );
  return out;
}

async function copyDir(src: FileSystemDirectoryHandle, dst: FileSystemDirectoryHandle) {
  for await (const [name, h] of (src as any).entries()) {
    if (h.kind === 'file') {
      const f = await (h as FileSystemFileHandle).getFile();
      const dfh = await dst.getFileHandle(name, { create: true });
      const w = await dfh.createWritable();
      await w.write(await f.arrayBuffer());
      await w.close();
    } else {
      const childDst = await dst.getDirectoryHandle(name, { create: true });
      await copyDir(await src.getDirectoryHandle(name), childDst);
    }
  }
}

async function deleteDirRecursive(dir: FileSystemDirectoryHandle) {
  // remove entradas primeiro
  for await (const [name, h] of (dir as any).entries()) {
    if (h.kind === 'file') {
      await dir.removeEntry(name).catch(() => {});
    } else {
      const child = await dir.getDirectoryHandle(name);
      await deleteDirRecursive(child).catch(() => {});
      await dir.removeEntry(name, { recursive: true }).catch(() => {});
    }
  }
}

export async function moveCardToStageName(
  card: TicketCard,
  root: FileSystemDirectoryHandle,
  targetStageName: string
) {
  if (targetStageName === card.stage) return;

  const ok = await verifyPermission(root, 'readwrite');
  if (!ok) throw new Error('Sem permissão para mover');

  const srcParent = await root.getDirectoryHandle(card.stage).catch(() => null);
  if (!srcParent) throw new Error('Pasta de origem não existe mais');

  const dstParent = await root.getDirectoryHandle(targetStageName, { create: true });

  const destExists = await dstParent.getDirectoryHandle(card.folderHandle.name, { create: false }).catch(() => null);
  if (destExists) {
    await deleteDirRecursive(destExists).catch(() => {});
    await dstParent.removeEntry(card.folderHandle.name, { recursive: true }).catch(() => {});
  }

  const newFolder = await dstParent.getDirectoryHandle(card.folderHandle.name, { create: true });
  await copyDir(card.folderHandle, newFolder);

  await deleteDirRecursive(card.folderHandle).catch(() => {});
  await srcParent.removeEntry(card.folderHandle.name, { recursive: true }).catch(() => {});
}

export async function addComment(card: TicketCard, text: string): Promise<void> {
  const fname = 'comments.txt';
  const fh = await card.folderHandle.getFileHandle(fname, { create: true });
  let existing = '';
  try {
    const f = await fh.getFile();
    existing = await f.text();
  } catch {  }

  const base = existing && !existing.endsWith('\n') ? existing + '\n' : existing;
  const content = base + (text ?? '').trim() + '\n';

  const w = await fh.createWritable();
  await w.write(content);
  await w.close();
}

async function uniqueFolderName(stageHandle: FileSystemDirectoryHandle, base: string) {
  let name = base.trim();
  let i = 2;
  while (true) {
    const exists = await stageHandle.getDirectoryHandle(name, { create: false }).catch(() => null);
    if (!exists) return name;
    name = `${base} (${i++})`;
  }
}

export async function createCardInStage(
  root: FileSystemDirectoryHandle,
  stageName: string,
  folderTitle: string,
  initialDescription: string = '',
  createEmptyComments = true
): Promise<void> {
  const ok = await verifyPermission(root, 'readwrite');
  if (!ok) throw new Error('Sem permissão para criar card');

  const stageHandle = await root.getDirectoryHandle(stageName, { create: true });
  const safeName = await uniqueFolderName(stageHandle, folderTitle);

  // cria pasta do card
  const cardDir = await stageHandle.getDirectoryHandle(safeName, { create: true });

  // info.txt
  const info = await cardDir.getFileHandle('info.txt', { create: true });
  const w = await info.createWritable();
  await w.write(initialDescription ?? '');
  await w.close();

  if (createEmptyComments) {
    const ch = await cardDir.getFileHandle('comments.txt', { create: true });
    const w2 = await ch.createWritable();
    await w2.write(''); // vazio
    await w2.close();
  }
}