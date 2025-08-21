import type { StageInfo, StageKey } from '../types/common';
import type { TicketCard } from '../types/board';
import { listStages, listStageTicketsByHandle } from './fsWeb';

export interface DynamicBoardData {
  stages: StageInfo[];
  itemsByStage: Record<StageKey, TicketCard[]>;
}

export async function loadBoardDynamic(
  root: FileSystemDirectoryHandle
): Promise<DynamicBoardData> {
  const stages = await listStages(root);

  const itemsByStage: Record<StageKey, TicketCard[]> = {};
  // para cada estágio, abrimos o handle de novo a partir do root
  for (const s of stages) {
    const handle = await root.getDirectoryHandle(s.key, { create: false }).catch(() => null);
    if (!handle) {
      itemsByStage[s.key] = [];
      continue;
    }
    itemsByStage[s.key] = await listStageTicketsByHandle(handle, s.key);
  }

  return { stages, itemsByStage };
}
