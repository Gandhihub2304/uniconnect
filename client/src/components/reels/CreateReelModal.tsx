'use client';

import React, { useRef, useState } from 'react';
import { X, Sparkles, Music, Send, Upload, Video } from 'lucide-react';
import { apiPost, apiUpload } from '@/lib/api';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReelCreated: () => void;
}

export const CreateReelModal: React.FC<CreateReelModalProps> = ({ isOpen, onClose, onReelCreated }) => {
  const [caption, setCaption] = useState('');
  const [musicTrack, setMusicTrack] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleCreateReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadData = await apiUpload('/api/upload', formData);

      if (uploadData.success && uploadData.fileUrl) {
        const data = await apiPost('/api/reels', {
          videoUrl: uploadData.fileUrl,
          caption,
          musicTrack: musicTrack || 'Original Audio',
        });

        if (data.success) {
          setCaption('');
          setMusicTrack('');
          setSelectedFile(null);
          setVideoPreview(null);
          onReelCreated();
          onClose();
        }
      }
    } catch (err) {
      console.error('Failed to create reel:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Create Reel
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <form onSubmit={handleCreateReel} className="space-y-4">
          {videoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-56 bg-black">
              <video src={videoPreview} className="w-full h-56 object-cover" controls />
              <button
                type="button"
                onClick={() => { setVideoPreview(null); setSelectedFile(null); }}
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
              <Video className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Upload Reel Video</span>
              <span className="text-[10px] text-slate-400">MP4 or similar video files</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300">Caption</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Music className="w-3 h-3" /> Music Track (Optional)
              </label>
              <input
                type="text"
                value={musicTrack}
                onChange={(e) => setMusicTrack(e.target.value)}
                placeholder="e.g. As It Was - Harry Styles"
                className="w-full mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !selectedFile}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Uploading & Publishing Reel...' : 'Publish Reel'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
