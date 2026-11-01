import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Uses the PUBLIC frontend key and two independent anonymous guest sessions.
// It never reads an admin key and never prints user access/refresh tokens.
const env = Object.fromEntries((await readFile(fileURLToPath(new URL('../.env.local', import.meta.url)), 'utf8'))
  .split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#')).map((line) => {
    const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)];
  }));
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && key, 'Configure .env.local with the dedicated project URL and public key first.');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const a = createClient(url, key, options);
const b = createClient(url, key, options);
const unauthenticated = createClient(url, key, options);
const taskId = crypto.randomUUID();
const memberId = crypto.randomUUID();
const labelId = crypto.randomUUID();
const bTaskId = crypto.randomUUID();
const draft = { id: taskId, title: 'Temporary live verification task', description: 'Removed automatically after verification.', status: 'todo', priority: 'normal', due_date: null, assignee_id: memberId };
let channel;
const check = (response, label) => { if (response.error) throw new Error(`${label}: ${response.error.message}`); return response.data; };
try {
  const guestA = check(await a.auth.signInAnonymously(), 'Guest A anonymous sign-in');
  const guestB = check(await b.auth.signInAnonymously(), 'Guest B anonymous sign-in');
  assert.notEqual(guestA.user.id, guestB.user.id);
  console.log('Independent anonymous guest accounts created; tokens not printed.');
  const restored = createClient(url, key, options);
  check(await restored.auth.setSession({ access_token: guestA.session.access_token, refresh_token: guestA.session.refresh_token }), 'Session restoration');
  assert.equal(check(await restored.auth.getUser(), 'Restored user').user.id, guestA.user.id);
  console.log('Guest session restoration verified.');
  check(await a.from('team_members').insert({ id: memberId, name: 'Verification Member', color: '#438ab2' }), 'Create member');
  check(await a.from('labels').insert({ id: labelId, name: `Verification ${labelId.slice(0, 6)}`, color: '#429d83' }), 'Create label');
  check(await a.rpc('save_task', { p_task: draft, p_label_ids: [labelId], p_is_new: true }), 'Create task with assignee and label');
  check(await a.from('comments').insert({ task_id: taskId, body: 'Temporary verification comment.' }), 'Create comment');
  const saved = check(await a.from('tasks').select('*').eq('id', taskId).single(), 'Read own task');
  assert.equal(saved.user_id, guestA.user.id); assert.equal(saved.assignee_id, memberId);
  assert.equal(check(await restored.from('tasks').select('id').eq('id', taskId), 'Restored persistence read').length, 1);
  for (const table of ['tasks', 'team_members', 'labels', 'task_labels', 'comments', 'task_activity']) {
    assert.equal(check(await b.from(table).select('*'), `Guest B read ${table}`).length, 0);
  }
  assert.equal(check(await b.from('tasks').update({ title: 'Not allowed' }).eq('id', taskId).select('id'), 'Cross-guest update').length, 0);
  assert.equal(check(await b.from('tasks').delete().eq('id', taskId).select('id'), 'Cross-guest delete').length, 0);
  assert.ok((await b.from('tasks').insert({ title: 'Not allowed', user_id: guestA.user.id })).error, 'Spoofed ownership must fail');
  assert.ok((await b.rpc('save_task', { p_task: { ...draft, id: bTaskId }, p_label_ids: [], p_is_new: true })).error, 'Foreign member must fail');
  assert.ok((await b.rpc('save_task', { p_task: { ...draft, id: bTaskId, assignee_id: null }, p_label_ids: [labelId], p_is_new: true })).error, 'Foreign label must fail');
  assert.equal(check(await b.from('tasks').select('id').eq('id', bTaskId), 'Atomic rollback').length, 0);
  assert.ok((await b.from('comments').insert({ task_id: taskId, body: 'Not allowed' })).error, 'Foreign comment must fail');
  assert.ok((await a.from('task_activity').insert({ task_id: taskId, user_id: guestA.user.id, summary: 'Not allowed' })).error, 'Forged activity must fail');
  assert.ok((await unauthenticated.from('tasks').select('id')).error, 'Unauthenticated reads must fail');
  assert.ok((await unauthenticated.rpc('move_tasks', { p_moves: [] })).error, 'Unauthenticated RPC must fail');
  console.log('Live RLS, spoofing, cross-guest links, immutable history and atomic rollback verified.');

  let resolveEvent;
  const event = new Promise((resolve) => { resolveEvent = resolve; });
  channel = a.channel(`verification-${taskId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `id=eq.${taskId}` }, (payload) => { if (payload.new.status === 'in_progress') resolveEvent(); });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime subscription timed out')), 20_000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') { clearTimeout(timeout); resolve(); }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timeout); reject(new Error(`Realtime ${status}`)); }
    });
  });
  check(await a.rpc('move_tasks', { p_moves: [{ id: taskId, status: 'in_progress', position: 0 }] }), 'Move task');
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime update timed out')), 20_000);
    event.then(() => { clearTimeout(timeout); resolve(); });
  });
  const moved = check(await a.from('tasks').select('status,position').eq('id', taskId).single(), 'Persisted moved task');
  assert.equal(moved.status, 'in_progress'); assert.equal(moved.position, 0);
  const history = check(await a.from('task_activity').select('summary').eq('task_id', taskId), 'Activity history');
  assert.ok(history.some((entry) => entry.summary === 'Moved from To Do → In Progress'));
  assert.equal(check(await a.from('comments').select('body').eq('task_id', taskId), 'Comment persistence').length, 1);
  console.log('Live Realtime delivery, status persistence, comments and database activity verified.');
} finally {
  if (channel) await a.removeChannel(channel);
  await a.from('tasks').delete().eq('id', taskId);
  await b.from('tasks').delete().eq('id', bTaskId);
  await a.from('team_members').delete().eq('id', memberId);
  await a.from('labels').delete().eq('id', labelId);
  console.log('Temporary verification tasks and roster/label records removed.');
}