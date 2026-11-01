import { describe, expect, it } from 'vitest';
import { boardStats, dueInfo, filterTasks, initials, planMove, validateDraft, errorMessage, readableColor } from './domain';
import { EMPTY_FILTERS } from './types';
import type { Task, TaskDraft } from './types';

const task = (overrides: Partial<Task> = {}): Task => ({ id: 'a', title: 'Build the board', description: '', status: 'todo', priority: 'normal', due_date: null, assignee_id: null, position: 0, user_id: 'guest', created_at: '2026-11-01T12:00:00Z', updated_at: '2026-11-01T12:00:00Z', labelIds: [], ...overrides });
const today = new Date(2026, 10, 1, 12);
describe('dates and summary', () => {
  it('uses local calendar days, not midnight UTC, for urgency', () => {
    expect(dueInfo(task({ due_date: '2026-11-01' }), today)).toMatchObject({ label: 'Today', urgency: 'soon', days: 0 });
    expect(dueInfo(task({ due_date: '2026-10-31' }), today)).toMatchObject({ label: 'Yesterday', urgency: 'overdue' });
    expect(dueInfo(task({ due_date: '2026-11-03' }), today)?.urgency).toBe('soon');
    expect(dueInfo(task({ due_date: '2026-11-04' }), today)?.urgency).toBe('normal');
  });
  it('never marks completed work overdue and handles invalid dates', () => {
    expect(dueInfo(task({ status: 'done', due_date: '2026-10-01' }), today)?.urgency).toBe('complete');
    expect(dueInfo(task({ due_date: 'invalid' }), today)).toBeNull();
    expect(dueInfo(task(), today)).toBeNull();
  });
  it('summarizes the whole board and safely handles zero tasks', () => {
    expect(boardStats([], today)).toEqual({ total: 0, completed: 0, overdue: 0, percentage: 0 });
    expect(boardStats([task({ due_date: '2026-10-31' }), task({ id: 'b', status: 'done', due_date: '2026-10-31' })], today)).toEqual({ total: 2, completed: 1, overdue: 1, percentage: 50 });
  });
});
describe('filters', () => {
  const tasks = [task({ priority: 'high', assignee_id: 'alex', labelIds: ['design'], due_date: '2026-10-31' }), task({ id: 'b', title: 'Write docs', position: 1 })];
  it('combines case-insensitive title search, priority, member and label', () => {
    expect(filterTasks(tasks, { search: ' BUILD ', priority: 'high', assignee: 'alex', label: 'design', due: 'overdue' }, today)).toHaveLength(1);
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, label: 'other' }, today)).toHaveLength(0);
  });
  it('supports unassigned tasks and stable position ordering', () => {
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, assignee: 'unassigned' }, today)[0]?.id).toBe('b');
    expect(filterTasks([...tasks].reverse(), EMPTY_FILTERS, today).map((item) => item.id)).toEqual(['a', 'b']);
  });
  it('coming-up excludes completed and undated tasks', () => {
    expect(filterTasks([task({ due_date: '2026-11-02' }), task({ id: 'b', status: 'done', due_date: '2026-11-02' }), task({ id: 'c' })], { ...EMPTY_FILTERS, due: 'soon' }, today)).toHaveLength(1);
  });
});
describe('moving and validation', () => {
  it('moves to an empty column', () => { expect(planMove([task()], 'a', 'done')).toEqual([{ id: 'a', status: 'done', position: 0 }]); });
  it('reorders down and up within a column', () => {
    const tasks = [task(), task({ id: 'b', position: 1 }), task({ id: 'c', position: 2 })];
    expect(planMove(tasks, 'a', 'todo', 'c')).toEqual([{ id: 'b', status: 'todo', position: 0 }, { id: 'c', status: 'todo', position: 1 }, { id: 'a', status: 'todo', position: 2 }]);
    expect(planMove(tasks, 'c', 'todo', 'a')[0]).toEqual({ id: 'c', status: 'todo', position: 0 });
  });
  it('includes hidden tasks and ignores invalid/self moves', () => {
    const tasks = [task(), task({ id: 'b', status: 'done' }), task({ id: 'hidden', status: 'done', position: 1 })];
    expect(planMove(tasks, 'a', 'done').find((item) => item.id === 'a')?.position).toBe(2);
    expect(planMove(tasks, 'missing', 'done')).toEqual([]);
    expect(planMove(tasks, 'a', 'todo', 'a')).toEqual([]);
  });
  it('rejects blank titles, oversized content and impossible dates', () => {
    const draft: TaskDraft = task();
    expect(validateDraft({ ...draft, title: '  ' })).toBeTruthy();
    expect(validateDraft({ ...draft, title: 'a'.repeat(201) })).toBeTruthy();
    expect(validateDraft({ ...draft, description: 'a'.repeat(5001) })).toBeTruthy();
    expect(validateDraft({ ...draft, due_date: '2026-02-30' })).toBeTruthy();
    expect(validateDraft(draft)).toBeNull();
  });
  it('formats initials and helpful connection errors', () => {
    expect(initials('  Jamie Chen  ')).toBe('JC');
    expect(initials('')).toBe('');
    expect(errorMessage(new Error('Failed to fetch'))).toContain('internet');
    expect(errorMessage({ message: 'anonymous_provider_disabled' })).toContain('Enable anonymous');
  });
  it('makes even bright custom colors readable and rejects CSS-like inputs', () => {
    expect(readableColor('#ffffff')).not.toBe('#ffffff');
    expect(readableColor('#000000')).toBe('#000000');
    expect(readableColor('red;display:none')).toBe('#655080');
    expect(readableColor('#d86c91')).toMatch(/^#[a-f\d]{6}$/);
  });
});