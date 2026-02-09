import type { StageInfo, StageKey } from '../types/common';

export const ARCHIVED_STAGE_KEY: StageKey = 'Arquivados';

export function isArchivedStageKey(key: StageKey) {
  return key.toLowerCase() === ARCHIVED_STAGE_KEY.toLowerCase();
}

export function getVisibleStages(stages: StageInfo[]) {
  return stages.filter(stage => !isArchivedStageKey(stage.key));
}

export function getArchivedStage(stages: StageInfo[]) {
  return stages.find(stage => isArchivedStageKey(stage.key)) ?? null;
}
