'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Send, MapPin, Music, Trash2, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiDelete, apiPost } from '@/lib/api';

interface StoryViewerModalProps {
  story: any | null;
  isOpen: boolean;
  onClose: () => void;
  onStoryDeleted?: () => void;
  onStoryUpdated?: (story: any) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ story, isOpen, onClose, onStoryDeleted, onStoryUpdated }) => {
  const { user } = useAppStore();
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingHighlight, setIsTogglingHighlight] = useState(false);
  const [localStory, setLocalStory] = useState<any | null>(story);

  useEffect(() => {
    setLocalStory(story);
  }, [story]);

  if (!isOpen || !story) return null;

  const activeStory = localStory || story;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplies(prev => [...prev, replyText]);
    setReplyText('');
  };

  const isOwnStory = activeStory.userId === user?._id;

  const handleDeleteStory = async () => {
    setIsDeleting(true);
    try {
      await apiDelete(`/api/stories/${activeStory._id}`);
      if (onStoryDeleted) onStoryDeleted();
      onClose();
    } catch (err) {
      console.error('Failed to delete story:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleLike = async () => {
    try {
      await apiPost(`/api/stories/${activeStory._id}/like`);
      setLiked(!liked);
    } catch (err) {
      console.error('Failed to like story:', err);
    }
  };

  const handleToggleHighlight = async () => {
    setIsTogglingHighlight(true);
    try {
      const res = await apiPost(`/api/stories/${activeStory._id}/highlight`);
      if (res.success && res.story) {
        const updated = { ...activeStory, ...res.story };
        setLocalStory(updated);
        if (onStoryUpdated) onStoryUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to toggle highlight:', err);
    } finally {
      setIsTogglingHighlight(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md h-[88vh] max-h-[680px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4 relative shadow-xl">
        {/* Story Background Media */}
        <img 
          src={activeStory.mediaUrl || activeStory.media || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200"}
          alt="Story" 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/95"></div>

        {/* Story Top Header Bar */}
        <div className="relative z-10 space-y-3">
          <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white w-full animate-pulse"></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={activeStory.user?.avatar || activeStory.userAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300"}
                alt={activeStory.user?.name || activeStory.userName}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-md"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{activeStory.user?.name || activeStory.userName || 'Ananya Sharma'}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-400" /> Goa, India</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Music className="w-3 h-3 text-emerald-400" /> Midnight City</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwnStory && (
                <button
                  onClick={handleToggleHighlight}
                  disabled={isTogglingHighlight}
                  title={activeStory.isHighlighted ? 'Remove from Highlights' : 'Add to Highlights'}
                  className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors"
                >
                  <Star className={`w-4 h-4 ${activeStory.isHighlighted ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
                </button>
              )}
              {isOwnStory && (
                <button
                  onClick={handleDeleteStory}
                  disabled={isDeleting}
                  title="Delete Story"
                  className="p-2 rounded-full bg-rose-600/80 text-white hover:bg-rose-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Caption & Action Bar */}
        <div className="relative z-10 space-y-3 mt-auto">
          <p className="text-xs sm:text-sm font-bold text-white bg-slate-950/70 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            {activeStory.caption || 'Goa sunset breeze 🌊✨'}
          </p>

          {/* Reply Log */}
          {replies.length > 0 && (
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {replies.map((r, i) => (
                <div key={i} className="text-xs text-blue-200 font-medium bg-blue-900/60 p-2 rounded-xl border border-blue-700/50">
                  You replied: "{r}"
                </div>
              ))}
            </div>
          )}

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input 
              type="text" 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${activeStory.user?.name?.split(' ')[0] || 'Ananya'}...`}
              className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-200 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleToggleLike}
              className={`p-2.5 rounded-2xl transition-all ${liked ? 'bg-rose-500 text-white' : 'bg-white/20 text-white'}`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-white' : ''}`} />
            </button>
            <button type="submit" className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
