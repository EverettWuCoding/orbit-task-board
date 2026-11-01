export const STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const;
export type Status = typeof STATUSES[number];
export const PRIORITIES = ['low', 'normal', 'high'] as const;
export type Priority = typeof PRIORITIES[number];
export const COLORS = ['#7962d9', '#d86c91', '#438ab2', '#429d83', '#c18b3c', '#707b93'] as const;
export const COLUMNS: { id: Status; title: string; caption: string; color: string }[] = [
  { id: 'todo', title: 'To Do', caption: 'Ideas ready for their first step', color: '#8993a5' },
  { id: 'in_progress', title: 'In Progress', caption: 'A little momentum, every day', color: '#8870db' },
  { id: 'in_review', title: 'In Review', caption: 'Good work, getting even better', color: '#d59b46' },
  { id: 'done', title: 'Done', caption: 'Small wins. Big possibilities.', color: '#4da68b' },
];
export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due_date: string | null;
  assignee_id: string | null;
  position: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  labelIds: string[];
}
export type TaskDraft = Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'assignee_id' | 'labelIds'>;
export interface Member { id: string; user_id: string; name: string; color: string; created_at: string }
export interface Label { id: string; user_id: string; name: string; color: string; created_at: string }
export interface Comment { id: string; task_id: string; user_id: string; body: string; created_at: string }
export interface Activity { id: string; task_id: string; user_id: string; summary: string; created_at: string }
export interface Snapshot { tasks: Task[]; members: Member[]; labels: Label[]; comments: Comment[]; activity: Activity[] }
export interface TaskMove { id: string; status: Status; position: number }
export interface Filters { search: string; priority: string; assignee: string; label: string; due: 'all' | 'overdue' | 'soon' }
export const EMPTY_FILTERS: Filters = { search: '', priority: 'all', assignee: 'all', label: 'all', due: 'all' };
export interface BoardRepository {
  mode: 'demo' | 'supabase';
  initialize(): Promise<string>;
  load(): Promise<Snapshot>;
  saveTask(draft: TaskDraft, existing?: Task): Promise<Task>;
  moveTasks(moves: TaskMove[]): Promise<void>;
  deleteTask(id: string): Promise<void>;
  addComment(taskId: string, body: string): Promise<void>;
  addMember(name: string, color: string): Promise<void>;
  deleteMember(id: string): Promise<void>;
  addLabel(name: string, color: string): Promise<void>;
  deleteLabel(id: string): Promise<void>;
  subscribe(onChange: () => void): () => void;
}