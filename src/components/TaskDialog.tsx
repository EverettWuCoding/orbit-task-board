import { useState } from 'react';
import { CalendarDays, Flag, UserRound, Tag, MessageCircle, History, Send, Trash2, ArrowRight, Check } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Modal, Avatar, Spinner } from './Primitives';
import type { BoardState } from '../hooks/useBoard';
import type { Task, TaskDraft, Status } from '../lib/types';
import { COLUMNS } from '../lib/types';
import { readableColor, validateDraft } from '../lib/domain';

export function TaskDialog({ task, status = 'todo', board, onClose }: { task?: Task; status?: Status; board: BoardState; onClose: () => void }) {
  const [draft, setDraft] = useState<TaskDraft>(() => task ? {
    title: task.title, description: task.description, status: task.status, priority: task.priority,
    due_date: task.due_date, assignee_id: task.assignee_id, labelIds: task.labelIds,
  } : { title: '', description: '', status, priority: 'normal', due_date: null, assignee_id: null, labelIds: [] });
  const [formError, setFormError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState<'comments' | 'activity'>('comments');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const comments = board.comments.filter((item) => item.task_id === task?.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const activity = board.activity.filter((item) => item.task_id === task?.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const change = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => { setDraft((current) => ({ ...current, [key]: value })); setFormError(null); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateDraft(draft);
    if (validation) { setFormError(validation); return; }
    try { await board.saveTask(draft, task); onClose(); }
    catch { setFormError('Could not save. Your edits are still here; check the error message and try again.'); }
  };
  const addComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!task || !comment.trim()) return;
    try { await board.addComment(task.id, comment); setComment(''); }
    catch { setFormError('Could not add your comment. Please try again.'); }
  };
  return <Modal title={task ? 'Task details' : 'A new little possibility'} subtitle={task ? `TASK · ${task.id.slice(0, 8).toUpperCase()}` : 'Every great idea starts with a first step.'} onClose={onClose} busy={board.busy} className="task-modal">
    {board.error && <div className="inline-error" role="alert">{board.error}</div>}
    <form onSubmit={(event) => { void save(event); }} className="task-form">
      <label className="field-label" htmlFor="task-title">Task title <span>*</span></label><input id="task-title" className="title-input" value={draft.title} onChange={(event) => change('title', event.target.value)} placeholder="What would you like to work on?" maxLength={200} data-autofocus required disabled={board.busy} />
      <label className="field-label" htmlFor="task-description">Description <span className="optional">optional</span></label><textarea id="task-description" value={draft.description} onChange={(event) => change('description', event.target.value)} placeholder="Add context, a few details, or a little inspiration…" rows={3} maxLength={5000} disabled={board.busy} />
      <div className="task-fields"><div><label htmlFor="task-status"><ArrowRight size={14} /> Status</label><select id="task-status" value={draft.status} onChange={(event) => change('status', event.target.value as Status)} disabled={board.busy}>{COLUMNS.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}</select></div>
        <div><label htmlFor="task-priority"><Flag size={14} /> Priority</label><select id="task-priority" value={draft.priority} onChange={(event) => change('priority', event.target.value as TaskDraft['priority'])} disabled={board.busy}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></div>
        <div><label htmlFor="task-due-date"><CalendarDays size={14} /> Due date</label><input id="task-due-date" type="date" value={draft.due_date ?? ''} onChange={(event) => change('due_date', event.target.value || null)} disabled={board.busy} /></div>
        <div><label htmlFor="task-assignee"><UserRound size={14} /> Assignee</label><select id="task-assignee" value={draft.assignee_id ?? ''} onChange={(event) => change('assignee_id', event.target.value || null)} disabled={board.busy}><option value="">Unassigned</option>{board.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></div>
      </div>
      <fieldset className="label-picker" disabled={board.busy}><legend><Tag size={14} /> Labels</legend>{board.labels.length ? <div>{board.labels.map((label) => <label className={`label-choice ${draft.labelIds.includes(label.id) ? 'selected' : ''}`} style={{ color: readableColor(label.color) }} key={label.id}><input type="checkbox" checked={draft.labelIds.includes(label.id)} onChange={(event) => change('labelIds', event.target.checked ? [...draft.labelIds, label.id] : draft.labelIds.filter((id) => id !== label.id))} /><span>{label.name}</span>{draft.labelIds.includes(label.id) && <Check size={12} />}</label>)}</div> : <p className="muted">Create labels with “Manage labels” in your workspace.</p>}</fieldset>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="form-actions">{task ? <button type="button" className="icon-button danger-button" aria-label="Delete task" onClick={() => setConfirmDelete(true)} disabled={board.busy}><Trash2 size={17} /></button> : <span className="form-hint">Made for progress, not perfection.</span>}<div><button type="button" className="button secondary" onClick={onClose} disabled={board.busy}>Cancel</button><button className="button primary" type="submit" disabled={board.busy}>{board.busy ? <Spinner /> : task ? 'Save changes' : 'Create task'}</button></div></div>
    </form>
    {confirmDelete && <section className="delete-confirm" aria-label="Confirm task deletion"><div><strong>Delete this task?</strong><p>This also permanently removes its comments and activity.</p></div><div><button className="button secondary" onClick={() => setConfirmDelete(false)} disabled={board.busy}>Keep task</button><button className="button danger" disabled={board.busy} onClick={() => { if (task) void board.deleteTask(task.id).then(onClose).catch(() => setFormError('Could not delete this task.')); }}>Delete permanently</button></div></section>}
    {task && <section className="task-conversation"><div className="detail-tabs" role="tablist" aria-label="Task discussion"><button id="comments-tab" role="tab" aria-controls="comments-panel" aria-selected={tab === 'comments'} onClick={() => setTab('comments')}><MessageCircle size={15} />Comments<span>{comments.length}</span></button><button id="activity-tab" role="tab" aria-controls="activity-panel" aria-selected={tab === 'activity'} onClick={() => setTab('activity')}><History size={15} />Activity<span>{activity.length}</span></button></div>
      {tab === 'comments' ? <div id="comments-panel" role="tabpanel" aria-labelledby="comments-tab">
        <div className="comment-stream">{comments.length ? comments.map((item) => <article className="comment" key={item.id}><Avatar member={{ name: 'Guest', color: '#7962d9' }} /><div><div className="comment-heading"><strong>You</strong><time dateTime={item.created_at} title={format(parseISO(item.created_at), 'PPpp')}>{formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })}</time></div><p>{item.body}</p></div></article>) : <p className="conversation-empty">A little conversation goes a long way. Leave the first comment.</p>}</div>
        <form className="comment-form" onSubmit={(event) => { void addComment(event); }}><label className="sr-only" htmlFor="comment-body">Write a comment</label><textarea id="comment-body" placeholder="Leave a thought, update, or a little encouragement…" value={comment} onChange={(event) => setComment(event.target.value)} rows={2} maxLength={2000} disabled={board.busy} /><div><span>{comment.length}/2,000</span><button className="button primary" disabled={!comment.trim() || board.busy} type="submit"><Send size={14} /> Post comment</button></div></form>
      </div> : <div id="activity-panel" role="tabpanel" aria-labelledby="activity-tab" className="activity-stream">{activity.map((item) => <div className="activity-event" key={item.id}><span className="activity-dot" /><div><p>{item.summary}</p><time dateTime={item.created_at} title={format(parseISO(item.created_at), 'PPpp')}>{formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })}</time></div></div>)}{!activity.length && <p className="conversation-empty">Task history will appear here as things move forward.</p>}</div>}
    </section>}
  </Modal>;
}