// src/types/fs-access.d.ts
export {};

// Completa a tipagem do File System Access API usada no Chrome/Edge
declare global {
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    keys(): AsyncIterableIterator<string>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  }
}
