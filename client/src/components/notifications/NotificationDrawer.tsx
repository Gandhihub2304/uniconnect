'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X, Heart, MessageCircle, UserPlus, Calendar, AtSign, CheckCheck, UserCheck } from 'lucide-react';
import { apiGet, apiPatch, apiPost, apiDelete } from '@/lib/api';
import { onSocket, offSocket } from '@/lib/socket';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/notifications');
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Use onSocket/offSocket so listener registers even before socket connects
  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      setNotifications(prev => {
        // Avoid duplicates
        if (prev.find(n => n._id === notification._id)) return prev;
        return [notification, ...prev];
      });
    };
    onSocket('new_notification', handleNewNotification);
    return () => {
      offSocket('new_notification', handleNewNotification);
    };
  }, []);

  const markAllRead = async () => {
    try {
      const data = await apiPatch('/api/notifications/read-all');
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleNotificationClick = async (item: any) => {
    if (item.isRead) return;
    try {
      const data = await apiPatch(`/api/notifications/${item._id}/read`);
      if (data.success) {
        setNotifications(prev => prev.map(n => n._id === item._id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleAcceptRequest = async (item: any) => {
    try {
      await apiPost('/api/chats/accept-friend', { fromUserId: item.fromUserId, fromUserName: item.fromUserName });
      // Remove the follow_request notification from list and mark accepted
      setAcceptedIds(prev => [...prev, item._id]);
      setNotifications(prev => prev.filter(n => n._id !== item._id));
    } catch (err) {
      console.error('Failed to accept friend request:', err);
    }
  };

  const handleDeleteRequest = async (item: any) => {
    try {
      await apiDelete(`/api/notifications/${item._id}`);
      setNotifications(prev => prev.filter(n => n._id !== item._id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case 'comment': return <MessageCircle className="w-3.5 h-3.5 text-blue-500" />;
      case 'rsvp': return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
      case 'mention': return <AtSign className="w-3.5 h-3.5 text-cyan-500" />;
      case 'follow_request': return <UserPlus className="w-3.5 h-3.5 text-blue-500" />;
      case 'follow': return <UserCheck className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <UserPlus className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-4 flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">Notifications</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-xl font-bold ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-xl font-bold ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                Unread
              </button>
            </div>
            <button onClick={markAllRead} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" /> Mark read
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1">
          {isLoading ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400">
              {filter === 'unread' ? "You're all caught up! 🎉" : 'No notifications yet'}
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item._id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3 rounded-2xl flex flex-col gap-2 transition-all cursor-pointer ${
                  item.isRead ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-blue-50/70 dark:bg-slate-800 border border-blue-100 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={item.fromUserAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
                      alt={item.fromUserName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 p-0.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
                      {getIcon(item.type)}
                    </span>
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="text-slate-900 dark:text-slate-100 font-medium leading-tight">
                      <span className="font-bold">{item.fromUserName}</span> {item.text}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{timeAgo(item.createdAt)}</span>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 mt-1 rounded-full bg-blue-600 shrink-0"></span>
                  )}
                </div>

                {/* Follow Request Action Buttons */}
                {item.type === 'follow_request' && !acceptedIds.includes(item._id) && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAcceptRequest(item); }}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      Confirm ✅
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteRequest(item); }}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                    >
                      Delete ❌
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl">
          Close Notifications
        </button>
      </div>
    </div>
  );
};
