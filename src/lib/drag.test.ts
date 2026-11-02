import { describe, expect, it } from 'vitest';
import type { CollisionDetection, DroppableContainer } from '@dnd-kit/core';
import { boardCollisionDetection } from './drag';

type Arguments = Parameters<CollisionDetection>[0];
const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height });
function fixture(pointer: Arguments['pointerCoordinates']): Arguments {
  const rects = new Map([
    ['todo', rect(0, 0, 200, 500)], ['source', rect(10, 50, 180, 90)],
    ['done', rect(220, 0, 200, 500)], ['tall-card', rect(230, 50, 180, 190)], ['short-card', rect(230, 250, 180, 60)],
    ['in_review', rect(440, 0, 200, 300)],
  ]);
  const containers: DroppableContainer[] = [...rects].map(([id, bounds]) => ({
    id, key: id, disabled: false, node: { current: null }, rect: { current: bounds }, data: { current: {} },
  }));
  return { active: { id: 'source', data: { current: {} }, rect: { current: { initial: rects.get('source')!, translated: null } } },
    collisionRect: rect(230, 50, 180, 90), droppableRects: rects, droppableContainers: containers, pointerCoordinates: pointer };
}
describe('nested Kanban hit testing', () => {
  it('prefers the card under the pointer over its containing column', () => {
    expect(boardCollisionDetection(fixture({ x: 400, y: 70 })).map((hit) => hit.id)).toEqual(['tall-card']);
  });
  it('targets the column append area instead of the nearest card', () => {
    expect(boardCollisionDetection(fixture({ x: 400, y: 450 })).map((hit) => hit.id)).toEqual(['done']);
  });
  it('supports empty columns', () => {
    expect(boardCollisionDetection(fixture({ x: 500, y: 80 })).map((hit) => hit.id)).toEqual(['in_review']);
  });
  it('does not move the nearest card when the pointer leaves the board', () => {
    expect(boardCollisionDetection(fixture({ x: 700, y: 70 }))).toEqual([]);
  });
  it('uses pointer position even when the dragged card overlaps a different row', () => {
    expect(boardCollisionDetection(fixture({ x: 400, y: 280 }))[0]?.id).toBe('short-card');
  });
  it('retains geometry-based targeting for keyboard dragging', () => {
    expect(boardCollisionDetection(fixture(null))[0]?.id).toBe('tall-card');
  });
});