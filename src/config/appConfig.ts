import type { AppConfig, StageKey } from '../types/common';

const defaultConfig: AppConfig = {
  mode: 'web',
  defaultRootPath: '',
  stages: { progress: 'progress', waitingpr: 'waitingpr', closed: 'closed' },
  allowCreateMissingStageDirs: true
};

let cached: AppConfig | null = null;

function deepMerge<T>(base: T, extra: Partial<T>): T {
  // merge simples e seguro p/ nosso shape
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const [k, v] of Object.entries(extra ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge((out as any)[k] ?? {}, v as any);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function loadConfig(): Promise<AppConfig> {
  if (cached) return cached;
  try {
    const res = await fetch('/appsettings.json', { cache: 'no-store' });
    const json = (await res.json()) as Partial<AppConfig>;
    cached = deepMerge(defaultConfig, json);
  } catch {
    cached = defaultConfig;
  }
  return cached!;
}

export const StageLabels: Record<StageKey, string> = {
  progress: 'Em Andamento',
  waitingpr: 'Esperando PR',
  closed: 'Finalizados'
};

// Só pra saber se estamos em Electron depois (preload vai expor window.jiraFS)
export function isElectron(): boolean {
  return typeof (window as any).jiraFS !== 'undefined';
}
