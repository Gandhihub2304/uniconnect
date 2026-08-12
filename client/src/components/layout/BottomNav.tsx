'use client';

import React, { useEffect, useState } from 'react';
import { Home, Compass, Film, MessageCircle, User } from 'lucide-react';
import { useAppStore, NavTab } from '@/store/useAppStore';
import { apiGet } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, user } = useAppStore();
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    const refreshUnread = async () => {
      try {
        const data = await apiGet('/api/chats');
        if (data.success) {
          setUnreadChats(data.chats.reduce((sum: number, c: any) => sum + (c.unread || c.unreadCount || 0), 0));
        }
      } catch { /* silent */ }
    };
    refreshUnread();
    const socket = getSocket();
    socket?.on('new_message', refreshUnread);
    return () => { socket?.off('new_message', refreshUnread); };
  }, []);

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'reels', label: 'Reels', icon: Film },
    { id: 'chats', label: 'Messages', icon: MessageCircle, badge: unreadChats > 0 ? unreadChats : undefined },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around"
      style={{
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-default)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isProfile = item.id === 'profile';
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[52px] active:opacity-60 transition-opacity"
          >
            {isProfile ? (
              <div
                className="w-6 h-6 rounded-full overflow-hidden shrink-0"
                style={{ border: isActive ? '2px solid var(--accent)' : '2px solid transparent' }}
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                  alt="Profile"
                  className="w-full h-full object-cover block"
                />
              </div>
            ) : (
              <Icon
                className="w-6 h-6"
                strokeWidth={isActive ? 2.5 : 2}
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
              />
            )}
            {item.badge !== undefined && (
              <span
                className="absolute top-1 right-[calc(50%-16px)] min-w-[16px] h-4 px-1 text-[9px] font-black rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent)', color: '#fff', lineHeight: 1 }}
              >
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
