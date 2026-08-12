import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost } from '@/lib/api';

export const RightSidebar: React.FC = () => {
  const { user, openChatWithUser } = useAppStore();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [acceptedFriendIds, setAcceptedFriendIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setLoadingSuggestions(true);
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

        const chatRes = await apiGet('/api/chats');
        if (chatRes.success && chatRes.chats) {
          const myId = user?._id?.toString();
          const friendIds = chatRes.chats.flatMap((c: any) =>
            (c.participants || []).map((p: any) => p?.toString()).filter((id: string) => id && id !== myId)
          );
          setAcceptedFriendIds(friendIds);
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
      {/* Mini Profile */}
      <div className="flex items-center gap-3 px-1">
        <div className="story-avatar-ring shrink-0">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
            alt={user?.name}
            className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-slate-900"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.username}</p>
          <p className="text-xs text-slate-400 truncate">{user?.name}</p>
        </div>
      </div>

      {/* Suggested for You */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400">Suggested for you</h3>
          <span className="text-xs font-bold text-slate-900 dark:text-white hover:opacity-70 cursor-pointer">See All</span>
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
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{handle}</h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[110px]">{sug.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleFollow(sug)}
                      className={`text-xs font-bold shrink-0 ${isFriend
                          ? 'text-slate-500 dark:text-slate-400'
                          : isRequested
                            ? 'text-slate-400'
                            : 'text-[#0095F6] hover:text-[#1877c9]'
                        }`}
                    >
                      {isFriend ? 'Following' : isRequested ? 'Requested' : 'Follow'}
                    </button>
                    <button
                      onClick={() => openChatWithUser(sugId)}
                      title="Message"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all shrink-0"
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
    </aside>
  );
};
