'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, MessageCircle, Music, MapPin, Send, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { CreateStoryModal } from './CreateStoryModal';
import { apiGet, apiPost } from '@/lib/api';

export const StoriesView: React.FC = () => {
  const { user } = useAppStore();
  const [stories, setStories] = useState<any[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<string[]>([]);
  const [pollVotedOption, setPollVotedOption] = useState<number | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/stories');
      if (data.success && data.stories) {
        setStories(data.stories);
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const displayStories = stories;
  const current = displayStories[activeStoryIndex];

  const handleVotePoll = async (optionIndex: number) => {
    if (!current) return;
    try {
      const data = await apiPost(`/api/stories/${current._id}/vote`, { optionIndex });
      if (data.success) {
        setStories(prev => prev.map(s => s._id === current._id ? data.story : s));
        setPollVotedOption(optionIndex);
      }
    } catch (err) {
      console.error('Failed to vote on poll:', err);
    }
  };

  const handleToggleLike = async () => {
    if (!current) return;
    try {
      await apiPost(`/api/stories/${current._id}/like`);
      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Failed to like story:', err);
    }
  };

  const handleNextStory = () => {
    setActiveStoryIndex((prev) => (prev + 1) % displayStories.length);
    setIsLiked(false);
    setPollVotedOption(null);
  };

  const handlePrevStory = () => {
    setActiveStoryIndex((prev) => (prev - 1 + displayStories.length) % displayStories.length);
    setIsLiked(false);
    setPollVotedOption(null);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setReplies(prev => [...prev, `${user?.name || 'Manoj'}: ${replyText}`]);
    setReplyText('');
  };

  if (!isLoading && displayStories.length === 0) {
    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-6.5rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <Sparkles className="w-8 h-8 text-blue-500" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">No active stories right now</h3>
        <p className="text-xs text-slate-400">Stories disappear after 24 hours. Be the first to share one!</p>
        <button
          onClick={() => setIsCreateStoryOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
        >
          + Add Story
        </button>
        <CreateStoryModal
          isOpen={isCreateStoryOpen}
          onClose={() => setIsCreateStoryOpen(false)}
          onStoryCreated={fetchStories}
        />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-6.5rem)] flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
        Loading stories...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-6.5rem)] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4 relative shadow-xl select-none">
      {/* Background Media */}
      <img 
        src={current.mediaUrl || current.media || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200"} 
        alt="Story" 
        className="absolute inset-0 w-full h-full object-cover opacity-85" 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/90"></div>

      {/* Navigation Buttons Left & Right */}
      <button 
        onClick={handlePrevStory}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-900 border border-white/10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button 
        onClick={handleNextStory}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-900 border border-white/10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Story Progress Bars */}
      <div className="relative z-10 flex gap-2">
        {displayStories.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div className={`h-full bg-white transition-all duration-300 ${i === activeStoryIndex ? 'w-full' : i < activeStoryIndex ? 'w-full' : 'w-0'}`}></div>
          </div>
        ))}
      </div>

      {/* Story Top Info Header */}
      <div className="relative z-10 flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <img 
            src={current.user?.avatar || current.userAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300"} 
            alt={current.user?.name || current.userName} 
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500" 
          />
          <div>
            <h4 className="text-sm font-bold text-white">{current.user?.name || current.userName || 'Ananya Sharma'}</h4>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-400" /> {current.location || 'Goa, India'}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Music className="w-3 h-3 text-emerald-400" /> {current.musicTrack || 'Midnight City'}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsCreateStoryOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white text-xs font-bold flex items-center gap-1 shadow-md hover:scale-105 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" /> Add Story
        </button>
      </div>

      {/* Story Overlay Interactive Poll Widget if available */}
      {current.pollOptions && current.pollOptions.length > 0 && (
        <div className="relative z-10 my-auto max-w-xs mx-auto p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-center space-y-2 animate-in zoom-in-95 duration-150">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Interactive Story Poll</span>
          <div className="space-y-1.5">
            {current.pollOptions.map((opt: { option: string; votes: number }, i: number) => (
              <button
                key={i}
                onClick={() => handleVotePoll(i)}
                className={`w-full py-2 font-bold text-xs rounded-xl transition-all ${
                  pollVotedOption === i
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {opt.option} ({opt.votes}) {pollVotedOption === i && '✓'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Story Footer & Reply Stream */}
      <div className="relative z-10 space-y-3">
        <p className="text-sm font-semibold text-white bg-slate-950/60 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
          {current.caption || 'Goa sunset breeze 🌊✨'}
        </p>

        {/* Live Replies List */}
        {replies.length > 0 && (
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {replies.map((r, i) => (
              <div key={i} className="text-xs text-blue-200 font-medium bg-blue-900/60 p-2 rounded-xl border border-blue-700/50">
                {r}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendReply} className="flex items-center gap-3">
          <input 
            type="text" 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${current.user?.name?.split(' ')[0] || 'Ananya'}...`} 
            className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-200 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleToggleLike}
            className={`p-2.5 rounded-2xl transition-all ${isLiked ? 'bg-rose-500 text-white' : 'bg-white/20 text-white'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
          </button>
          <button type="submit" className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={fetchStories}
      />
    </div>
  );
};
