
import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, X, BellOff } from 'lucide-react';
import { notificationApi } from '../services/api';

const TYPE_CONFIG: Record<string, { bg: string; dot: string }> = {
  appointment: { bg: 'bg-blue-50',   dot: 'bg-blue-500'   },
  prescription:{ bg: 'bg-green-50',  dot: 'bg-green-500'  },
  review:      { bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
  call:        { bg: 'bg-indigo-50', dot: 'bg-indigo-500' },
  system:      { bg: 'bg-slate-50',  dot: 'bg-slate-400'  },
};

interface Props { onUnreadChange?: (count: number) => void; }

const NotificationsPanel: React.FC<Props> = ({ onUnreadChange }) => {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread,        setUnread]        = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Poll every 30 seconds while panel is mounted
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data || []);
      setUnread(res.unread || 0);
      onUnreadChange?.(res.unread || 0);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(n => n.map(x => ({ ...x, read: true })));
      setUnread(0); onUnreadChange?.(0);
    } catch {}
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.delete(id);
      setNotifications(n => n.filter(x => x._id !== id));
    } catch {}
  };

  const markOneRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(n => n.map(x => x._id === id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000)     return 'Just now';
    if (diff < 3600000)   return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000)  return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2.5 bg-white/80 border border-slate-200 rounded-xl text-slate-500 hover:bg-white hover:text-blue-600 transition"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-14 w-96 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Notifications</h3>
              {unread > 0 && <p className="text-xs text-slate-400">{unread} unread</p>}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <BellOff className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                return (
                  <div key={n._id}
                    onClick={() => { if (!n.read) markOneRead(n._id); }}
                    className={`flex gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition group ${!n.read ? cfg.bg : ''}`}>
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${!n.read ? cfg.dot : 'bg-slate-200'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${n.read ? 'text-slate-500' : 'text-slate-900'}`}>{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                    <button onClick={e => deleteOne(n._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition flex-shrink-0 self-start">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
