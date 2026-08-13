'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Sun, Moon, MessageSquare, Heart } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { apiGet } from '@/lib/api';
import { onSocket, offSocket } from '@/lib/socket';

export const TopBar: React.FC = () => {
  const { theme, toggleTheme, setCommandPaletteOpen, setActiveTab, user, unreadChatsCount } = useAppStore();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [bellShaking, setBellShaking] = useState(false);

  const refreshNotifications = async () => {
    try {
      const notifData = await apiGet('/api/notifications');
      if (notifData.success) {
        setUnreadNotifications(notifData.notifications.filter((n: any) => !n.isRead).length);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!user) return;
    refreshNotifications();
    const onNewNotification = () => {
      setUnreadNotifications(prev => prev + 1);
      setBellShaking(true);
      setTimeout(() => setBellShaking(false), 700);
    };
    onSocket('new_notification', onNewNotification);
    return () => {
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
        className="min-h-[3.5rem] sticky top-0 z-20 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 shrink-0"
        style={{
          background: 'var(--bg-panel)',
          opacity: 0.98,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-default)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Search */}
        <div
          onClick={() => setCommandPaletteOpen(true)}
          className="flex-1 max-w-xl flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.99]"
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
          <span className="text-sm flex-1 select-none truncate" style={{ color: 'var(--text-muted)' }}>
            <span className="hidden sm:inline">Search people, communities, posts…</span>
            <span className="sm:hidden">Search</span>
          </span>
          <kbd
            className="px-2 py-0.5 text-[10px] font-bold rounded-md hidden sm:block"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)', color: 'var(--text-muted)' }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:bg-[var(--bg-input)]"
            title="Toggle theme"
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {theme === 'light'
              ? <Sun className="w-4 h-4" style={{ color: 'var(--accent-warning)' }} />
              : <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
          </button>

          {/* Messages — hidden on mobile, reachable via bottom nav instead */}
          <button
            onClick={() => setActiveTab('chats')}
            className="hidden sm:flex relative w-9 h-9 rounded-xl items-center justify-center transition-all"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatsCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 text-[9px] font-black rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent)', color: '#fff', lineHeight: 1 }}
              >
                {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={handleOpenNotifications}
            className={`relative w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:bg-[var(--bg-input)] ${bellShaking ? 'bell-shake' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Heart className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 text-[9px] font-black rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent-danger)', color: '#fff', lineHeight: 1 }}
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {/* Avatar — hidden on mobile, reachable via bottom nav instead */}
          <button
            onClick={() => setActiveTab('profile')}
            className="hidden sm:block ml-1 story-avatar-ring cursor-pointer transition-transform hover:scale-105"
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
