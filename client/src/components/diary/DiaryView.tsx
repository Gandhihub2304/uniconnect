'use client';

import React, { useEffect, useState } from 'react';
import { Lock, Smile, Mic, Search, Calendar, Sparkles, Clock, Plus, ShieldCheck, X, Image as ImageIcon, Send } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost } from '@/lib/api';

export const DiaryView: React.FC = () => {
  const { user } = useAppStore();
  const [memorySearch, setMemorySearch] = useState('');
  const [selectedMood, setSelectedMood] = useState('😄 Happy');
  const [journalContent, setJournalContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Journal entries list state
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  // Search results state
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Time capsules state & modal
  const [timeCapsules, setTimeCapsules] = useState<any[]>([]);
  const [isCapsuleModalOpen, setIsCapsuleModalOpen] = useState(false);
  const [capsuleTitle, setCapsuleTitle] = useState('');
  const [capsuleMessage, setCapsuleMessage] = useState('');
  const [capsuleUnlockDate, setCapsuleUnlockDate] = useState('');

  const moodList = ['😄 Happy', '🚀 Productive', '🌴 Relaxed', '⚡ Energetic', '🎨 Creative'];

  const fetchEntries = async () => {
    try {
      setIsLoadingEntries(true);
      const data = await apiGet('/api/diary/entries');
      if (data.success && data.entries) {
        setJournalEntries(data.entries);
      }
    } catch (err) {
      console.error('Failed to fetch diary entries:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const fetchCapsules = async () => {
    try {
      const data = await apiGet('/api/diary/capsules');
      if (data.success && data.capsules) {
        setTimeCapsules(data.capsules);
      }
    } catch (err) {
      console.error('Failed to fetch time capsules:', err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchCapsules();
  }, []);

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim()) return;

    try {
      const data = await apiPost('/api/diary/entries', {
        title: selectedMood,
        content: journalContent,
        mood: selectedMood,
      });
      if (data.success) {
        setJournalContent('');
        fetchEntries();
      }
    } catch (err) {
      console.error('Failed to save journal entry:', err);
    }
  };

  const handleSearchMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memorySearch.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setIsSearching(true);
      const data = await apiGet(`/api/diary/entries?search=${encodeURIComponent(memorySearch)}`);
      if (data.success) {
        setSearchResults(data.entries || []);
      }
    } catch (err) {
      console.error('Failed to search memories:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capsuleTitle.trim() || !capsuleUnlockDate) return;

    try {
      const data = await apiPost('/api/diary/capsules', {
        title: capsuleTitle,
        message: capsuleMessage,
        unlockDate: new Date(capsuleUnlockDate).toISOString(),
      });
      if (data.success) {
        setCapsuleTitle('');
        setCapsuleMessage('');
        setCapsuleUnlockDate('');
        setIsCapsuleModalOpen(false);
        fetchCapsules();
      }
    } catch (err) {
      console.error('Failed to create time capsule:', err);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Digital Diary & Memories <Lock className="w-4 h-4 text-amber-500" />
          </h1>
          <p className="text-xs text-slate-500 font-medium">Private encrypted journal, mood tracker & time capsule</p>
        </div>
        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-amber-200/50">
          <ShieldCheck className="w-3.5 h-3.5" /> Private to {user?.name || 'Manoj'} Only
        </span>
      </div>

      {/* AI Memory Natural Language Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Natural Language Memory Search</h3>
          </div>
          <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-bold">Try "Goa trip" or "Birthday"</span>
        </div>
        <form onSubmit={handleSearchMemory} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={memorySearch}
            onChange={(e) => setMemorySearch(e.target.value)}
            placeholder="Search naturally: 'Show my Goa trip', 'Find Birthday photos'..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shrink-0 shadow-sm transition-all"
          >
            {isSearching ? 'Searching...' : 'Search Memory'}
          </button>
        </form>
      </div>

      {/* Memory Search Results Grid */}
      {searchResults && (
        <div className="space-y-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Found {searchResults.length} Memory Results for "{memorySearch}"
            </h3>
            <button onClick={() => { setSearchResults(null); setMemorySearch(''); }} className="text-xs text-slate-400 hover:underline">Clear</button>
          </div>

          {searchResults.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No matching memories found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map(mem => (
                <div key={mem._id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
                  {mem.mediaUrl && (
                    <img src={mem.mediaUrl} alt={mem.title} className="w-full h-36 object-cover rounded-xl" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{mem.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(mem.createdAt)}{mem.mood ? ` • ${mem.mood}` : ''}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{mem.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Daily Mood & Journal Logger */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">How are you feeling today?</h3>
          <span className="text-xs text-slate-400 font-medium">30 July 2026</span>
        </div>

        {/* Mood Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {moodList.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMood(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedMood === m
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          value={journalContent}
          onChange={(e) => setJournalContent(e.target.value)}
          placeholder="Write your private thoughts for today..."
          className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none border border-slate-200/60 dark:border-slate-700/50"
        ></textarea>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Mic className="w-4 h-4 text-emerald-500" />
            <span>{isRecording ? 'Recording Voice Journal...' : 'Voice Journal'}</span>
          </button>

          <button
            onClick={handleSaveJournal}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Save Journal Entry
          </button>
        </div>

        {/* Past Journal Entries Stream */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Past Private Entries</h4>
          <div className="space-y-2">
            {isLoadingEntries ? (
              <p className="text-xs text-slate-400 text-center py-3 animate-pulse">Loading your journal...</p>
            ) : journalEntries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No entries yet. Write your first one above!</p>
            ) : (
              journalEntries.map(entry => (
                <div key={entry._id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span className="text-blue-600 dark:text-blue-400">{entry.mood}</span>
                    <span className="text-slate-400 text-[10px]">{formatDate(entry.createdAt)} • {formatTime(entry.createdAt)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{entry.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Time Capsule Unlock Section */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-500" /> Scheduled Time Capsules
          </h3>
          <button
            onClick={() => setIsCapsuleModalOpen(true)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            + New Capsule
          </button>
        </div>

        {timeCapsules.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No sealed time capsules yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {timeCapsules.map((tc) => (
              <div key={tc._id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tc.title}</h4>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">Unlocks {formatDate(tc.unlockDate)}</p>
                {tc.message && <span className="text-[10px] text-slate-400 block">{tc.mediaUrl ? '1 Sealed Media Item 🔒' : 'Sealed Message 🔒'}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Time Capsule Modal */}
      {isCapsuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" /> Create Sealed Time Capsule
              </h3>
              <button onClick={() => setIsCapsuleModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Capsule Title *</label>
                <input
                  type="text"
                  value={capsuleTitle}
                  onChange={(e) => setCapsuleTitle(e.target.value)}
                  placeholder="e.g. Goa Trip Secret Video / New Year 2027 Wish"
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Message</label>
                <textarea
                  rows={2}
                  value={capsuleMessage}
                  onChange={(e) => setCapsuleMessage(e.target.value)}
                  placeholder="A message for your future self..."
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700 resize-none"
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Unlock Date *</label>
                <input
                  type="date"
                  value={capsuleUnlockDate}
                  onChange={(e) => setCapsuleUnlockDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <button
              onClick={handleCreateCapsule}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Seal Time Capsule 🔒</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
