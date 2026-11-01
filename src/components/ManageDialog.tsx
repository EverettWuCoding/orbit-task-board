import { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { Modal, Avatar, Spinner } from './Primitives';
import { COLORS } from '../lib/types';
import type { BoardState } from '../hooks/useBoard';

export function ManageDialog({ kind, board, onClose }: { kind: 'members' | 'labels'; board: BoardState; onClose: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const isTeam = kind === 'members';
  const items = isTeam ? board.members : board.labels;
  const add = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (!name.trim()) { setError('Please enter a name.'); return; }
    try { await (isTeam ? board.addMember(name, color) : board.addLabel(name, color)); setName(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save. Please try again.'); }
  };
  return <Modal title={isTeam ? 'Good work takes good people' : 'A little more organized'} subtitle={isTeam ? 'Your team is a personal roster, not shared user accounts.' : 'Create labels that make sense for your work.'} onClose={onClose} busy={board.busy}>
    {board.error && <div className="inline-error" role="alert">{board.error}</div>}
    <div className="manage-content"><form className="manage-form" onSubmit={(event) => { void add(event); }}><label className="field-label" htmlFor="member-label-name">{isTeam ? 'Member name' : 'Label name'}</label><div className="manage-input"><input id="member-label-name" placeholder={isTeam ? 'e.g. Taylor Kim' : 'e.g. Customer feedback'} value={name} onChange={(event) => setName(event.target.value)} maxLength={isTeam ? 80 : 40} required data-autofocus disabled={board.busy} /><button type="submit" className="button primary" disabled={board.busy || !name.trim()}>{board.busy ? <Spinner /> : <><Plus size={16} /> Add</>}</button></div>
      <fieldset className="color-picker" disabled={board.busy}><legend>Choose a color</legend>{COLORS.map((value, index) => <label key={value} style={{ backgroundColor: value }} className={color === value ? 'selected' : ''}><input type="radio" name="color" value={value} aria-label={['Purple', 'Pink', 'Blue', 'Green', 'Amber', 'Slate'][index]} checked={color === value} onChange={() => setColor(value)} /></label>)}</fieldset>{error && <p className="form-error" role="alert">{error}</p>}
    </form><div className="manage-list">{items.length ? items.map((item) => <div className="manage-row" key={item.id}>{isTeam ? <Avatar member={item} size="large" /> : <span className="manage-label-icon" style={{ color: item.color, background: `${item.color}13` }}><Tag size={17} /></span>}<div><strong>{item.name}</strong><p>{isTeam ? `${board.tasks.filter((task) => task.assignee_id === item.id).length} assigned tasks` : `${board.tasks.filter((task) => task.labelIds.includes(item.id)).length} tagged tasks`}</p></div>
      {removing === item.id ? <div className="remove-confirm"><span>{isTeam ? 'Unassign and remove?' : 'Remove from all tasks?'}</span><button className="text-button danger-text" disabled={board.busy} onClick={() => { void (isTeam ? board.deleteMember(item.id) : board.deleteLabel(item.id)).then(() => setRemoving(null)).catch(() => setError('Could not remove this item.')); }}>Remove</button><button className="text-button" onClick={() => setRemoving(null)} disabled={board.busy}>Cancel</button></div> : <button className="icon-button" aria-label={`Remove ${item.name}`} onClick={() => setRemoving(item.id)} disabled={board.busy}><Trash2 size={16} /></button>}
    </div>) : <p className="conversation-empty">{isTeam ? 'Add your first team member above. Every workspace starts somewhere.' : 'Your first label is just a name and a color away.'}</p>}</div></div>
    <footer className="manage-footer"><p>{isTeam ? 'Members are labels for people, not invitations. Your tasks remain private to your guest session.' : 'Removing a label never removes the tasks it’s attached to.'}</p><button className="button secondary" onClick={onClose} disabled={board.busy}>Done</button></footer>
  </Modal>;
}