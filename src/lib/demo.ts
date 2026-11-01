import { addDays, format } from 'date-fns';
import { COLORS } from './types';
import type { Snapshot, Task, TaskDraft, BoardRepository, TaskMove } from './types';
import { statusTitle, validateDraft } from './domain';

export const DEMO_STORAGE_KEY = 'orbit.demo.v1';
interface DemoData extends Snapshot { userId: string; version: 1 }
const now = () => new Date().toISOString();

export function createDemoData(): DemoData {
  const userId = crypto.randomUUID();
  const created_at = now();
  const members = ['Alex Morgan', 'Jamie Chen', 'Sam Rivera', 'Jordan Lee'].map((name, index) => ({
    id: crypto.randomUUID(), name, color: COLORS[index]!, user_id: userId, created_at,
  }));
  const labels = ['Design', 'Engineering', 'Product', 'Research'].map((name, index) => ({
    id: crypto.randomUUID(), name, color: COLORS[index]!, user_id: userId, created_at,
  }));
  const items: [string, Task['status'], Task['priority'], number | null, number, number, string][] = [
    ['Explore a fresh visual direction', 'todo', 'high', 2, 0, 0, 'Collect references, explore a warmer palette, and sketch a few directions for our next release.'],
    ['Map the first-time experience', 'todo', 'normal', 5, 1, 3, 'A great first impression starts with a clear path. Map the journey from landing to the first small win.'],
    ['Write a little welcome magic', 'todo', 'low', null, 3, 2, 'Make our empty states useful, friendly, and a little more human.'],
    ['Build the component library', 'in_progress', 'high', -1, 1, 1, 'Create our foundations: buttons, inputs, cards, and the spacing that brings everything together.'],
    ['Bring the dashboard to life', 'in_progress', 'normal', 0, 0, 0, 'Connect the new layout and make the important details feel effortless to find.'],
    ['Review the onboarding flow', 'in_review', 'normal', 1, 2, 2, 'Take a fresh look at the happy path, keyboard navigation, and the moments where someone might get stuck.'],
    ['Define our product principles', 'done', 'normal', -3, 3, 2, 'Clarity over clutter. Momentum over busywork. A little delight in the details.'],
    ['Talk to our first five users', 'done', 'low', -2, 2, 3, 'Listen closely, capture the patterns, and share what we learned with the team.'],
  ];
  const tasks: Task[] = items.map(([title, status, priority, due, member, label, description], position) => ({
    id: crypto.randomUUID(), title, description, status, priority,
    due_date: due === null ? null : format(addDays(new Date(), due), 'yyyy-MM-dd'),
    assignee_id: members[member]!.id, labelIds: [labels[label]!.id], position,
    user_id: userId, created_at, updated_at: created_at,
  }));
  const comments = [{ id: crypto.randomUUID(), task_id: tasks[3]!.id, user_id: userId, body: 'The foundations are looking good! Let’s double-check the focus states before review.', created_at }];
  const activity = tasks.map((task) => ({ id: crypto.randomUUID(), task_id: task.id, user_id: userId, summary: 'Created this task', created_at }));
  return { version: 1, userId, tasks, members, labels, comments, activity };
}

export class DemoRepository implements BoardRepository {
  readonly mode = 'demo' as const;
  constructor(private storage?: Storage) {}

  private getStorage(): Storage {
    try { return this.storage ?? localStorage; }
    catch { throw new Error('Browser storage is unavailable. Enable local storage to use the demo, or connect Supabase.'); }
  }

  private read(): DemoData {
    let raw: string | null;
    try { raw = this.getStorage().getItem(DEMO_STORAGE_KEY); }
    catch { throw new Error('Browser storage is unavailable. Enable local storage to use the demo, or connect Supabase.'); }
    if (raw) {
      try {
        const data = JSON.parse(raw) as DemoData;
        if (data.version !== 1 || !data.userId || !['tasks', 'members', 'labels', 'comments', 'activity'].every((key) => Array.isArray(data[key as keyof Snapshot]))) throw new Error();
        return data;
      } catch { throw new Error('Local demo data is unreadable. Use the demo reset button to start fresh.'); }
    }
    const data = createDemoData();
    this.write(data);
    return data;
  }

  private write(data: DemoData) {
    try { this.getStorage().setItem(DEMO_STORAGE_KEY, JSON.stringify(data)); }
    catch { throw new Error('Browser storage is unavailable or full. Enable local storage to use the demo, or connect Supabase.'); }
  }
  private log(data: DemoData, taskId: string, summary: string) {
    data.activity.push({ id: crypto.randomUUID(), task_id: taskId, user_id: data.userId, summary, created_at: now() });
  }
  async initialize() { return this.read().userId; }
  async load(): Promise<Snapshot> { return this.read(); }

  async saveTask(draft: TaskDraft, existing?: Task) {
    const validation = validateDraft(draft);
    if (validation) throw new Error(validation);
    const data = this.read();
    if (draft.assignee_id && !data.members.some((member) => member.id === draft.assignee_id)) throw new Error('Choose a team member in this workspace.');
    if (!draft.labelIds.every((id) => data.labels.some((label) => label.id === id))) throw new Error('Choose labels in this workspace.');
    const old = existing ? data.tasks.find((task) => task.id === existing.id) : undefined;
    if (existing && !old) throw new Error('This task no longer exists.');
    const position = old?.status === draft.status ? old.position : Math.max(-1, ...data.tasks.filter((task) => task.status === draft.status).map((task) => task.position)) + 1;
    const task: Task = { ...draft, title: draft.title.trim(), labelIds: [...new Set(draft.labelIds)], id: old?.id ?? crypto.randomUUID(),
      user_id: data.userId, created_at: old?.created_at ?? now(), updated_at: now(), position };
    if (old) {
      data.tasks = data.tasks.map((item) => item.id === old.id ? task : item);
      if (old.title !== task.title) this.log(data, task.id, 'Changed the title');
      if (old.description !== task.description) this.log(data, task.id, 'Updated the description');
      if (old.status !== task.status) this.log(data, task.id, `Moved from ${statusTitle(old.status)} → ${statusTitle(task.status)}`);
      if (old.priority !== task.priority) this.log(data, task.id, `Set priority to ${task.priority}`);
      if (old.due_date !== task.due_date) this.log(data, task.id, task.due_date ? `Set due date to ${task.due_date}` : 'Removed the due date');
      if (old.assignee_id !== task.assignee_id) this.log(data, task.id, task.assignee_id ? `Assigned to ${data.members.find((member) => member.id === task.assignee_id)!.name}` : 'Unassigned this task');
    } else { data.tasks.push(task); this.log(data, task.id, 'Created this task'); }
    for (const id of task.labelIds.filter((id) => !old?.labelIds.includes(id))) this.log(data, task.id, `Added label: ${data.labels.find((label) => label.id === id)!.name}`);
    for (const id of old?.labelIds.filter((id) => !task.labelIds.includes(id)) ?? []) this.log(data, task.id, `Removed label: ${data.labels.find((label) => label.id === id)?.name ?? 'deleted label'}`);
    this.write(data);
    return task;
  }
  async moveTasks(moves: TaskMove[]) {
    const data = this.read();
    for (const move of moves) {
      const task = data.tasks.find((item) => item.id === move.id);
      if (!task) throw new Error('This task no longer exists.');
      if (task.status !== move.status) this.log(data, task.id, `Moved from ${statusTitle(task.status)} → ${statusTitle(move.status)}`);
      Object.assign(task, { status: move.status, position: move.position, updated_at: now() });
    }
    this.write(data);
  }
  async deleteTask(id: string) {
    const data = this.read();
    data.tasks = data.tasks.filter((task) => task.id !== id);
    data.comments = data.comments.filter((comment) => comment.task_id !== id);
    data.activity = data.activity.filter((event) => event.task_id !== id);
    this.write(data);
  }
  async addComment(taskId: string, body: string) {
    if (!body.trim() || body.trim().length > 2000) throw new Error('Comments must be between 1 and 2,000 characters.');
    const data = this.read();
    if (!data.tasks.some((task) => task.id === taskId)) throw new Error('This task no longer exists.');
    data.comments.push({ id: crypto.randomUUID(), task_id: taskId, body: body.trim(), user_id: data.userId, created_at: now() });
    this.write(data);
  }
  async addMember(name: string, color: string) {
    if (!name.trim() || name.trim().length > 80) throw new Error('Names must be between 1 and 80 characters.');
    const data = this.read();
    data.members.push({ id: crypto.randomUUID(), user_id: data.userId, name: name.trim(), color, created_at: now() });
    this.write(data);
  }
  async deleteMember(id: string) {
    const data = this.read();
    data.members = data.members.filter((member) => member.id !== id);
    data.tasks.forEach((task) => { if (task.assignee_id === id) { task.assignee_id = null; this.log(data, task.id, 'Unassigned this task'); } });
    this.write(data);
  }
  async addLabel(name: string, color: string) {
    if (!name.trim() || name.trim().length > 40) throw new Error('Labels must be between 1 and 40 characters.');
    const data = this.read();
    if (data.labels.some((label) => label.name.toLowerCase() === name.trim().toLowerCase())) throw new Error('A label with that name already exists.');
    data.labels.push({ id: crypto.randomUUID(), user_id: data.userId, name: name.trim(), color, created_at: now() });
    this.write(data);
  }
  async deleteLabel(id: string) {
    const data = this.read();
    const name = data.labels.find((label) => label.id === id)?.name ?? 'deleted label';
    data.labels = data.labels.filter((label) => label.id !== id);
    data.tasks.forEach((task) => { if (task.labelIds.includes(id)) { task.labelIds = task.labelIds.filter((labelId) => labelId !== id); this.log(data, task.id, `Removed label: ${name}`); } });
    this.write(data);
  }
  subscribe(onChange: () => void) {
    const handler = (event: StorageEvent) => { if (event.key === DEMO_STORAGE_KEY) onChange(); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}