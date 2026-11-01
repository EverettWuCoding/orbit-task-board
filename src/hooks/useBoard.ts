import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, planMove } from '../lib/domain';
import type { BoardRepository, Snapshot, Status, Task, TaskDraft } from '../lib/types';

const EMPTY: Snapshot = { tasks: [], members: [], labels: [], comments: [], activity: [] };

export function useBoard(repository: BoardRepository | null) {
  const [data, setData] = useState<Snapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const lock = useRef(false);
  const generation = useRef(0);
  const dataRef = useRef(data);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    if (!repository || lock.current) return;
    const version = ++generation.current;
    try {
      const snapshot = await repository.load();
      if (mounted.current && version === generation.current && !lock.current) { dataRef.current = snapshot; setData(snapshot); }
    } catch (err) { if (mounted.current) setError(errorMessage(err)); }
  }, [repository]);

  const connect = useCallback(async () => {
    if (!repository) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const id = await repository.initialize();
      if (mounted.current) setUserId(id);
      await refresh();
    } catch (err) { if (mounted.current) setError(errorMessage(err)); }
    finally { if (mounted.current) setLoading(false); }
  }, [repository, refresh]);

  useEffect(() => {
    mounted.current = true;
    // Hydration happens after the effect has subscribed; initial loading is
    // already true, so there is no synchronous effect-driven render cascade.
    void Promise.resolve().then(() => { if (mounted.current) void connect(); });
    return () => { mounted.current = false; generation.current += 1; };
  }, [connect]);

  useEffect(() => {
    if (!repository || !userId) return;
    let timer: ReturnType<typeof setTimeout>;
    const unsubscribe = repository.subscribe(() => { clearTimeout(timer); timer = setTimeout(() => { void refresh(); }, 180); });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, [repository, userId, refresh]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const mutate = useCallback(async <T,>(operation: () => Promise<T>, success: string, optimistic?: Snapshot): Promise<T> => {
    if (lock.current || !repository) throw new Error('Please wait for the current change to finish.');
    lock.current = true; generation.current += 1;
    const before = dataRef.current;
    setBusy(true); setError(null);
    if (optimistic) { dataRef.current = optimistic; setData(optimistic); }
    let committed = false;
    try {
      const result = await operation();
      committed = true;
      const snapshot = await repository.load();
      if (mounted.current) { dataRef.current = snapshot; setData(snapshot); setNotice(success); }
      return result;
    } catch (err) {
      if (mounted.current) {
        if (!committed && optimistic) { dataRef.current = before; setData(before); }
        setError(committed ? 'Your change was saved, but refreshing the board failed. Retry loading; do not submit the change again.' : errorMessage(err));
      }
      // A confirmed write must not leave an editor open inviting a duplicate.
      if (committed) return undefined as T;
      throw err;
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }, [repository]);

  const saveTask = (draft: TaskDraft, existing?: Task) => mutate(() => repository!.saveTask(draft, existing), existing ? 'Task updated' : 'Task created');
  const moveTask = async (id: string, target: Status, overId?: string) => {
    const current = dataRef.current;
    const moves = planMove(current.tasks, id, target, overId);
    if (!moves.length) return;
    const optimistic = { ...current, tasks: current.tasks.map((task) => { const move = moves.find((item) => item.id === task.id); return move ? { ...task, ...move } : task; }) };
    await mutate(() => repository!.moveTasks(moves), 'Task moved', optimistic);
  };

  return { ...data, loading, busy, error, notice, userId, refresh, connect, saveTask, moveTask,
    dismissError: () => setError(null),
    deleteTask: (id: string) => mutate(() => repository!.deleteTask(id), 'Task deleted'),
    addComment: (id: string, body: string) => mutate(() => repository!.addComment(id, body), 'Comment added'),
    addMember: (name: string, color: string) => mutate(() => repository!.addMember(name, color), 'Team member added'),
    deleteMember: (id: string) => mutate(() => repository!.deleteMember(id), 'Team member removed'),
    addLabel: (name: string, color: string) => mutate(() => repository!.addLabel(name, color), 'Label created'),
    deleteLabel: (id: string) => mutate(() => repository!.deleteLabel(id), 'Label removed'),
  };
}
export type BoardState = ReturnType<typeof useBoard>;