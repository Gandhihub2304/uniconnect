'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Send } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiPost, apiUpload } from '@/lib/api';

interface CreatePostModalProps {
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onPostCreated }) => {
  const { isCreatePostOpen, setCreatePostOpen, user } = useAppStore();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) return;
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append('file', mediaFile);
      const uploadData = await apiUpload('/api/upload', form);
      const mediaUrls = uploadData.success ? [uploadData.fileUrl] : [];

      const data = await apiPost('/api/posts', {
        content,
        media: mediaUrls,
      });

      if (data.success) {
        onPostCreated();
        setContent('');
        setMediaPreview(null);
        setMediaFile(null);
        setCreatePostOpen(false);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shrink-0">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Create New Post</h3>
          <button
            onClick={() => setCreatePostOpen(false)}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* User Info */}
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

          {/* Hidden Native File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Photo/Video Live Preview */}
          {mediaPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-72">
              <img src={mediaPreview} alt="Upload preview" className="w-full max-h-72 object-cover" />
              <button
                onClick={() => { setMediaPreview(null); setMediaFile(null); }}
                className="absolute top-2 right-2 p-2 min-w-[32px] min-h-[32px] flex items-center justify-center bg-slate-950/80 text-white rounded-full hover:bg-slate-900 active:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 sm:p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 active:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-all"
            >
              <Upload className="w-6 h-6 text-blue-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center">Select a photo or video to share</span>
            </div>
          )}

          {/* Caption */}
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a caption..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 text-sm sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none border border-slate-200/60 dark:border-slate-700/50"
          ></textarea>
        </div>

        {/* Footer action (fixed, always reachable) */}
        <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-3">
          <button
            onClick={handleCreatePost}
            disabled={isLoading || !mediaFile}
            className="w-full py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Sharing...' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
