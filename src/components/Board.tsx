import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCorners, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Sparkles, Inbox, ArrowRight } from 'lucide-react';
import { COLUMNS, STATUSES } from '../lib/types';
import type { Task, Status, Member, Label } from '../lib/types';
import type { BoardState } from '../hooks/useBoard';
import { TaskCard } from './TaskCard';
import { Avatar, EmptyState } from './Primitives';
import { dueInfo, readableColor, statusTitle } from '../lib/domain';
import { boardKeyboardCoordinates } from '../lib/drag';

function Column({ column, tasks, allCount, board, onOpen, onCreate }: {
  column: typeof COLUMNS[number]; tasks: Task[]; allCount: number; board: BoardState; onOpen: (id: string) => void; onCreate: (status: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled: board.busy });
  return <section ref={setNodeRef} className={`board-column ${isOver ? 'column-over' : ''}`} aria-label={`${column.title} column`} data-testid={`column-${column.id}`}>
    <header className="column-header"><div><span className="column-dot" style={{ background: column.color }} /><h2>{column.title}</h2><span className="column-count">{tasks.length}</span></div><button className="icon-button" aria-label={`Add task to ${column.title}`} onClick={() => onCreate(column.id)} disabled={board.busy}><Plus size={17} /></button></header>
    <div className="column-cards"><SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
      {tasks.map((task) => <TaskCard key={task.id} task={task} members={board.members} labels={board.labels} comments={board.comments.filter((comment) => comment.task_id === task.id).length} onOpen={() => onOpen(task.id)} disabled={board.busy} />)}
    </SortableContext>
    {!tasks.length && <div className="column-empty"><span>{column.id === 'done' ? <Sparkles size={22} /> : <Inbox size={22} />}</span><strong>{allCount ? 'No matching tasks' : column.id === 'done' ? 'Good things take shape' : 'A little space for what’s next'}</strong><p>{allCount ? 'Try a different filter.' : column.caption}</p></div>}
    <button className="add-task-button" onClick={() => onCreate(column.id)} disabled={board.busy}><Plus size={15} /> Add task</button></div>
  </section>;
}

export function KanbanBoard({ tasks, board, onOpen, onCreate }: { tasks: Task[]; board: BoardState; onOpen: (id: string) => void; onCreate: (status: Status) => void }) {
  const [active, setActive] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinates }));
  const start = (event: DragStartEvent) => setActive(board.tasks.find((task) => task.id === event.active.id) ?? null);
  const end = (event: DragEndEvent) => {
    setActive(null);
    if (!event.over || board.busy) return;
    const overId = String(event.over.id);
    const target = STATUSES.includes(overId as Status) ? overId as Status : board.tasks.find((task) => task.id === overId)?.status;
    if (target) void board.moveTask(String(event.active.id), target, STATUSES.includes(overId as Status) ? undefined : overId).catch(() => {});
  };
  return <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={start} onDragEnd={end} onDragCancel={() => setActive(null)}
    accessibility={{ screenReaderInstructions: { draggable: 'Press Space to pick up a task. Use arrow keys to move between tasks and columns. Press Space to drop, or Escape to cancel. You can also change status in task details.' },
      announcements: {
        onDragStart: ({ active: item }) => `Picked up ${board.tasks.find((task) => task.id === item.id)?.title ?? 'task'}.`,
        onDragOver: ({ over }) => over ? `Over ${STATUSES.includes(String(over.id) as Status) ? statusTitle(String(over.id) as Status) : board.tasks.find((task) => task.id === over.id)?.title ?? 'task'}.` : 'Outside the board.',
        onDragEnd: ({ over }) => over ? 'Task dropped. Saving your change.' : 'Move canceled.',
        onDragCancel: () => 'Move canceled.',
      } }}>
    <div className="board-grid">{COLUMNS.map((column) => <Column key={column.id} column={column} tasks={tasks.filter((task) => task.status === column.id)} allCount={board.tasks.filter((task) => task.status === column.id).length} board={board} onOpen={onOpen} onCreate={onCreate} />)}</div>
    <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>{active && <TaskCard task={active} members={board.members} labels={board.labels} comments={board.comments.filter((comment) => comment.task_id === active.id).length} onOpen={() => {}} overlay />}</DragOverlay>
  </DndContext>;
}

export function TaskList({ tasks, members, labels, onOpen }: { tasks: Task[]; members: Member[]; labels: Label[]; onOpen: (id: string) => void }) {
  if (!tasks.length) return <EmptyState icon={<Inbox size={24} />} title="Nothing here just yet">Add a task or adjust your filters to make room for what’s next.</EmptyState>;
  return <div className="task-list">{COLUMNS.map((column) => {
    const items = tasks.filter((task) => task.status === column.id);
    if (!items.length) return null;
    return <section key={column.id} aria-label={`${column.title} tasks`}><h2><span className="column-dot" style={{ background: column.color }} />{column.title}<span className="column-count">{items.length}</span></h2>{items.map((task) => {
      const member = members.find((item) => item.id === task.assignee_id);
      const due = dueInfo(task);
      return <button className="list-row" key={task.id} onClick={() => onOpen(task.id)} aria-label={`Open task: ${task.title}`}><span className="list-task-title">{task.title}<span className="list-labels">{labels.filter((label) => task.labelIds.includes(label.id)).map((label) => <span key={label.id} className="label-chip" style={{ color: readableColor(label.color), background: `${label.color}13` }}>{label.name}</span>)}</span></span><span className={`priority-indicator priority-${task.priority}`}>{task.priority}</span>{due && <span className={`due-badge due-${due.urgency}`}>{due.label}</span>}{member && <Avatar member={member} />}<ArrowRight size={16} /></button>;
    })}</section>;
  })}</div>;
}

export function BoardSkeleton() {
  return <div className="board-grid skeleton-board" role="status" aria-label="Loading your board"><span className="sr-only">Loading your board…</span>{COLUMNS.map((column) => <div className="board-column" key={column.id}><div className="skeleton skeleton-heading" />{[1, 2, 3].map((n) => <div className="skeleton-card" key={n}><div className="skeleton skeleton-tag" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /><div className="skeleton skeleton-footer" /></div>)}</div>)}</div>;
}