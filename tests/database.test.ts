// @vitest-environment node
// Execute the actual migration against PostgreSQL (WASM), not SQL mocks.
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';

let db: PGlite;
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const TASK = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MEMBER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const LABEL = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TASK_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const payload = (overrides: Record<string, unknown> = {}) => JSON.stringify({ id: TASK, title: 'Build Orbit', description: '', status: 'todo', priority: 'normal', due_date: null, assignee_id: null, ...overrides });
async function login(id: string | null, role = 'authenticated') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? '']);
  await db.exec(`set role ${role}`);
}
async function save(overrides: Record<string, unknown> = {}, labels: string[] = [], isNew = true) {
  return db.query('select * from public.save_task($1::jsonb, $2::uuid[], $3)', [payload(overrides), labels, isNew]);
}
async function createOwnReferences() {
  await db.query('insert into public.team_members(id, name) values ($1, $2)', [MEMBER, 'Alex']);
  await db.query('insert into public.labels(id, name) values ($1, $2)', [LABEL, 'Design']);
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role authenticated; create role anon;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    insert into auth.users values ('${A}'), ('${B}');
  `);
  await db.exec(await readFile('supabase/migrations/001_initial_schema.sql', 'utf8'));
}, 120_000);

beforeEach(async () => {
  await db.exec('reset role; truncate public.tasks, public.team_members, public.labels cascade;');
  await login(A);
});
afterAll(async () => { await db?.close(); });

describe('database schema and row-level security', () => {
  it('enables RLS on all six application tables', async () => {
    const result = await db.query<{ relname: string; relrowsecurity: boolean }>("select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'");
    expect(result.rows).toHaveLength(6);
    expect(result.rows.every((row) => row.relrowsecurity)).toBe(true);
  });
  it('automatically sets owner, UUID and creation timestamp', async () => {
    const result = await db.query<{ id: string; user_id: string; created_at: Date }>("insert into public.tasks(title) values ('Test task') returning *");
    expect(result.rows[0]?.user_id).toBe(A);
    expect(result.rows[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.rows[0]?.created_at).toBeTruthy();
  });
  it('guest B cannot read, edit, or delete guest A tasks', async () => {
    await save(); await login(B);
    expect((await db.query('select * from public.tasks')).rows).toHaveLength(0);
    expect((await db.query('update public.tasks set title = $1 where id = $2 returning id', ['Stolen', TASK])).rows).toHaveLength(0);
    expect((await db.query('delete from public.tasks where id = $1 returning id', [TASK])).rows).toHaveLength(0);
    await expect(save({ title: 'Stolen' }, [], false)).rejects.toThrow('not owned');
    await login(A); expect((await db.query<{ title: string }>('select title from public.tasks')).rows[0]?.title).toBe('Build Orbit');
  });
  it('cannot spoof user_id or transfer ownership', async () => {
    await expect(db.query('insert into public.tasks(title, user_id) values ($1, $2)', ['Spoof', B])).rejects.toThrow(/row-level security/);
    await save();
    await expect(db.query('update public.tasks set user_id = $1 where id = $2', [B, TASK])).rejects.toThrow(/immutable|row-level security/);
  });
  it('unauthenticated anon role has no table access or RPC permission', async () => {
    await save(); await login(null, 'anon');
    await expect(db.query('select * from public.tasks')).rejects.toThrow(/permission denied/);
    await expect(save()).rejects.toThrow(/permission denied/);
    await expect(db.query('select public.move_tasks($1::jsonb)', ['[]'])).rejects.toThrow(/permission denied/);
  });
  it('rejects empty/oversized titles, invalid priority/status and negative positions', async () => {
    for (const fields of [{ title: '  ' }, { title: 'a'.repeat(201) }, { description: 'a'.repeat(5001) }, { priority: 'critical' }, { status: 'backlog' }]) {
      await expect(save(fields)).rejects.toThrow(/check constraint/);
    }
    await expect(db.exec("insert into public.tasks(title, position) values ('Invalid', -1)")).rejects.toThrow(/check constraint/);
  });
  it('also isolates members, labels, task links, comments and activity', async () => {
    await createOwnReferences(); await save({ assignee_id: MEMBER }, [LABEL]);
    await db.query('insert into public.comments(task_id, body) values ($1, $2)', [TASK, 'Private comment']);
    await login(B);
    for (const table of ['team_members', 'labels', 'task_labels', 'comments', 'task_activity']) {
      expect((await db.query(`select * from public.${table}`)).rows).toHaveLength(0);
    }
  });
  it('composite owner FKs prohibit assigning another guest’s member', async () => {
    await createOwnReferences(); await login(B);
    await expect(save({ id: TASK_B, assignee_id: MEMBER })).rejects.toThrow(/foreign key/);
    expect((await db.query('select * from public.tasks')).rows).toHaveLength(0);
  });
  it('composite owner FKs prohibit another guest’s labels and roll back the whole create', async () => {
    await createOwnReferences(); await login(B);
    await expect(save({ id: TASK_B }, [LABEL])).rejects.toThrow(/foreign key/);
    expect((await db.query('select * from public.tasks')).rows).toHaveLength(0);
  });
  it('cannot attach a comment or label to another guest’s task', async () => {
    await save(); await login(B);
    await expect(db.query('insert into public.comments(task_id, body) values ($1, $2)', [TASK, 'Intrusion'])).rejects.toThrow(/foreign key/);
    await createOwnReferences();
    await expect(db.query('insert into public.task_labels(task_id, label_id) values ($1, $2)', [TASK, LABEL])).rejects.toThrow(/foreign key/);
  });
  it('writes task edits and labels atomically, preserving the previous state on failure', async () => {
    await createOwnReferences(); await save({}, [LABEL]);
    await expect(save({ title: 'Should roll back' }, [TASK_B], false)).rejects.toThrow(/foreign key/);
    expect((await db.query<{ title: string }>('select title from public.tasks')).rows[0]?.title).toBe('Build Orbit');
    expect((await db.query('select * from public.task_labels')).rows).toHaveLength(1);
    expect((await db.query('select * from public.task_activity')).rows).toHaveLength(2);
  });
  it('generates edit, status, assignment, date and label history automatically', async () => {
    await createOwnReferences(); await save();
    await save({ title: 'Updated', description: 'Context', status: 'in_progress', priority: 'high', assignee_id: MEMBER, due_date: '2026-11-03' }, [LABEL], false);
    const result = await db.query<{ summary: string }>('select summary from public.task_activity');
    expect(result.rows.map((row) => row.summary)).toEqual(expect.arrayContaining([
      'Created this task', 'Changed the title', 'Updated the description', 'Moved from To Do → In Progress', 'Set priority to high', 'Assigned to Alex', 'Set due date to 2026-11-03', 'Added label: Design',
    ]));
  });
  it('activity cannot be forged, rewritten, or removed by an authenticated client', async () => {
    await save();
    await expect(db.query('insert into public.task_activity(task_id, user_id, summary) values ($1, $2, $3)', [TASK, A, 'Forged'])).rejects.toThrow(/permission denied/);
    await expect(db.exec("update public.task_activity set summary = 'Forged'")).rejects.toThrow(/permission denied/);
    await expect(db.exec('delete from public.task_activity')).rejects.toThrow(/permission denied/);
  });
  it('batch moves roll back if any task belongs to another guest', async () => {
    await save(); await login(B); await save({ id: TASK_B }); await login(A);
    const moves = JSON.stringify([{ id: TASK, status: 'done', position: 0 }, { id: TASK_B, status: 'done', position: 1 }]);
    await expect(db.query('select public.move_tasks($1::jsonb)', [moves])).rejects.toThrow('not owned');
    expect((await db.query<{ status: string }>('select status from public.tasks')).rows[0]?.status).toBe('todo');
  });
  it('reordering only changes positions and does not pollute activity', async () => {
    await save();
    await db.query('select public.move_tasks($1::jsonb)', [JSON.stringify([{ id: TASK, status: 'todo', position: 3 }])]);
    expect((await db.query('select * from public.task_activity')).rows).toHaveLength(1);
    expect((await db.query<{ position: number }>('select position from public.tasks')).rows[0]?.position).toBe(3);
  });
  it('deleting a member unassigns tasks without deleting them', async () => {
    await createOwnReferences(); await save({ assignee_id: MEMBER });
    await db.query('delete from public.team_members where id = $1', [MEMBER]);
    expect((await db.query<{ assignee_id: string | null }>('select assignee_id from public.tasks')).rows).toEqual([{ assignee_id: null }]);
    expect((await db.query<{ summary: string }>('select summary from public.task_activity')).rows.map((row) => row.summary)).toContain('Unassigned this task');
  });
  it('deleting a label removes links but not tasks; task deletion cascades all dependents', async () => {
    await createOwnReferences(); await save({}, [LABEL]);
    await db.query('insert into public.comments(task_id, body) values ($1, $2)', [TASK, 'Context']);
    await db.query('delete from public.labels where id = $1', [LABEL]);
    expect((await db.query('select * from public.tasks')).rows).toHaveLength(1);
    expect((await db.query('select * from public.task_labels')).rows).toHaveLength(0);
    await db.query('delete from public.tasks where id = $1', [TASK]);
    expect((await db.query('select * from public.comments')).rows).toHaveLength(0);
    expect((await db.query('select * from public.task_activity')).rows).toHaveLength(0);
  });
  it('enforces comment lengths and case-insensitive unique label names', async () => {
    await save(); await createOwnReferences();
    await expect(db.query('insert into public.comments(task_id, body) values ($1, $2)', [TASK, ' '])).rejects.toThrow(/check constraint/);
    await expect(db.query('insert into public.comments(task_id, body) values ($1, $2)', [TASK, 'x'.repeat(2001)])).rejects.toThrow(/check constraint/);
    await expect(db.exec("insert into public.labels(name) values (' design ')")).rejects.toThrow(/unique constraint/);
  });
});