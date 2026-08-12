'use client';

import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Music, Volume2, VolumeX, Sparkles, Plus, X, Send, ChevronUp, ChevronDown, Clapperboard } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost } from '@/lib/api';
import { CreateReelModal } from './CreateReelModal';

export const ReelsView: React.FC = () => {
  const { user } = useAppStore();
  const [reels, setReels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);

  const fetchReels = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/reels');
      if (data.success && data.reels) {
        setReels(data.reels);
      }
    } catch (err) {
      console.error('Failed to fetch reels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const currentReel = reels[activeIndex];

  const fetchComments = async (reelId: string) => {
    try {
      const data = await apiGet(`/api/reels/${reelId}/comments`);
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch reel comments:', err);
    }
  };

  const handleToggleComments = () => {
    const next = !isCommentsOpen;
    setIsCommentsOpen(next);
    if (next && currentReel) fetchComments(currentReel._id);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentReel) return;

    try {
      const data = await apiPost(`/api/reels/${currentReel._id}/comments`, { text: commentText });
      if (data.success) {
        setComments(prev => [...prev, data.comment]);
        setReels(prev => prev.map(r => r._id === currentReel._id ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r));
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to add reel comment:', err);
    }
  };

  const toggleLike = async () => {
    if (!currentReel) return;
    try {
      const data = await apiPost(`/api/reels/${currentReel._id}/like`);
      if (data.success) {
        setReels(prev => prev.map(r => {
          if (r._id === currentReel._id) {
            return {
              ...r,
              likes: data.likes,
              likedBy: data.liked ? [...(r.likedBy || []), user?._id] : (r.likedBy || []).filter((id: string) => id !== user?._id)
            };
          }
          return r;
        }));
      }
    } catch (err) {
      console.error('Failed to toggle reel like:', err);
    }
  };

  const handleNextReel = () => {
    if (reels.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % reels.length);
    setIsCommentsOpen(false);
  };

  const handlePrevReel = () => {
    if (reels.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + reels.length) % reels.length);
    setIsCommentsOpen(false);
  };

  if (!isLoading && reels.length === 0) {
    return (
      <div className="max-w-md mx-auto h-[calc(100vh-9.5rem)] md:h-[calc(100vh-6.5rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Clapperboard className="w-8 h-8 text-blue-500" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">No reels yet</h3>
        <p className="text-xs text-slate-400">Be the first to share a reel with your circle!</p>
        <button
          onClick={() => setIsCreateReelOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Create Reel
        </button>
        <CreateReelModal
          isOpen={isCreateReelOpen}
          onClose={() => setIsCreateReelOpen(false)}
          onReelCreated={fetchReels}
        />
      </div>
    );
  }

  if (!currentReel) {
    return (
      <div className="max-w-md mx-auto h-[calc(100vh-9.5rem)] md:h-[calc(100vh-6.5rem)] flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
        Loading reels...
      </div>
    );
  }

  const isLiked = !!(currentReel.likedBy && user?._id && currentReel.likedBy.includes(user._id));

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-9.5rem)] md:h-[calc(100vh-6.5rem)] bg-slate-950 rounded-none md:rounded-2xl overflow-hidden border-0 md:border border-slate-800 relative shadow-xl flex flex-col justify-between p-4 select-none -mx-2.5 sm:-mx-4 md:mx-auto">
      {/* Background Video Media */}
      <video
        key={currentReel._id}
        src={currentReel.videoUrl}
        className="absolute inset-0 w-full h-full object-cover opacity-90"
        autoPlay
        loop
        muted={isMuted}
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/90"></div>

      {/* Top Header Sound & Create Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          onClick={() => setIsCreateReelOpen(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Create Reel
        </button>

        <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-slate-900/80 text-white rounded-full">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Vertical Navigation Buttons */}
      {reels.length > 1 && (
        <div className="absolute right-4 top-16 z-10 flex flex-col gap-2">
          <button onClick={handlePrevReel} className="p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-800">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={handleNextReel} className="p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-800">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right Side Action Column */}
      <div className="absolute right-4 bottom-20 z-10 flex flex-col items-center gap-5 text-white">
        <button onClick={toggleLike} className="flex flex-col items-center gap-1">
          <div className={`p-3 rounded-full bg-slate-900/70 backdrop-blur-md transition-all ${isLiked ? 'text-rose-500 bg-white' : 'hover:bg-slate-800'}`}>
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500' : ''}`} />
          </div>
          <span className="text-xs font-bold">{currentReel.likes || 0}</span>
        </button>

        <button onClick={handleToggleComments} className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-slate-900/70 backdrop-blur-md hover:bg-slate-800">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold">{currentReel.commentsCount || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-slate-900/70 backdrop-blur-md hover:bg-slate-800">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold">Share</span>
        </button>

        <button className="p-3 rounded-full bg-slate-900/70 backdrop-blur-md">
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Information Row */}
      <div className="relative z-10 space-y-2 max-w-[80%]">
        <div className="flex items-center gap-3">
          <img
            src={currentReel.userAvatar || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300"}
            alt={currentReel.userName}
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
          />
          <h4 className="text-sm font-bold text-white">{currentReel.userName}</h4>
          <button className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-xl">Follow</button>
        </div>
        {currentReel.caption && (
          <p className="text-xs text-slate-200 font-medium leading-relaxed">{currentReel.caption}</p>
        )}
        {currentReel.musicTrack && (
          <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold">
            <Music className="w-3.5 h-3.5 animate-spin" />
            <span className="truncate">{currentReel.musicTrack}</span>
          </div>
        )}
      </div>

      {/* Inline Reel Comments Drawer */}
      {isCommentsOpen && (
        <div className="absolute inset-x-0 bottom-0 bg-slate-900/95 border-t border-slate-800 rounded-t-2xl p-4 z-20 space-y-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white">Reel Comments ({comments.length})</h4>
            <button onClick={() => setIsCommentsOpen(false)} className="text-slate-400 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be the first!</p>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="text-xs text-slate-200 p-2 bg-slate-800 rounded-xl">
                  <span className="font-bold">{c.userName}: </span>{c.text}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-slate-800 px-3 py-2 text-xs text-white rounded-xl focus:outline-none"
            />
            <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <CreateReelModal
        isOpen={isCreateReelOpen}
        onClose={() => setIsCreateReelOpen(false)}
        onReelCreated={fetchReels}
      />
    </div>
  );
};
