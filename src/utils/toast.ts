import { useEffect } from 'react';

let container: HTMLDivElement | null = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.display = 'grid';
    container.style.gap = '8px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
}

function show(type: 'success' | 'error', message: string) {
  ensureContainer();
  const div = document.createElement('div');
  div.textContent = message;
  div.style.padding = '8px 12px';
  div.style.borderRadius = '4px';
  div.style.color = '#fff';
  div.style.background = type === 'success' ? '#16a34a' : '#dc2626';
  div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
  container!.appendChild(div);
  setTimeout(() => {
    div.remove();
    if (container && container.childElementCount === 0) {
      container.remove();
      container = null;
    }
  }, 3000);
}

export const toast = {
  success: (msg: string) => show('success', msg),
  error: (msg: string) => show('error', msg),
};

export function Toaster() {
  useEffect(() => { ensureContainer(); }, []);
  return null;
}
