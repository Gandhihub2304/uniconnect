import React, { useEffect, useState } from 'react';
import { ChevronRight, Plus, MapPin, Clock, Users, UserPlus, UserCheck, Clock3, MessageCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost } from '@/lib/api';

export const RightSidebar: React.FC = () => {
  const { setActiveTab, startCall, user, openChatWithUser } = useAppStore();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [acceptedFriendIds, setAcceptedFriendIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setLoadingSuggestions(true);
        // Fetch real suggestions
        const sugRes = await apiGet('/api/auth/suggestions');
        if (sugRes.success && sugRes.users) {
          setSuggestions(sugRes.users);
        }

        // Fetch sent follow requests to persist "Requested ⏳" status on page refresh
        const sentRes = await apiGet('/api/notifications/sent');
        if (sentRes.success && sentRes.notifications) {
          const sentUserIds = sentRes.notifications.map((n: any) => n.userId);
          setRequestedIds(sentUserIds);
        }

        // Fetch real chats for online friends and friends status
        const chatRes = await apiGet('/api/chats');
        if (chatRes.success && chatRes.chats) {
          setOnlineFriends(chatRes.chats);
          // Extract participant IDs as plain strings, excluding own user ID
          const myId = user?._id?.toString();
          const friendIds = chatRes.chats.flatMap((c: any) =>
            (c.participants || []).map((p: any) => p?.toString()).filter((id: string) => id && id !== myId)
          );
          setAcceptedFriendIds(friendIds);
        }

        // Fetch real upcoming events
        const eventRes = await apiGet('/api/events');
        if (eventRes.success && eventRes.events) {
          setUpcomingEvents(eventRes.events.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch sidebar data:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSidebarData();
  }, [user?._id]);

  const handleToggleFollow = async (sug: any) => {
    const sugId = sug._id || sug.id?.toString();
    if (!sugId) return;

    if (acceptedFriendIds.includes(sugId)) {
      setAcceptedFriendIds(acceptedFriendIds.filter(i => i !== sugId));
      setRequestedIds(requestedIds.filter(i => i !== sugId));
    } else if (requestedIds.includes(sugId)) {
      setRequestedIds(requestedIds.filter(i => i !== sugId));
    } else {
      setRequestedIds(prev => [...prev, sugId]);
      try {
        await apiPost('/api/notifications', {
          userId: sugId,
          type: 'follow_request',
          text: 'sent you a friend follow request',
          fromUserId: user?._id,
          fromUserName: user?.name,
          fromUserAvatar: user?.avatar
        });
      } catch (err) {
        console.error('Failed to send follow request notification:', err);
      }
    }
  };

  return (
    <aside className="w-80 h-screen sticky top-0 hidden xl:flex flex-col gap-4 p-4 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto select-none">
      {/* Instagram-Style Suggested for You Card */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Suggested For You</h3>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">See All</span>
        </div>

        <div className="space-y-3">
          {loadingSuggestions ? (
            <div className="py-4 text-center text-xs text-slate-400 font-semibold animate-pulse">
              Finding accounts...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 font-semibold">
              No suggested accounts right now
            </div>
          ) : (
            suggestions.map((sug) => {
              const sugId = (sug._id || sug.id)?.toString();
              const isRequested = requestedIds.map(String).includes(sugId);
              const isFriend = acceptedFriendIds.map(String).includes(sugId);
              const handle = sug.username ? `@${sug.username}` : (sug.handle || '@user');

              return (
                <div key={sugId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={sug.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                      alt={sug.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{sug.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{handle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleFollow(sug)}
                      className={`px-3 py-1 font-bold text-xs rounded-xl transition-all flex items-center gap-1 shrink-0 ${isFriend
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isRequested
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                    >
                      {isFriend ? 'Friends ✓' : isRequested ? 'Requested ⏳' : 'Follow'}
                    </button>
                    <button
                      onClick={() => openChatWithUser(sugId)}
                      title="Message"
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Online Friends Widget */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Active Friends</h3>
          <button onClick={() => setActiveTab('chats')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            See all
          </button>
        </div>
        <div className="space-y-2.5">
          {onlineFriends.length === 0 ? (
            <div className="py-2 text-center text-xs text-slate-400 font-medium">
              No active friends right now
            </div>
          ) : (
            onlineFriends.map((chat) => (
              <div
                key={chat._id || chat.id}
                onClick={() => { setActiveTab('chats'); startCall(chat._id, chat.name, 'video'); }}
                className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700/60 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img src={chat.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'} alt={chat.name} className="w-8 h-8 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors truncate max-w-[120px]">
                    {chat.name}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-blue-500 opacity-80 shrink-0"></span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Events Widget */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Upcoming Events</h3>
          <button onClick={() => setActiveTab('events')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            See all
          </button>
        </div>

        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <div className="py-2 text-center text-xs text-slate-400 font-medium">
              No upcoming events scheduled
            </div>
          ) : (
            upcomingEvents.map((evt) => {
              const eventDate = evt.date ? new Date(evt.date) : new Date();
              const day = eventDate.getDate();
              const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

              return (
                <div key={evt._id || evt.id} className="flex items-start gap-3 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <div className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800 shrink-0">
                    <span className="text-base leading-none">{day}</span>
                    <span className="text-[9px] uppercase tracking-wider">{month}</span>
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{evt.title}</h5>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">{evt.time || '10:00 AM'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
