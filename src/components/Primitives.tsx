import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X, LoaderCircle } from 'lucide-react';
import { initials, readableColor } from '../lib/domain';
import type { Member } from '../lib/types';

export function Avatar({ member, size = 'small' }: { member: Pick<Member, 'name' | 'color'>; size?: 'small' | 'large' }) {
  return <span className={`avatar avatar-${size}`} style={{ backgroundColor: readableColor(member.color) }} title={member.name} aria-label={member.name}>{initials(member.name)}</span>;
}

export function Spinner({ label = 'Saving' }: { label?: string }) {
  return <span className="spinner"><LoaderCircle size={16} className="spin" aria-hidden="true" /><span>{label}</span></span>;
}

export function Modal({ title, subtitle, children, onClose, busy = false, className = '' }: {
  title: string; subtitle?: string; children: ReactNode; onClose: () => void; busy?: boolean; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    // React's autoFocus runs while the native dialog is still closed. Apply
    // the requested initial focus after showModal activates its focus scope.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => { dialog.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby={heading}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={(event) => {
      if (event.target !== ref.current || busy) return;
      const rect = ref.current.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <header className="modal-header"><div><h2 id={heading}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={onClose} disabled={busy}><X size={20} /></button></header>
    {children}
  </dialog>;
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{children}</p></div>;
}