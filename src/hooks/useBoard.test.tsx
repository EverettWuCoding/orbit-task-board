import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DemoRepository } from '../lib/demo';
import { useBoard } from './useBoard';

describe('board mutation state', () => {
  it('rolls an optimistic move back if persistence fails', async () => {
    const repo = new DemoRepository();
    const { result } = renderHook(() => useBoard(repo));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const task = result.current.tasks.find((item) => item.status === 'todo')!;
    vi.spyOn(repo, 'moveTasks').mockRejectedValueOnce(new Error('Network down'));
    await act(async () => { await expect(result.current.moveTask(task.id, 'done')).rejects.toThrow('Network down'); });
    expect(result.current.tasks.find((item) => item.id === task.id)?.status).toBe('todo');
    expect(result.current.error).toBe('Network down');
    expect(result.current.busy).toBe(false);
  });
  it('does not offer a duplicate submit after a confirmed write followed by refresh failure', async () => {
    const repo = new DemoRepository();
    const { result } = renderHook(() => useBoard(repo));
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.spyOn(repo, 'load').mockRejectedValueOnce(new Error('Offline'));
    await act(async () => { await result.current.addComment(result.current.tasks[0]!.id, 'Saved once'); });
    expect(result.current.error).toContain('Your change was saved');
    expect((await repo.load()).comments.filter((item) => item.body === 'Saved once')).toHaveLength(1);
  });
});