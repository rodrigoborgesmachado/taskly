import type { StageKey } from './common';

export interface Attachment {
  name: string;
  size: number;
  handle: FileSystemFileHandle;
  lastModified?: number; // <- novo
}

export interface TicketCard {
  title: string;
  description: string;
  folderHandle: FileSystemDirectoryHandle;
  stage: StageKey;
  attachments: Attachment[];
  updatedAt?: number;
  comments?: string[];
  legends: string[];
}
