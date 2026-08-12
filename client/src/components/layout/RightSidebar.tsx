import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost } from '@/lib/api';

export const RightSidebar: React.FC = () => {
  const { user, login, token, openChatWithUser } = useAppStore();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setLoadingSuggestions(true);
        const sugRes = await apiGet('/api/auth/suggestions');
        if (sugRes.success && sugRes.users) {
          setSuggestions(sugRes.users);
        }
      } catch (err) {
        console.error('Failed to fetch sidebar data:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSidebarData();
  }, [user?._id]);

  const handleToggleFollow = async (sugId: string) => {
    try {
      setLoadingId(sugId);
      const data = await apiPost(`/api/auth/follow/${sugId}`);
      if (data.success && data.user) {
        login(data.user, token!);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setLoadingId(null);
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
              const isFollowing = (user?.following || []).map(String).includes(sugId);
              const isRequested = (user?.sentFollowRequestIds || []).map(String).includes(sugId);
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
                      onClick={() => handleToggleFollow(sugId)}
                      disabled={loadingId === sugId}
                      className={`text-xs font-bold shrink-0 disabled:opacity-50 ${isFollowing
                          ? 'text-slate-500 dark:text-slate-400'
                          : isRequested
                            ? 'text-slate-400'
                            : 'text-[#0095F6] hover:text-[#1877c9]'
                        }`}
                    >
                      {isFollowing ? 'Following' : isRequested ? 'Requested' : 'Follow'}
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
