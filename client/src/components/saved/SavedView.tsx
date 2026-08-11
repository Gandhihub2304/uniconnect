'use client';

import React, { useEffect, useState } from 'react';
import { Bookmark, Heart, MessageCircle, Share2, Trash2, Send } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost } from '@/lib/api';

export const SavedView: React.FC = () => {
  const { user, setActiveTab } = useAppStore();
  const [filterType, setFilterType] = useState<'all' | 'media' | 'text'>('all');
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const fetchSaved = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/saved');
      if (data.success && data.posts) {
        setSavedPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleUnsave = async (id: string) => {
    try {
      await apiPost(`/api/posts/${id}/save`);
      setSavedPosts((prev) => prev.filter((item) => item._id !== id));
      showToast('Item removed from Saved Bookmarks');
    } catch (err) {
      console.error('Failed to unsave post:', err);
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      const data = await apiPost(`/api/posts/${id}/like`);
      if (data.success) {
        setSavedPosts((prev) => prev.map((item) => item._id === id
          ? {
              ...item,
              likes: data.likes,
              likedBy: data.liked ? [...(item.likedBy || []), user?._id] : (item.likedBy || []).filter((uid: string) => uid !== user?._id),
            }
          : item));
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const fetchComments = async (id: string) => {
    try {
      const data = await apiGet(`/api/posts/${id}/comments`);
      if (data.success) setComments((prev) => ({ ...prev, [id]: data.comments }));
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleToggleComments = (id: string) => {
    const next = openCommentsId === id ? null : id;
    setOpenCommentsId(next);
    if (next) fetchComments(id);
  };

  const handleAddComment = async (id: string) => {
    const text = commentInputs[id];
    if (!text || !text.trim()) return;

    try {
      const data = await apiPost(`/api/posts/${id}/comments`, { text });
      if (data.success) {
        setComments((prev) => ({ ...prev, [id]: [...(prev[id] || []), data.comment] }));
        setSavedPosts((prev) => prev.map((item) => item._id === id ? { ...item, commentsCount: (item.commentsCount || 0) + 1 } : item));
        setCommentInputs({ ...commentInputs, [id]: '' });
        showToast('Comment added! 💬');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleShare = (id: string) => {
    navigator.clipboard?.writeText?.(`${window.location.origin}/posts/${id}`);
    showToast('Saved link copied to clipboard! 🔗');
  };

  const filteredItems = savedPosts.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'media') return item.media && item.media.length > 0;
    return !item.media || item.media.length === 0;
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-xs font-bold text-slate-400 animate-pulse">
        Loading your saved bookmarks...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Saved Bookmarks <Bookmark className="w-4 h-4 text-blue-500 fill-blue-500" />
          </h1>
          <p className="text-xs text-slate-500 font-medium">Your private collection of saved posts and media</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-600 font-bold text-xs rounded-xl">
          {savedPosts.length} Saved Items
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['all', 'media', 'text'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
              filterType === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {f === 'all' ? `All Saved (${savedPosts.length})` : f === 'media' ? 'With Media' : 'Text Only'}
          </button>
        ))}
      </div>

      {/* Saved Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
          <Bookmark className="w-7 h-7 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No saved items in this filter</h3>
          <p className="text-xs text-slate-400">Save posts from your feed to view them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isLiked = item.likedBy?.includes(user?._id);
            const itemComments = comments[item._id] || [];
            return (
              <div key={item._id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm hover:border-blue-500 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={item.user?.avatar || item.userAvatar} alt={item.user?.name || item.userName} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.user?.name || item.userName}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnsave(item._id)}
                      title="Remove from Saved"
                      className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{item.content}</p>

                  {item.media && item.media.length > 0 && (
                    <div className="h-44 rounded-2xl overflow-hidden relative">
                      <img src={item.media[0]} alt={item.content} className="w-full h-full object-cover hover:scale-[1.01] transition-transform" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleLike(item._id)}
                        className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'}`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{item.likes}</span>
                      </button>

                      <button
                        onClick={() => handleToggleComments(item._id)}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{item.commentsCount || 0}</span>
                      </button>

                      <button
                        onClick={() => handleShare(item._id)}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveTab('home')}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      Go to Feed →
                    </button>
                  </div>

                  {/* Inline Comment Drawer */}
                  {openCommentsId === item._id && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 text-xs border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                      {itemComments.length > 0 && (
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {itemComments.map((c) => (
                            <div key={c._id} className="p-1.5 bg-white dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200">
                              <span className="font-bold">{c.userName}: </span>{c.text}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentInputs[item._id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [item._id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(item._id)}
                          placeholder="Write a comment..."
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-xs focus:outline-none border border-slate-200 dark:border-slate-700"
                        />
                        <button onClick={() => handleAddComment(item._id)} className="p-1.5 bg-blue-600 text-white rounded-xl">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
