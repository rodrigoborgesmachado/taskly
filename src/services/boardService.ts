import type { BoardSettings, Legend, StageInfo, StageKey } from '../types/common';
import type { TicketCard } from '../types/board';
import { listStages, listStageTicketsByHandle } from './fsWeb';
import { loadLegends } from './legendService';
import { loadBoardSettings } from './boardSettingsService';

export interface DynamicBoardData {
  stages: StageInfo[];
  itemsByStage: Record<StageKey, TicketCard[]>;
  legends: Legend[];
  settings: BoardSettings;
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

  const legends = await loadLegends(root);
  const settings = await loadBoardSettings(root);

  return { stages, itemsByStage, legends, settings };
}
