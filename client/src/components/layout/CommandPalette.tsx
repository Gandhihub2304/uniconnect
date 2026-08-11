'use client';

import React, { useEffect, useState } from 'react';
import { Search, Home, MessageSquare, Sparkles, Film, Users, Calendar, Clock, User, Settings, Shield, Compass, MessageCircle, Hash } from 'lucide-react';
import { useAppStore, NavTab } from '@/store/useAppStore';
import { apiGet } from '@/lib/api';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setActiveTab, openChatWithUser } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ users: any[]; posts: any[]; communities: any[] }>({ users: [], posts: [], communities: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Handle Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [], communities: [] });
      return;
    }
    const handle = setTimeout(async () => {
      try {
        setIsSearching(true);
        const data = await apiGet(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (data.success) {
          setResults({ users: data.users || [], posts: data.posts || [], communities: data.communities || [] });
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  const navItems: { label: string; tab: NavTab; icon: React.ElementType; category: string }[] = [
    { label: 'Go to Home Feed', tab: 'home', icon: Home, category: 'Navigation' },
    { label: 'Open Chats & Messages', tab: 'chats', icon: MessageSquare, category: 'Navigation' },
    { label: 'View Stories 2.0', tab: 'stories', icon: Sparkles, category: 'Navigation' },
    { label: 'Watch Reels Feed', tab: 'reels', icon: Film, category: 'Navigation' },
    { label: 'Explore Communities & Voice Rooms', tab: 'communities', icon: Users, category: 'Navigation' },
    { label: 'Explore & Trending', tab: 'explore', icon: Compass, category: 'Navigation' },
    { label: 'Event Planner & Split Expenses', tab: 'events', icon: Calendar, category: 'Navigation' },
    { label: 'Digital Diary & Memories', tab: 'memories', icon: Clock, category: 'Personal' },
    { label: 'Open Profile Page & Vault', tab: 'profile', icon: User, category: 'Personal' },
    { label: 'Application Settings', tab: 'settings', icon: Settings, category: 'System' },
    { label: 'Local Admin Moderation Panel', tab: 'admin', icon: Shield, category: 'System' },
  ];

  const filteredNav = query.trim()
    ? navItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : navItems;

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const handleSelectUser = (userId: string) => {
    openChatWithUser(userId);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const handleSelectPost = () => {
    setActiveTab('home');
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const handleSelectCommunity = () => {
    setActiveTab('communities');
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const hasSearchResults = results.users.length > 0 || results.posts.length > 0 || results.communities.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, posts, communities, or type a command..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {query.trim() && (
            <div className="space-y-1 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800">
              {isSearching && (
                <p className="px-3 py-2 text-[11px] font-bold text-slate-400 animate-pulse">Searching...</p>
              )}

              {results.users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => handleSelectUser(u._id)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-600 hover:text-white group cursor-pointer transition-all text-slate-700 dark:text-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 group-hover:text-blue-100 truncate">@{u.username}</p>
                    </div>
                  </div>
                  <MessageCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                </div>
              ))}

              {results.communities.map((c) => (
                <div
                  key={c._id}
                  onClick={handleSelectCommunity}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-600 hover:text-white group cursor-pointer transition-all text-slate-700 dark:text-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={c.icon} alt={c.name} className="w-7 h-7 rounded-xl object-cover shrink-0" />
                    <p className="text-xs font-bold truncate">{c.name}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-wider shrink-0">Community</span>
                </div>
              ))}

              {results.posts.map((p) => (
                <div
                  key={p._id}
                  onClick={handleSelectPost}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-600 hover:text-white group cursor-pointer transition-all text-slate-700 dark:text-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Hash className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{p.userName}</p>
                      <p className="text-[10px] text-slate-400 group-hover:text-blue-100 truncate">{p.content}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-wider shrink-0">Post</span>
                </div>
              ))}

              {!isSearching && !hasSearchResults && (
                <p className="px-3 py-2 text-[11px] font-bold text-slate-400">No people, posts, or communities found.</p>
              )}
            </div>
          )}

          {filteredNav.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => handleSelectTab(item.tab)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-600 hover:text-white group cursor-pointer transition-all text-slate-700 dark:text-slate-200"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-wider">
                  {item.category}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
