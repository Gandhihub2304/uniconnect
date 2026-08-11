'use client';

import React, { useEffect, useState } from 'react';
import {
  Home, MessageSquare, Sparkles, Rss, Film,
  Users, Calendar, Clock, MapPin, Bookmark,
  User, Settings, LogOut, Compass
} from 'lucide-react';
import { useAppStore, NavTab } from '@/store/useAppStore';
import { apiGet } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export const LeftSidebar: React.FC = () => {
  const { activeTab, setActiveTab, user, logout } = useAppStore();
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    const refreshUnread = async () => {
      try {
        const data = await apiGet('/api/chats');
        if (data.success) {
          setUnreadChats(data.chats.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0));
        }
      } catch { /* silent */ }
    };
    refreshUnread();
    const socket = getSocket();
    socket?.on('new_message', refreshUnread);
    return () => { socket?.off('new_message', refreshUnread); };
  }, []);

  const navGroups: { label: string; items: { id: NavTab; label: string; icon: React.ElementType; badge?: number | string }[] }[] = [
    {
      label: 'Main',
      items: [
        { id: 'home',    label: 'Home',     icon: Home },
        { id: 'chats',   label: 'Messages', icon: MessageSquare, badge: unreadChats > 0 ? unreadChats : undefined },
        { id: 'stories', label: 'Stories',  icon: Sparkles },
        { id: 'feed',    label: 'Feed',     icon: Rss },
        { id: 'reels',   label: 'Reels',    icon: Film },
      ],
    },
    {
      label: 'Discover',
      items: [
        { id: 'communities', label: 'Communities', icon: Users },
        { id: 'explore',     label: 'Explore',     icon: Compass },
        { id: 'events',      label: 'Events',      icon: Calendar },
        { id: 'nearby',      label: 'Nearby',      icon: MapPin },
      ],
    },
    {
      label: 'Personal',
      items: [
        { id: 'memories', label: 'Memories', icon: Clock },
        { id: 'saved',    label: 'Saved',    icon: Bookmark },
        { id: 'profile',  label: 'Profile',  icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className="w-60 h-screen sticky top-0 flex flex-col z-30 select-none"
      style={{ background: 'var(--bg-panel)', borderRight: '1px solid var(--border-default)' }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-5 py-5 cursor-pointer shrink-0"
        onClick={() => setActiveTab('home')}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0"
          style={{ background: 'linear-gradient(135deg, #0066ff, #00d4ff)', boxShadow: '0 4px 16px rgba(0,102,255,0.4)' }}
        >
          UC
        </div>
        <span className="text-base font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          UniConnect
        </span>
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {navGroups.map(group => (
          <div key={group.label}>
            <p
              className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-faint)' }}
            >
              {group.label}
            </p>
            <nav className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                    style={{
                      background: isActive ? 'var(--accent-dim)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-input)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                        style={{ height: '55%', background: 'var(--accent)' }}
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                        style={{ background: 'var(--accent)', color: '#fff', minWidth: '20px', textAlign: 'center' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User footer */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div className="story-avatar-ring shrink-0 cursor-pointer" onClick={() => setActiveTab('profile')}>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover block"
              style={{ border: '2px solid var(--bg-panel)' }}
            />
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setActiveTab('profile')}>
            <h4 className="text-xs font-bold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'Manoj Gandhi'}
            </h4>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
              @{user?.username || 'manoj_28'}
            </p>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-danger)'; (e.currentTarget as HTMLElement).style.background = 'rgba(225,29,72,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
