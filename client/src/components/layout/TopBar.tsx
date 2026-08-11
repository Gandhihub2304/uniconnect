'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Sun, Moon, MessageSquare, Bell } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { apiGet } from '@/lib/api';
import { onSocket, offSocket } from '@/lib/socket';

export const TopBar: React.FC = () => {
  const { theme, toggleTheme, setCommandPaletteOpen, setActiveTab, user } = useAppStore();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [bellShaking, setBellShaking] = useState(false);

  const refreshCounts = async () => {
    try {
      const [chatsData, notifData] = await Promise.all([
        apiGet('/api/chats'),
        apiGet('/api/notifications'),
      ]);
      if (chatsData.success) {
        setUnreadChats(chatsData.chats.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0));
      }
      if (notifData.success) {
        setUnreadNotifications(notifData.notifications.filter((n: any) => !n.isRead).length);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!user) return;
    refreshCounts();
    const onNewMessage = () => refreshCounts();
    const onNewNotification = () => {
      setUnreadNotifications(prev => prev + 1);
      setBellShaking(true);
      setTimeout(() => setBellShaking(false), 700);
    };
    onSocket('new_message', onNewMessage);
    onSocket('new_notification', onNewNotification);
    return () => {
      offSocket('new_message', onNewMessage);
      offSocket('new_notification', onNewNotification);
    };
  }, [user?._id]);

  const handleOpenNotifications = () => {
    setIsNotificationOpen(true);
    setUnreadNotifications(0);
  };

  return (
    <>
      <header
        className="h-14 sticky top-0 z-20 px-4 flex items-center justify-between gap-4 shrink-0"
        style={{
          background: 'var(--bg-panel)',
          opacity: 0.98,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {/* Search */}
        <div
          onClick={() => setCommandPaletteOpen(true)}
          className="flex-1 max-w-xl flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px var(--accent-dim)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm flex-1 select-none" style={{ color: 'var(--text-muted)' }}>
            Search people, communities, posts…
          </span>
          <kbd
            className="px-2 py-0.5 text-[10px] font-bold rounded-md hidden sm:block"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)', color: 'var(--text-muted)' }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            title="Toggle theme"
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {theme === 'light'
              ? <Sun className="w-4 h-4" style={{ color: 'var(--accent-warning)' }} />
              : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>

          {/* Messages */}
          <button
            onClick={() => setActiveTab('chats')}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChats > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 text-[9px] font-black rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent)', color: '#fff', lineHeight: 1 }}
              >
                {unreadChats > 9 ? '9+' : unreadChats}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={handleOpenNotifications}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${bellShaking ? 'bell-shake' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 text-[9px] font-black rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent-danger)', color: '#fff', lineHeight: 1 }}
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {/* Avatar */}
          <button
            onClick={() => setActiveTab('profile')}
            className="ml-1 story-avatar-ring cursor-pointer transition-transform hover:scale-105"
            style={{ borderRadius: '9999px' }}
            title="My Profile"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover block"
              style={{ border: '2px solid var(--bg-panel)' }}
            />
          </button>
        </div>
      </header>

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
};
