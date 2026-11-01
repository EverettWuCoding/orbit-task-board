import { Component, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Orbit, LayoutDashboard, ChevronDown, ChevronRight, Plus, Search, SlidersHorizontal, List, LayoutGrid, UsersRound, Tag, ArrowUpRight, CheckCircle2, Clock3, Sparkles, CircleHelp, X, Menu, AlertCircle, RefreshCw, ShieldCheck, Command, RotateCcw, Inbox } from 'lucide-react';
import { createRepository } from './lib/supabase';
import { DEMO_STORAGE_KEY } from './lib/demo';
import { useBoard } from './hooks/useBoard';
import { EMPTY_FILTERS } from './lib/types';
import type { Filters, Status } from './lib/types';
import { boardStats, filterTasks } from './lib/domain';
import { KanbanBoard, TaskList, BoardSkeleton } from './components/Board';
import { TaskDialog } from './components/TaskDialog';
import { ManageDialog } from './components/ManageDialog';
import { Avatar, Modal, Spinner } from './components/Primitives';

const connection = createRepository();

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Orbit render error', error.message, info.componentStack); }
  render() { return this.state.failed ? <div className="fatal-error"><Orbit size={44} /><h1>Let’s get you back on track.</h1><p>Something unexpected happened. Your saved tasks have not been deleted.</p><button className="button primary" onClick={() => location.reload()}>Reload workspace</button></div> : this.props.children; }
}

function Workspace() {
  const board = useBoard(connection.repository);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [selection, setSelection] = useState<{ id: string } | { status: Status } | null>(null);
  const [manage, setManage] = useState<'members' | 'labels' | null>(null);
  const [help, setHelp] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const demo = connection.repository?.mode === 'demo';
  const tasks = filterTasks(board.tasks, filters);
  const stats = boardStats(board.tasks);
  const filtered = Object.keys(EMPTY_FILTERS).some((key) => filters[key as keyof Filters] !== EMPTY_FILTERS[key as keyof Filters]);
  const selectedTask = selection && 'id' in selection ? board.tasks.find((task) => task.id === selection.id) : undefined;
  const canEdit = !!board.userId && !board.loading && !board.busy;
  const newTask = (status: Status) => setSelection({ status });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable || event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return;
      if (event.key.toLowerCase() === 'n' && canEdit) { event.preventDefault(); setSelection({ status: 'todo' }); }
      if (event.key === '/') { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canEdit]);

  const sidebar = <>
    <a className="brand" href="/" aria-label="Orbit home"><span className="brand-mark"><Orbit size={25} /></span><span>orbit<span className="brand-period">.</span></span></a>
    <div className="workspace-switch"><span className="workspace-icon">P</span><div><strong>Personal workspace</strong><span>Your ideas, in motion</span></div><ShieldCheck size={15} /></div>
    <div className="sidebar-section-label">WORKSPACE</div>
    <nav aria-label="Workspace navigation"><button className={`nav-item ${filters.due === 'all' ? 'active' : ''}`} onClick={() => { setFilters(EMPTY_FILTERS); setView('board'); setNavOpen(false); }}><LayoutDashboard size={18} /><span>Project board</span><span className="nav-count">{stats.total}</span></button><button className={`nav-item ${filters.due === 'soon' ? 'active' : ''}`} onClick={() => { setFilters({ ...EMPTY_FILTERS, due: 'soon' }); setNavOpen(false); }}><Clock3 size={18} /><span>Coming up</span></button><button className={`nav-item ${filters.due === 'overdue' ? 'active' : ''}`} onClick={() => { setFilters({ ...EMPTY_FILTERS, due: 'overdue' }); setNavOpen(false); }}><AlertCircle size={18} /><span>Needs attention</span>{stats.overdue > 0 && <span className="attention-count">{stats.overdue}</span>}</button></nav>
    <div className="sidebar-section-label team-section-label">YOUR PEOPLE<button className="sidebar-icon" aria-label="Manage team members" onClick={() => { setNavOpen(false); setManage('members'); }} disabled={!canEdit}><Plus size={15} /></button></div>
    <div className="sidebar-members">{board.members.slice(0, 5).map((member) => <div className="sidebar-member" key={member.id}><Avatar member={member} /><span>{member.name}</span><span className="member-status" /></div>)}{!board.members.length && <p className="sidebar-empty">A fresh start. Add your people.</p>}{board.members.length > 5 && <span className="sidebar-extra">+{board.members.length - 5} more people</span>}<button className="sidebar-link" onClick={() => { setNavOpen(false); setManage('members'); }} disabled={!canEdit}><UsersRound size={15} /> Manage team</button></div>
    <div className="sidebar-section-label">ORGANIZE</div><button className="nav-item" onClick={() => { setNavOpen(false); setManage('labels'); }} disabled={!canEdit}><Tag size={17} /><span>Manage labels</span><span className="nav-count">{board.labels.length}</span></button>
    <div className="sidebar-bottom"><div className="sidebar-note"><Sparkles size={19} /><h3>A little progress,<br />every day.</h3><p>Big things happen one small task at a time.</p><button onClick={() => { setNavOpen(false); setHelp(true); }}>Make yourself at home <ArrowUpRight size={14} /></button></div><button className="help-link" onClick={() => { setNavOpen(false); setHelp(true); }}><CircleHelp size={16} /> A quick guide</button><div className="guest-profile"><Avatar member={{ name: 'Guest', color: '#7661db' }} size="large" /><div><strong>Guest workspace</strong><span>{board.userId ? `Private · ${board.userId.slice(0, 6)}` : 'Connecting securely…'}</span></div><span className="guest-dot" /></div></div>
  </>;

  return <div className="app-shell"><a href="#main-content" className="skip-link">Skip to board</a><aside className="sidebar">{sidebar}</aside>
    <main className="main-content" id="main-content"><header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-menu" aria-label="Open workspace navigation" onClick={() => setNavOpen(true)}><Menu size={21} /></button><span>Workspace</span><ChevronRight size={13} /><strong>Project board</strong></div><div className="topbar-right"><span className={`connection-badge ${demo ? 'demo-badge' : ''}`}><span />{demo ? 'Local demo' : connection.error ? 'Setup needed' : 'Private workspace'}</span><button className="icon-button" aria-label="Open quick guide" onClick={() => setHelp(true)}><CircleHelp size={18} /></button><Avatar member={{ name: 'Guest', color: '#7661db' }} /></div></header>
    <div className="workspace-content"><section className="page-heading"><div><div className="eyebrow"><span /> A SPACE FOR YOUR NEXT BIG THING</div><h1>Your work, <span>in motion.</span></h1><p>A little clarity. A little momentum. A whole lot of possibility.</p></div><button className="button primary new-task-button" onClick={() => newTask('todo')} disabled={!canEdit}><Plus size={18} /> New task <kbd>N</kbd></button></section>
      <section className="project-overview" aria-label="Board summary"><div className="project-identity"><div className="project-icon"><Orbit size={24} /></div><div><h2>The next chapter<span className="project-badge">Personal project</span></h2><p>Good ideas deserve a place to grow.</p></div></div><div className="project-summary"><div className="summary-item"><LayoutDashboard size={16} /><strong>{stats.total}</strong><span>tasks</span></div><div className="summary-item"><CheckCircle2 size={16} className="green-text" /><strong>{stats.completed}</strong><span>completed</span></div><button className={`summary-item overdue-summary ${stats.overdue ? 'has-overdue' : ''}`} onClick={() => setFilters((current) => ({ ...current, due: current.due === 'overdue' ? 'all' : 'overdue' }))} aria-pressed={filters.due === 'overdue'}><Clock3 size={16} /><strong>{stats.overdue}</strong><span>overdue</span></button></div><div className="progress-summary"><div><span>Making progress</span><strong>{stats.percentage}%</strong></div><div className="progress-track" role="progressbar" aria-label="Tasks completed" aria-valuenow={stats.percentage} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${stats.percentage}%` }} /></div></div></section>
      {demo && <div className="demo-notice"><Sparkles size={15} /><p><strong>A little preview of what’s possible.</strong> Demo tasks are saved only in this browser. Connect Supabase for secure cloud persistence.</p><button className="text-button" onClick={() => setResetOpen(true)} disabled={board.busy}><RotateCcw size={13} /> Reset demo</button></div>}
      {(connection.error || board.error) && <div className="error-banner" role="alert"><AlertCircle size={19} /><div><strong>Let’s get this sorted.</strong><p>{connection.error ?? board.error}</p></div>{!connection.error && <button className="button secondary" onClick={() => { void board.connect(); }} disabled={board.busy}><RefreshCw size={14} /> Retry loading</button>}{!connection.error && <button className="icon-button" aria-label="Dismiss error" onClick={board.dismissError}><X size={16} /></button>}</div>}
      <section className="board-toolbar" aria-label="Search and filter tasks"><div className="search-box"><Search size={16} /><input ref={searchRef} aria-label="Search tasks" placeholder="Find a little focus…" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />{filters.search ? <button className="icon-button" aria-label="Clear search" onClick={() => setFilters((current) => ({ ...current, search: '' }))}><X size={14} /></button> : <kbd>/</kbd>}</div><div className="toolbar-filters"><div className="filter-intro"><SlidersHorizontal size={15} /><span>Filter</span></div>
        <label className="filter-select"><span className="sr-only">Filter by priority</span><select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}><option value="all">Priority</option><option value="high">High priority</option><option value="normal">Normal priority</option><option value="low">Low priority</option></select><ChevronDown size={12} /></label>
        <label className="filter-select"><span className="sr-only">Filter by assignee</span><select value={filters.assignee} onChange={(event) => setFilters((current) => ({ ...current, assignee: event.target.value }))}><option value="all">Assignee</option><option value="unassigned">Unassigned</option>{board.members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select><ChevronDown size={12} /></label>
        <label className="filter-select"><span className="sr-only">Filter by label</span><select value={filters.label} onChange={(event) => setFilters((current) => ({ ...current, label: event.target.value }))}><option value="all">Label</option>{board.labels.map((label) => <option value={label.id} key={label.id}>{label.name}</option>)}</select><ChevronDown size={12} /></label>
      </div><div className="view-switch" aria-label="Board display"><button aria-label="Board view" aria-pressed={view === 'board'} onClick={() => setView('board')}><LayoutGrid size={15} /><span>Board</span></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16} /><span>List</span></button></div></section>
      <div className="board-caption"><span>{filtered ? `${tasks.length} of ${board.tasks.length} tasks${filters.due === 'overdue' ? ' · Overdue' : filters.due === 'soon' ? ' · Due within 2 days' : ''}` : 'Small steps, shared momentum.'}</span>{filtered ? <button className="text-button" onClick={() => setFilters(EMPTY_FILTERS)}><X size={12} /> Clear filters</button> : <span className="board-tip"><Command size={12} /> Drag to move · Click to explore</span>}</div>
      {board.loading ? <BoardSkeleton /> : connection.error || !board.userId ? <div className="connection-empty"><Inbox size={30} /><h2>Your workspace is waiting.</h2><p>Resolve the connection message above to bring your board to life.</p></div> : view === 'board' ? <KanbanBoard tasks={tasks} board={board} onOpen={(id) => setSelection({ id })} onCreate={newTask} /> : <TaskList tasks={tasks} members={board.members} labels={board.labels} onOpen={(id) => setSelection({ id })} />}
      <footer className="board-footer"><span><ShieldCheck size={13} /> Just yours. Always private.</span><span>Built for a little less busywork.</span>{board.busy && <Spinner label="Syncing changes" />}</footer>
    </div></main>
    {board.notice && <div className="toast" role="status"><CheckCircle2 size={17} />{board.notice}</div>}
    {selection && ('status' in selection || selectedTask) && <TaskDialog key={'id' in selection ? selection.id : `new-${selection.status}`} task={selectedTask} status={'status' in selection ? selection.status : undefined} board={board} onClose={() => setSelection(null)} />}
    {manage && <ManageDialog kind={manage} board={board} onClose={() => setManage(null)} />}
    {navOpen && <Modal title="Your workspace" onClose={() => setNavOpen(false)} className="nav-modal"><div className="mobile-sidebar-content">{sidebar}</div></Modal>}
    {help && <Modal title="Make yourself at home" subtitle="A small guide to keeping good work moving." onClose={() => setHelp(false)}><div className="help-content"><section><span>01</span><div><h3>Start with a small step</h3><p>Create a task with a title, then add context, priority, a due date, labels, and an assignee. Press <kbd>N</kbd> from the board for a quick start.</p></div></section><section><span>02</span><div><h3>Keep things in motion</h3><p>Drag a card by its grip to another column, or rearrange it within a column. On touchscreens, drag the grip; the rest of the board stays scrollable. With a keyboard, focus a grip, press Space, use arrows, then Space to drop. You can also update Status in task details.</p></div></section><section><span>03</span><div><h3>Find a little focus</h3><p>Search titles with <kbd>/</kbd>, combine filters, or switch to list view. “Coming up” shows incomplete tasks due today through the next two days; “Needs attention” shows overdue tasks.</p></div></section><section><span>04</span><div><h3>Your workspace stays yours</h3><p>{demo ? 'This is a local demo, not a Supabase guest account. Changes stay in this browser. For the assessment, configure Supabase using the setup guide.' : 'Supabase creates a guest account automatically and remembers it in this browser. Another browser gets a separate private workspace. Clearing site storage or ending an incognito session loses access to this guest account.'} Team members are a personal roster, not shared logins. Comments and activity belong to the guest who owns the task.</p></div></section></div><footer className="manage-footer"><span /> <button className="button primary" onClick={() => setHelp(false)}>Let’s get moving <ArrowUpRight size={15} /></button></footer></Modal>}
    {resetOpen && <Modal title="A fresh start?" subtitle="This resets the local demo only." onClose={() => setResetOpen(false)}><div className="help-content"><p>Your local tasks, team members, labels, comments, and activity will be replaced with the sample workspace. This cannot be undone and never affects Supabase.</p></div><footer className="manage-footer"><button className="button secondary" onClick={() => setResetOpen(false)}>Keep my work</button><button className="button danger" onClick={() => { try { localStorage.removeItem(DEMO_STORAGE_KEY); location.reload(); } catch { setResetOpen(false); } }}>Reset local demo</button></footer></Modal>}
  </div>;
}

export function App() { return <ErrorBoundary><Workspace /></ErrorBoundary>; }