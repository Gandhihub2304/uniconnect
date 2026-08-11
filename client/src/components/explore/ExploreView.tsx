'use client';

import React, { useEffect, useState } from 'react';
import { Compass, Heart, MessageCircle, Hash, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost } from '@/lib/api';

export const ExploreView: React.FC = () => {
  const { user } = useAppStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExplore = async (hashtag?: string | null) => {
    try {
      setIsLoading(true);
      const query = hashtag ? `?hashtag=${encodeURIComponent(hashtag)}` : '';
      const data = await apiGet(`/api/posts/explore${query}`);
      if (data.success) {
        setPosts(data.posts || []);
        if (!hashtag) setTrendingHashtags(data.trendingHashtags || []);
      }
    } catch (err) {
      console.error('Failed to fetch explore feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExplore(activeHashtag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHashtag]);

  const handleLike = async (postId: string) => {
    try {
      const data = await apiPost(`/api/posts/${postId}/like`);
      if (data.success) {
        setPosts(prev => prev.map(p => p._id === postId
          ? { ...p, likes: data.likes, likedBy: data.liked ? [...(p.likedBy || []), user?._id] : (p.likedBy || []).filter((id: string) => id !== user?._id) }
          : p));
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          Explore <Compass className="w-4 h-4 text-blue-500" />
        </h1>
        <p className="text-xs text-slate-500 font-medium">Trending posts and hashtags from the last 7 days</p>
      </div>

      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveHashtag(null)}
            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
              !activeHashtag ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> All Trending
          </button>
          {trendingHashtags.map((h) => (
            <button
              key={h.tag}
              onClick={() => setActiveHashtag(h.tag)}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                activeHashtag === h.tag ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {h.tag} <span className="opacity-70">({h.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      {isLoading ? (
        <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">Loading trending posts...</div>
      ) : posts.length === 0 ? (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
          <Hash className="w-7 h-7 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {activeHashtag ? `No posts found for ${activeHashtag}` : 'Nothing trending yet'}
          </h3>
          <p className="text-xs text-slate-400">Posts with the most likes and comments this week will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {posts.map((post) => {
            const isLiked = post.likedBy?.includes(user?._id);
            return (
              <div key={post._id} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-sm hover:border-blue-500 transition-all">
                <div className="flex items-center gap-2.5">
                  <img src={post.userAvatar} alt={post.userName} className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{post.userName}</p>
                    <p className="text-[10px] text-slate-400">@{post.userUsername}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed line-clamp-3">{post.content}</p>

                {post.media && post.media.length > 0 && (
                  <div className="h-40 rounded-xl overflow-hidden">
                    <img src={post.media[0]} alt="Post media" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-4 pt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{post.likes || 0}</span>
                  </button>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.commentsCount || 0}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
