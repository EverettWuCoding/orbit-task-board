import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { COLUMNS, PRIORITIES, STATUSES } from './types';
import type { Filters, Task, TaskDraft, TaskMove, Status } from './types';

// Preserve a custom hue while ensuring readable text on pale surfaces and
// white initials on avatars. Invalid values never become CSS declarations.
export function readableColor(color: string): string {
  if (!/^#[\da-f]{6}$/i.test(color)) return '#655080';
  const rgb = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
  const luminance = (values: number[]) => values.map((value) => {
    const channel = value / 255;
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  }).reduce((total, channel, index) => total + channel * [.2126, .7152, .0722][index]!, 0);
  while (1.05 / (luminance(rgb) + .05) < 5.2) {
    for (let index = 0; index < rgb.length; index++) rgb[index] = Math.floor(rgb[index]! * .92);
  }
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0] ?? '').join('').toUpperCase();
}

export function statusTitle(status: Status): string {
  return COLUMNS.find((column) => column.id === status)!.title;
}

export function dueInfo(task: Pick<Task, 'due_date' | 'status'>, now = new Date()) {
  if (!task.due_date) return null;
  const date = parseISO(task.due_date);
  if (!isValid(date)) return null;
  const days = differenceInCalendarDays(date, now);
  const urgency = task.status === 'done' ? 'complete' : days < 0 ? 'overdue' : days <= 2 ? 'soon' : 'normal';
  const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days === -1 ? 'Yesterday' : format(date, 'MMM d');
  return { days, urgency, label, full: format(date, 'MMMM d, yyyy') };
}

export function filterTasks(tasks: Task[], filters: Filters, now = new Date()): Task[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return tasks.filter((task) => {
    const due = dueInfo(task, now);
    return (!search || task.title.toLocaleLowerCase().includes(search))
      && (filters.priority === 'all' || task.priority === filters.priority)
      && (filters.assignee === 'all' || (filters.assignee === 'unassigned' ? !task.assignee_id : task.assignee_id === filters.assignee))
      && (filters.label === 'all' || task.labelIds.includes(filters.label))
      && (filters.due === 'all' || (filters.due === 'overdue' ? due?.urgency === 'overdue' : due?.urgency === 'soon'));
  }).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}

export function boardStats(tasks: Task[], now = new Date()) {
  const completed = tasks.filter((task) => task.status === 'done').length;
  return {
    total: tasks.length, completed,
    overdue: tasks.filter((task) => dueInfo(task, now)?.urgency === 'overdue').length,
    percentage: tasks.length ? Math.round(completed / tasks.length * 100) : 0,
  };
}

// Reindex the entire destination column, including hidden/filtered tasks, so
// positions stay deterministic across refreshes and filtered board moves.
export function planMove(tasks: Task[], taskId: string, target: Status, overTaskId?: string): TaskMove[] {
  const task = tasks.find((item) => item.id === taskId);
  if (!task || overTaskId === taskId) return [];
  const destination = tasks.filter((item) => item.status === target && item.id !== taskId)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const overIndex = overTaskId ? destination.findIndex((item) => item.id === overTaskId) : -1;
  let index = overIndex < 0 ? destination.length : overIndex;
  if (task.status === target && overIndex >= 0) {
    const original = tasks.filter((item) => item.status === target).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    const from = original.findIndex((item) => item.id === taskId);
    const to = original.findIndex((item) => item.id === overTaskId);
    if (from < to) index += 1;
  }
  destination.splice(index, 0, task);
  return destination.map((item, position) => ({ id: item.id, status: target, position }))
    .filter((move) => tasks.find((item) => item.id === move.id)!.position !== move.position || task.id === move.id && task.status !== target);
}

export function validateDraft(draft: TaskDraft): string | null {
  if (!draft.title.trim()) return 'Give your task a title.';
  if (draft.title.trim().length > 200) return 'Keep the title under 201 characters.';
  if (draft.description.length > 5000) return 'Keep the description under 5,001 characters.';
  if (!STATUSES.includes(draft.status) || !PRIORITIES.includes(draft.priority)) return 'Choose a valid status and priority.';
  if (draft.due_date && (!/^\d{4}-\d{2}-\d{2}$/.test(draft.due_date) || !isValid(parseISO(draft.due_date)))) return 'Choose a valid due date.';
  return null;
}

export function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : 'An unexpected error occurred.';
  if (/anonymous.*(disabled|not allowed)|anonymous_provider_disabled/i.test(message)) return 'Guest sign-in is disabled. Enable anonymous sign-ins in Supabase → Authentication → Sign In / Providers.';
  if (/Failed to fetch|NetworkError|network request|Load failed/i.test(message)) return 'Could not connect. Check your internet connection and Supabase project, then try again.';
  if (/relation .* does not exist|schema cache|Could not find the (table|function)/i.test(message)) return 'The database is not ready. Run the supplied SQL migration in your Supabase SQL Editor, then retry.';
  if (/JWT expired|invalid JWT|session.*missing/i.test(message)) return 'Your guest session could not be refreshed. Reload to reconnect. Do not clear browser storage unless you intend to start a new guest workspace.';
  return message;
}