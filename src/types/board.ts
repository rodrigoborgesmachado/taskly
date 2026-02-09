import type { StageKey } from './common';

export interface Attachment {
  name: string;
  size: number;
  handle: FileSystemFileHandle;
  lastModified?: number; // <- novo
}

export interface TaskItem {
  id: string;
  description: string;
  dueAt: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string | null;
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
  tasks?: TaskItem[];
  archived?: boolean;
  archivedAt?: string | null;
  archivedFromListId?: string | null;
  archivedFromListName?: string | null;
}
