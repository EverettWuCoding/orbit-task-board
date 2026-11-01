import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoRepository, DEMO_STORAGE_KEY } from './demo';
import type { TaskDraft } from './types';

const draft: TaskDraft = { title: 'New task', description: 'Details', status: 'todo', priority: 'high', due_date: null, assignee_id: null, labelIds: [] };
let repo: DemoRepository;
beforeEach(() => { repo = new DemoRepository(); });
describe('persistent local demo', () => {
  it('seeds once and preserves the same guest across repository instances', async () => {
    const id = await repo.initialize();
    expect(await new DemoRepository().initialize()).toBe(id);
    expect((await repo.load()).tasks).toHaveLength(8);
  });
  it('persists tasks, comments, edits and status history across reloads', async () => {
    const created = await repo.saveTask(draft);
    await repo.addComment(created.id, '  A useful update  ');
    await repo.saveTask({ ...draft, title: 'Updated task', status: 'in_progress' }, created);
    const saved = await new DemoRepository().load();
    expect(saved.tasks.find((task) => task.id === created.id)?.title).toBe('Updated task');
    expect(saved.comments.find((item) => item.task_id === created.id)?.body).toBe('A useful update');
    expect(saved.activity.filter((item) => item.task_id === created.id).map((item) => item.summary)).toContain('Moved from To Do → In Progress');
  });
  it('validates title, comment length, and cross-workspace references', async () => {
    await expect(repo.saveTask({ ...draft, title: ' ' })).rejects.toThrow('title');
    await expect(repo.saveTask({ ...draft, assignee_id: 'another-guest' })).rejects.toThrow('workspace');
    await expect(repo.saveTask({ ...draft, labelIds: ['another-guest'] })).rejects.toThrow('workspace');
    await expect(repo.addComment('missing', 'ok')).rejects.toThrow('no longer exists');
    await expect(repo.addComment('missing', 'a'.repeat(2001))).rejects.toThrow('2,000');
  });
  it('removes task dependents and leaves unrelated work intact', async () => {
    const created = await repo.saveTask(draft);
    await repo.addComment(created.id, 'Good work');
    await repo.deleteTask(created.id);
    const data = await repo.load();
    expect(data.tasks).toHaveLength(8);
    expect(data.comments.some((item) => item.task_id === created.id)).toBe(false);
    expect(data.activity.some((item) => item.task_id === created.id)).toBe(false);
  });
  it('manages members and multiple labels with safe removal', async () => {
    await repo.addMember('Taylor', '#438ab2');
    await repo.addLabel('Quality', '#429d83');
    const data = await repo.load();
    const member = data.members.find((item) => item.name === 'Taylor')!;
    const label = data.labels.find((item) => item.name === 'Quality')!;
    const created = await repo.saveTask({ ...draft, assignee_id: member.id, labelIds: [label.id, data.labels[0]!.id] });
    await repo.deleteMember(member.id); await repo.deleteLabel(label.id);
    const saved = (await repo.load()).tasks.find((item) => item.id === created.id)!;
    expect(saved.assignee_id).toBeNull(); expect(saved.labelIds).toEqual([data.labels[0]!.id]);
    await expect(repo.addLabel('design', '#438ab2')).rejects.toThrow('already exists');
  });
  it('does not silently overwrite corrupted storage or lose failed writes', async () => {
    localStorage.setItem(DEMO_STORAGE_KEY, '{bad json');
    await expect(repo.load()).rejects.toThrow('unreadable');
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn(() => { throw new Error('Quota exceeded'); }) } as unknown as Storage;
    await expect(new DemoRepository(storage).initialize()).rejects.toThrow('storage is unavailable');
  });
});