export type StageKey = string; 

export interface StageInfo {
  key: StageKey;   
  label: string;   
}

export interface Stages {
  progress: string;
  waitingpr: string;
  closed: string;
}

export interface AppConfig {
  mode: 'web' | 'desktop';
  defaultRootPath: string;
  stages: Stages;
  allowCreateMissingStageDirs: boolean;
}
