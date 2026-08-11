'use client';

import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Mic, BarChart2, Calendar, Smile, Send, Upload, Plus, Check, Play, Square } from 'lucide-react';
import { useAppStore, CircleFilter } from '@/store/useAppStore';
import { apiPost, apiUpload } from '@/lib/api';

interface CreatePostModalProps {
  onPostCreated: () => void;
}

type PostType = 'photo' | 'video' | 'voice' | 'feeling' | 'poll' | 'event';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onPostCreated }) => {
  const { isCreatePostOpen, setCreatePostOpen, user, circleFilter } = useAppStore();
  const [content, setContent] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<CircleFilter>(circleFilter || 'For You');
  const [postType, setPostType] = useState<PostType>('photo');
  const [isLoading, setIsLoading] = useState(false);

  // Attachment & Control States
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Note State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [hasRecordedVoice, setHasRecordedVoice] = useState(false);

  // Feeling State
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>('😊 Happy');
  const feelings = ['😊 Happy', '🚀 Excited', '🌴 Relaxed', '🎉 Celebrating', '☕ Cozy', '🔥 Motivated', '🎨 Creative', '🎧 Vibing'];

  // Poll State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);

  // Event State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('28 MAY, 10:00 AM');
  const [eventLocation, setEventLocation] = useState('');

  if (!isCreatePostOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let formattedContent = content;
    if (postType === 'feeling' && selectedFeeling) {
      formattedContent = `Feeling ${selectedFeeling} — ${content}`;
    } else if (postType === 'poll' && pollQuestion) {
      formattedContent = `📊 Poll: ${pollQuestion}\n${content}`;
    } else if (postType === 'event' && eventTitle) {
      formattedContent = `📅 Event: ${eventTitle} @ ${eventLocation || 'Main Hall'} (${eventDate})\n${content}`;
    } else if (postType === 'voice') {
      formattedContent = `🎙️ Voice Note (0:${voiceDuration < 10 ? '0' : ''}${voiceDuration}s) — ${content || 'Listen to voice update'}`;
    }

    try {
      let mediaUrls: string[] = [];
      if (mediaFile) {
        const form = new FormData();
        form.append('file', mediaFile);
        const uploadData = await apiUpload('/api/upload', form);
        if (uploadData.success) mediaUrls = [uploadData.fileUrl];
      }

      const data = await apiPost('/api/posts', {
        content: formattedContent || 'New update',
        media: mediaUrls,
        circle: selectedCircle,
      });

      if (data.success) {
        onPostCreated();
        setContent('');
        setMediaPreview(null);
        setMediaFile(null);
        setHasRecordedVoice(false);
        setCreatePostOpen(false);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const circles: CircleFilter[] = ['For You', 'Friends', 'Family', 'College', 'Work', 'Gaming', 'Travel'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white capitalize">Create {postType} Post</h3>
          <button 
            onClick={() => setCreatePostOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info & Audience Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"} 
              alt={user?.name || "User"} 
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{user?.name || "Manoj Gandhi"}</h4>
              <p className="text-[11px] text-slate-400">@{user?.username || "manoj_28"}</p>
            </div>
          </div>

          <select 
            value={selectedCircle}
            onChange={(e) => setSelectedCircle(e.target.value as CircleFilter)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            {circles.map(c => (
              <option key={c} value={c}>{c} Circle</option>
            ))}
          </select>
        </div>

        {/* Dynamic Controls based on selected postType */}
        {postType === 'voice' && (
          <div className="p-4 bg-emerald-50/60 dark:bg-slate-800/60 rounded-2xl border border-emerald-200/50 dark:border-slate-700 text-center space-y-3">
            <Mic className={`w-8 h-8 mx-auto ${isRecordingVoice ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isRecordingVoice ? 'Recording Voice Note...' : hasRecordedVoice ? 'Voice Note Ready! (0:15s)' : 'Tap Mic to Record Voice Note'}
              </h4>
              <p className="text-[11px] text-slate-400">Share voice updates directly to your feed</p>
            </div>
            <button 
              type="button"
              onClick={() => {
                if (isRecordingVoice) {
                  setIsRecordingVoice(false);
                  setHasRecordedVoice(true);
                  setVoiceDuration(15);
                } else {
                  setIsRecordingVoice(true);
                }
              }}
              className={`py-2 px-5 font-bold text-xs rounded-xl text-white shadow-sm transition-all ${
                isRecordingVoice ? 'bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isRecordingVoice ? 'Stop Recording' : 'Start Recording Mic'}
            </button>
          </div>
        )}

        {postType === 'feeling' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">How are you feeling?</label>
            <div className="flex flex-wrap gap-2">
              {feelings.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFeeling(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedFeeling === f ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {postType === 'poll' && (
          <div className="space-y-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-300">Poll Question</label>
            <input 
              type="text" 
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask your circle a question..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-xl focus:outline-none border border-slate-200 dark:border-slate-700"
            />
            <div className="space-y-1.5">
              {pollOptions.map((opt, i) => (
                <input 
                  key={i}
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const copy = [...pollOptions];
                    copy[i] = e.target.value;
                    setPollOptions(copy);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-xl focus:outline-none border border-slate-200 dark:border-slate-700"
                />
              ))}
            </div>
            {pollOptions.length < 4 && (
              <button 
                type="button" 
                onClick={handleAddPollOption}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                + Add Option
              </button>
            )}
          </div>
        )}

        {postType === 'event' && (
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700">
            <input 
              type="text" 
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Event Title (e.g. Badminton Championship)"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-xl focus:outline-none border border-slate-200 dark:border-slate-700"
            />
            <input 
              type="text" 
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Event Location (e.g. Main Auditorium)"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-xl focus:outline-none border border-slate-200 dark:border-slate-700"
            />
          </div>
        )}

        {/* Textarea Caption */}
        <textarea 
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a caption or thoughts..."
          className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none border border-slate-200/60 dark:border-slate-700/50"
        ></textarea>

        {/* Hidden Native File Input for Photo/Video */}
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attached Photo/Video Live Preview */}
        {(postType === 'photo' || postType === 'video') && (
          mediaPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-40">
              <img src={mediaPreview} alt="Upload preview" className="w-full h-40 object-cover" />
              <button
                onClick={() => { setMediaPreview(null); setMediaFile(null); }}
                className="absolute top-2 right-2 p-1.5 bg-slate-950/80 text-white rounded-full hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl flex items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-all"
            >
              <Upload className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Click to upload photo / video file</span>
            </div>
          )
        )}

        {/* Action Type Selector Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              onClick={() => setPostType('photo')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                postType === 'photo' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button 
              type="button"
              onClick={() => setPostType('video')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                postType === 'video' ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Video className="w-4 h-4" />
            </button>

            <button 
              type="button"
              onClick={() => setPostType('voice')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                postType === 'voice' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>

            <button 
              type="button"
              onClick={() => setPostType('feeling')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                postType === 'feeling' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Smile className="w-4 h-4" />
            </button>

            <button 
              type="button"
              onClick={() => setPostType('poll')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                postType === 'poll' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
            </button>

            <button 
              type="button"
              onClick={() => setPostType('event')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                postType === 'event' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={handleCreatePost}
            disabled={isLoading}
            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Publishing...' : 'Publish Post'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
