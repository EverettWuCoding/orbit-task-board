import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BoardRepository, Snapshot, Task, TaskDraft, TaskMove, Member, Label, Comment, Activity } from './types';
import { validateDraft } from './domain';
import { DemoRepository } from './demo';

export function validateSupabaseConfig(url: string, key: string): string | null {
  if (!url && !key) return null;
  if (!url || !key) return 'Supabase is partially configured. Set both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart or rebuild the app.';
  try { if (new URL(url).protocol !== 'https:' && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url)) return 'Use an HTTPS Supabase project URL.'; }
  catch { return 'VITE_SUPABASE_URL must be a valid Supabase project URL.'; }
  if (key.startsWith('sb_secret_')) return 'A secret Supabase key cannot be used in the frontend. Replace it with your public publishable key.';
  if (!key.startsWith('sb_publishable_')) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string };
      if (payload.role !== 'anon') return 'Use only a Supabase public publishable or legacy anon key. Service-role keys bypass RLS and must never be exposed.';
    } catch { return 'This does not look like a Supabase public publishable or legacy anon key.'; }
  }
  return null;
}

export class SupabaseRepository implements BoardRepository {
  readonly mode = 'supabase' as const;
  private userId = '';
  private initPromise?: Promise<string>;
  constructor(private client: SupabaseClient) {}

  initialize(): Promise<string> {
    // StrictMode and simultaneous consumers share one anonymous sign-in.
    if (!this.initPromise) this.initPromise = this.signIn().catch((error: unknown) => { this.initPromise = undefined; throw error; });
    return this.initPromise;
  }
  private async signIn() {
    const { data: { session }, error } = await this.client.auth.getSession();
    if (error) throw error;
    if (session) { this.userId = session.user.id; return this.userId; }
    const { data, error: signInError } = await this.client.auth.signInAnonymously();
    if (signInError) throw signInError;
    if (!data.user) throw new Error('Could not create a guest session. Please try again.');
    this.userId = data.user.id;
    return this.userId;
  }
  async load(): Promise<Snapshot> {
    await this.initialize();
    const tables = ['tasks', 'team_members', 'labels', 'comments', 'task_activity', 'task_labels'] as const;
    // Paginate instead of silently losing tasks/comments at PostgREST's row cap.
    const rows = await Promise.all(tables.map(async (table) => {
      const all: unknown[] = [];
      for (let from = 0; ; from += 500) {
        let query = this.client.from(table).select('*').eq('user_id', this.userId);
        query = table === 'task_labels' ? query.order('task_id').order('label_id') : query.order('created_at').order('id');
        const { data, error } = await query.range(from, from + 499);
        if (error) throw error;
        all.push(...data);
        if (data.length < 500) break;
      }
      return all;
    }));
    const links = rows[5] as { task_id: string; label_id: string }[];
    return {
      tasks: (rows[0] as Omit<Task, 'labelIds'>[]).map((task) => ({ ...task, labelIds: links.filter((link) => link.task_id === task.id).map((link) => link.label_id) })),
      members: rows[1] as Member[], labels: rows[2] as Label[], comments: rows[3] as Comment[], activity: rows[4] as Activity[],
    };
  }
  async saveTask(draft: TaskDraft, existing?: Task) {
    const validation = validateDraft(draft);
    if (validation) throw new Error(validation);
    const { labelIds, ...fields } = draft;
    const { data, error } = await this.client.rpc('save_task', {
      p_task: { ...fields, title: fields.title.trim(), id: existing?.id ?? crypto.randomUUID() },
      p_label_ids: labelIds, p_is_new: !existing,
    });
    if (error) throw error;
    return { ...(data as Omit<Task, 'labelIds'>), labelIds };
  }
  async moveTasks(moves: TaskMove[]) { const { error } = await this.client.rpc('move_tasks', { p_moves: moves }); if (error) throw error; }
  async deleteTask(id: string) { const { error } = await this.client.from('tasks').delete().eq('id', id).eq('user_id', this.userId); if (error) throw error; }
  async addComment(taskId: string, body: string) {
    if (!body.trim() || body.trim().length > 2000) throw new Error('Comments must be between 1 and 2,000 characters.');
    const { error } = await this.client.from('comments').insert({ task_id: taskId, body: body.trim(), user_id: this.userId });
    if (error) throw error;
  }
  async addMember(name: string, color: string) { const { error } = await this.client.from('team_members').insert({ name: name.trim(), color, user_id: this.userId }); if (error) throw error; }
  async deleteMember(id: string) { const { error } = await this.client.from('team_members').delete().eq('id', id).eq('user_id', this.userId); if (error) throw error; }
  async addLabel(name: string, color: string) {
    const { error } = await this.client.from('labels').insert({ name: name.trim(), color, user_id: this.userId });
    if (error?.code === '23505') throw new Error('A label with that name already exists.');
    if (error) throw error;
  }
  async deleteLabel(id: string) { const { error } = await this.client.from('labels').delete().eq('id', id).eq('user_id', this.userId); if (error) throw error; }
  subscribe(onChange: () => void) {
    const channel = this.client.channel(`orbit:${this.userId}:${crypto.randomUUID()}`);
    for (const table of ['tasks', 'team_members', 'labels', 'task_labels', 'comments', 'task_activity']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange);
    }
    channel.subscribe();
    const focus = () => onChange();
    window.addEventListener('focus', focus);
    // Refresh on reconnection; drops are persisted even without Realtime.
    window.addEventListener('online', focus);
    return () => { void this.client.removeChannel(channel); window.removeEventListener('focus', focus); window.removeEventListener('online', focus); };
  }
}

export function createRepository(): { repository: BoardRepository | null; error: string | null } {
  const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const error = validateSupabaseConfig(url, key);
  if (error) return { repository: null, error };
  return { repository: url ? new SupabaseRepository(createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })) : new DemoRepository(), error: null };
}