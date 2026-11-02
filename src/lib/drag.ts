import { closestCorners, pointerWithin } from '@dnd-kit/core';
import type { CollisionDetection, KeyboardCoordinateGetter } from '@dnd-kit/core';
import { STATUSES } from './types';
import type { Status, Task } from './types';

// Pointer drops must target what is actually under the pointer. Closest-corner
// matching can choose a nearby card even in a column's blank append area, or
// move a task when released outside the board. Prefer a nested card over its
// containing column; retain geometry-based navigation for keyboard sensors.
export const boardCollisionDetection: CollisionDetection = (args) => {
  if (!args.pointerCoordinates) return closestCorners(args);
  const hits = pointerWithin(args);
  const cards = hits.filter((hit) => !STATUSES.includes(String(hit.id) as Status));
  return cards.length ? cards : hits;
};

// The generic sortable getter includes parent-column droppables and fractional
// offsets from sibling transforms. Give a Kanban keyboard logical column/row
// navigation instead of treating the nested containers as one sortable list.
export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const { active, over, collisionRect, droppableRects, droppableContainers } = context;
  if (!active || !collisionRect || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) return;
  event.preventDefault();
  const columnFor = (id: string | number): Status | undefined => {
    if (STATUSES.includes(String(id) as Status)) return String(id) as Status;
    return (droppableContainers.get(id)?.data.current?.task as Task | undefined)?.status;
  };
  const currentColumn = columnFor(over?.id ?? active.id) ?? columnFor(active.id);
  if (!currentColumn) return;
  let targetColumn = currentColumn;
  const horizontal = event.code === 'ArrowLeft' || event.code === 'ArrowRight';
  if (horizontal) {
    const index = STATUSES.indexOf(currentColumn) + (event.code === 'ArrowRight' ? 1 : -1);
    const next = STATUSES[index];
    if (!next) return;
    targetColumn = next;
  }
  const cards = droppableContainers.getEnabled()
    .filter((container) => !STATUSES.includes(String(container.id) as Status) && columnFor(container.id) === targetColumn && droppableRects.has(container.id))
    .sort((a, b) => droppableRects.get(a.id)!.top - droppableRects.get(b.id)!.top);
  let targetId: string | number | undefined;
  if (horizontal) {
    targetId = [...cards].sort((a, b) => Math.abs(droppableRects.get(a.id)!.top - collisionRect.top) - Math.abs(droppableRects.get(b.id)!.top - collisionRect.top))[0]?.id ?? targetColumn;
  } else {
    const currentId = over && cards.some((card) => card.id === over.id) ? over.id : active.id;
    const index = cards.findIndex((card) => card.id === currentId);
    targetId = cards[index + (event.code === 'ArrowDown' ? 1 : -1)]?.id;
  }
  if (targetId === undefined) return;
  const rect = droppableRects.get(targetId);
  if (!rect) return;
  const emptyColumn = STATUSES.includes(String(targetId) as Status);
  return { x: rect.left + (rect.width - collisionRect.width) / 2,
    y: emptyColumn ? rect.top + 50 : rect.top + (rect.height - collisionRect.height) / 2 };
};