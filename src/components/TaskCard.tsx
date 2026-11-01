import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import { CalendarDays, Check, GripVertical, MessageCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { Task, Member, Label } from '../lib/types';
import { dueInfo, readableColor } from '../lib/domain';
import { Avatar } from './Primitives';

interface CardProps {
  task: Task; members: Member[]; labels: Label[]; comments: number; onOpen: () => void; disabled?: boolean; overlay?: boolean;
}

export function TaskCard(props: CardProps) {
  // An overlay is visual only. Registering it with useSortable duplicates the
  // source ID and corrupts the keyboard sensor's droppable registry.
  return props.overlay ? <CardVisual {...props} /> : <SortableCard {...props} />;
}

function SortableCard(props: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task.id, data: { task: props.task }, disabled: props.disabled });
  return <CardVisual {...props} nodeRef={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} isDragging={isDragging}
    handle={<button className="drag-handle" {...attributes} {...listeners} aria-label={`Drag ${props.task.title}`} disabled={props.disabled} title="Drag to move · Space to pick up, arrows to move, Space to drop"><GripVertical size={16} /></button>} />;
}

function CardVisual({ task, members, labels, comments, onOpen, disabled = false, overlay = false, nodeRef, style, isDragging = false, handle }: CardProps & {
  nodeRef?: (node: HTMLElement | null) => void; style?: CSSProperties; isDragging?: boolean; handle?: ReactNode;
}) {
  const member = members.find((item) => item.id === task.assignee_id);
  const taskLabels = labels.filter((label) => task.labelIds.includes(label.id));
  const due = dueInfo(task);
  const PriorityIcon = task.priority === 'high' ? ArrowUp : task.priority === 'low' ? ArrowDown : Minus;
  return <article ref={nodeRef} data-testid="task-card" data-task-id={task.id} aria-hidden={overlay || undefined}
    className={`task-card ${isDragging ? 'is-dragging' : ''} ${overlay ? 'drag-overlay' : ''} ${task.status === 'done' ? 'completed-card' : ''}`}
    style={style}>
    <div className="card-top"><div className="card-labels">{taskLabels.map((label) => <span className="label-chip" key={label.id} style={{ color: readableColor(label.color), backgroundColor: `${label.color}13` }}>{label.name}</span>)}{!taskLabels.length && <span className="task-reference">TASK · {task.id.slice(0, 4).toUpperCase()}</span>}</div>
      {handle ?? <span className="drag-handle"><GripVertical size={16} /></span>}
    </div>
    <button className="card-content" onClick={onOpen} aria-label={`Open task: ${task.title}`} disabled={disabled || overlay}>
      <h3>{task.status === 'done' && <span className="task-check"><Check size={12} strokeWidth={3} /></span>}{task.title}</h3>
      {task.description && <p>{task.description}</p>}
    </button>
    <footer className="card-footer"><div className="card-meta"><span className={`priority-indicator priority-${task.priority}`} title={`${task.priority} priority`} aria-label={`${task.priority} priority`}><PriorityIcon size={13} /><span>{task.priority}</span></span>
      {due && <span className={`due-badge due-${due.urgency}`} title={`Due ${due.full}${due.urgency === 'overdue' ? ' — overdue' : ''}`}><CalendarDays size={12} /><span>{due.label}</span></span>}
    </div><div className="card-people">{comments > 0 && <span className="comment-count" aria-label={`${comments} comments`}><MessageCircle size={13} />{comments}</span>}{member ? <Avatar member={member} /> : <span className="unassigned-avatar" title="Unassigned">—</span>}</div></footer>
  </article>;
}