'use client';

import React, { useState, useRef } from 'react';
import { X, Sparkles, Image as ImageIcon, Music, Send, Upload } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiPost, apiUpload } from '@/lib/api';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose, onStoryCreated }) => {
  const { user } = useAppStore();
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [musicTrack, setMusicTrack] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let finalMediaUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600';

    // 1. Upload story image/video directly to server uploads folder (/api/upload)
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const uploadData = await apiUpload('/api/upload', formData);
        if (uploadData.success && uploadData.fileUrl) {
          finalMediaUrl = uploadData.fileUrl;
        }
      } catch (err) {
        console.error('Failed to upload story file to server uploads:', err);
        if (mediaPreview) finalMediaUrl = mediaPreview;
      }
    } else if (mediaPreview) {
      finalMediaUrl = mediaPreview;
    }

    // 2. Publish story to REST endpoint
    try {
      const data = await apiPost('/api/stories', {
        mediaUrl: finalMediaUrl,
        caption: caption || 'Story update ✨',
        musicTrack: musicTrack || 'Midnight City - M83',
        type: 'image',
      });

      if (data.success) {
        setCaption('');
        setSelectedFile(null);
        setMediaPreview(null);
        setMusicTrack('');
        onStoryCreated(); // Refresh & show toast notification
        onClose(); // Automatically close form
      }
    } catch (err) {
      console.error('Failed to publish story:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Create Story 2.0
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Native File Input */}
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <form onSubmit={handleCreateStory} className="space-y-4">
          {/* Story Photo Attachment Picker / Live Preview */}
          {mediaPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48">
              <img src={mediaPreview} alt="Story upload preview" className="w-full h-48 object-cover" />
              <button 
                type="button"
                onClick={() => { setMediaPreview(null); setSelectedFile(null); }}
                className="absolute top-2 right-2 p-1.5 bg-slate-950/80 text-white rounded-full hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-all group"
            >
              <Upload className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Upload Story Photo / Video</span>
              <span className="text-[10px] text-slate-400">Saves directly to server uploads folder</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300">Story Caption</label>
              <input 
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a text caption..."
                className="w-full mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Music Tag (Optional)</label>
              <input 
                type="text"
                value={musicTrack}
                onChange={(e) => setMusicTrack(e.target.value)}
                placeholder="e.g. Midnight City - M83"
                className="w-full mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Uploading & Publishing Story...' : 'Publish Story'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
