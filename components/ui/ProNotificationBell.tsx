'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  subscribeClientNotifs,
  markNotifRead,
  clearClientNotif,
  type ClientNotif,
} from '@/lib/rtdb/client-notifications';

const STATUT_COLORS: Record<string, string> = {
  'En attente': '#F5A623',
  'Validee':    '#3DBDB0',
  'Expediee':   '#3b82f6',
  'Livree':     '#22c55e',
  'Annulee':    '#ef4444',
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export default function ProNotificationBell() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<ClientNotif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeClientNotifs(user.uid, setNotifs);
  }, [user?.uid]);

  // Ferme le dropdown si clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifs.filter(n => !n.read).length;

  const handleOpen = () => {
    setOpen(o => !o);
    // Marque tout comme lu à l'ouverture
    if (!open && user?.uid) {
      notifs.filter(n => !n.read).forEach(n => markNotifRead(user.uid, n.id).catch(() => {}));
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (user?.uid) clearClientNotif(user.uid, id).catch(() => {});
  };

  if (!user?.uid) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 text-ink-secondary hover:text-sv-primary transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {notifs.length > 0 && (
              <button
                onClick={() => notifs.forEach(n => clearClientNotif(user.uid, n.id).catch(() => {}))}
                className="text-xs text-ink-secondary hover:text-red-500 transition-colors cursor-pointer"
              >
                Tout effacer
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-ink-secondary">
              Aucune notification
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifs.map(n => (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${!n.read ? 'bg-blue-50/50' : 'hover:bg-sv-grey-light/40'}`}
                >
                  {/* Point coloré statut */}
                  <span
                    className="mt-1 shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUT_COLORS[n.statut] ?? '#94a3b8' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink leading-snug">
                      Commande #{n.orderId.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-ink-secondary mt-0.5">{n.label}</p>
                    <p className="text-[11px] text-ink-secondary/60 mt-1">{timeAgo(n.at)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="shrink-0 text-ink-secondary/40 hover:text-red-400 transition-colors text-xs cursor-pointer mt-0.5"
                    aria-label="Supprimer"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
