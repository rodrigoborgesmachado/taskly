import type { TaskItem } from '../types/board';

export type TaskStatus = 'completed' | 'overdue' | 'veryNear' | 'near' | 'ok';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function getTaskStatus(task: TaskItem, now: Date = new Date()): TaskStatus {
  if (task.isCompleted) return 'completed';
  const due = new Date(task.dueAt).getTime();
  if (Number.isNaN(due)) return 'ok';
  const diff = due - now.getTime();
  if (diff < 0) return 'overdue';
  if (diff <= 2 * HOUR_MS) return 'veryNear';
  if (diff <= DAY_MS) return 'near';
  return 'ok';
}

export function getNextDueTask(tasks: TaskItem[], now: Date = new Date()): TaskItem | null {
  const pending = tasks
    .filter(task => !task.isCompleted)
    .filter(task => !Number.isNaN(new Date(task.dueAt).getTime()))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  return pending.length ? pending[0] : null;
}

export function getTaskSummary(tasks: TaskItem[], now: Date = new Date()) {
  const totalCount = tasks.length;
  const completedCount = tasks.filter(task => task.isCompleted).length;
  const nextDueTask = getNextDueTask(tasks, now);

  const pendingStatuses = tasks
    .filter(task => !task.isCompleted)
    .map(task => getTaskStatus(task, now));

  let worstStatus: TaskStatus = 'ok';
  if (pendingStatuses.includes('overdue')) worstStatus = 'overdue';
  else if (pendingStatuses.includes('veryNear')) worstStatus = 'veryNear';
  else if (pendingStatuses.includes('near')) worstStatus = 'near';

  return {
    completedCount,
    totalCount,
    nextDueAt: nextDueTask?.dueAt ?? null,
    nextDueTask,
    worstStatus,
  };
}

export function formatDueDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export function formatDueRelative(value: string, now: Date = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return 'atrasada';

  if (diff <= 2 * HOUR_MS) {
    const minutes = Math.max(1, Math.round(diff / 60000));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  }

  if (diff <= DAY_MS) {
    const hours = Math.round(diff / HOUR_MS);
    return `${hours}h`;
  }

  const day = date.toDateString();
  const today = now.toDateString();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString();

  if (day === today) return 'hoje';
  if (day === tomorrow) return 'amanha';
  return date.toLocaleDateString();
}

export function getTaskStatusLabel(task: TaskItem, now: Date = new Date()) {
  const status = getTaskStatus(task, now);
  if (status === 'completed') return 'Concluida';
  if (status === 'overdue') return 'Atrasada';
  const due = new Date(task.dueAt);
  if (!Number.isNaN(due.getTime())) {
    const isToday = due.toDateString() === now.toDateString();
    if (isToday) return 'Vence hoje';
  }
  if (status === 'veryNear') return 'Muito proxima';
  if (status === 'near') return 'Proxima';
  return 'Em dia';
}

export function createTaskId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
