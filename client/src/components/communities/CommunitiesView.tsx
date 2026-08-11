'use client';

import React, { useState, useEffect } from 'react';
import { Hash, Volume2, Plus, X, Send, Users } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export const CommunitiesView: React.FC = () => {
  const { startCall, user } = useAppStore();
  const [communities, setCommunities] = useState<any[]>([]);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channelMessageText, setChannelMessageText] = useState('');
  const [channelMessages, setChannelMessages] = useState<Record<string, any[]>>({});
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCommunities = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/communities');
      if (data.success && data.communities) {
        setCommunities(data.communities);
        if (!activeCommunityId && data.communities.length > 0) {
          const first = data.communities[0];
          setActiveCommunityId(first._id);
          setActiveChannelId(first.channels?.[0]?.id || null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const activeCommunity = communities.find((c) => c._id === activeCommunityId);
  const channels: any[] = activeCommunity?.channels || [];
  const currentChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  // Load history + join room whenever the active channel changes
  useEffect(() => {
    if (!activeCommunityId || !currentChannel) return;
    const socket = getSocket();
    socket?.emit('join_channel', { communityId: activeCommunityId, channelId: currentChannel.id });

    const key = `${activeCommunityId}_${currentChannel.id}`;
    apiGet(`/api/communities/${activeCommunityId}/channels/${currentChannel.id}/messages`).then((data) => {
      if (data.success) {
        setChannelMessages((prev) => ({ ...prev, [key]: data.messages }));
      }
    }).catch((err) => console.error('Failed to fetch channel messages:', err));
  }, [activeCommunityId, currentChannel?.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNewChannelMessage = (message: any) => {
      const key = `${message.communityId}_${message.channelId}`;
      setChannelMessages((prev) => ({ ...prev, [key]: [...(prev[key] || []), message] }));
    };
    socket.on('new_channel_message', onNewChannelMessage);
    return () => { socket.off('new_channel_message', onNewChannelMessage); };
  }, []);

  const currentMessages = (activeCommunityId && currentChannel)
    ? (channelMessages[`${activeCommunityId}_${currentChannel.id}`] || [])
    : [];

  const handleSendChannelMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelMessageText.trim() || !activeCommunityId || !currentChannel) return;

    getSocket()?.emit('send_channel_message', {
      communityId: activeCommunityId,
      channelId: currentChannel.id,
      text: channelMessageText,
    });
    setChannelMessageText('');
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !activeCommunityId) return;

    try {
      const data = await apiPost(`/api/communities/${activeCommunityId}/channels`, {
        name: newChannelType === 'text' ? newChannelName.toLowerCase().replace(/\s+/g, '-') : newChannelName,
        type: newChannelType,
      });
      if (data.success) {
        setCommunities((prev) => prev.map((c) => c._id === activeCommunityId ? data.community : c));
        setNewChannelName('');
        setIsChannelModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-6.5rem)] flex items-center justify-center text-xs font-bold text-slate-400 animate-pulse">
        Loading communities...
      </div>
    );
  }

  if (!activeCommunity) {
    return (
      <div className="h-[calc(100vh-6.5rem)] flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center p-6">
        <Users className="w-8 h-8 text-blue-500" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">No communities yet</h3>
        <p className="text-xs text-slate-400">Communities you join or create will show up here.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-2 overflow-hidden select-none">
      {/* Discord-style Server Channels Sidebar */}
      <div className="md:col-span-1 border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{activeCommunity.name}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{activeCommunity.membersCount} Members</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Text Channels</span>
              <button onClick={() => setIsChannelModalOpen(true)} className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-bold">+ Channel</button>
            </div>
            {channels.filter((c) => c.type === 'text').map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeChannelId === ch.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Hash className="w-4 h-4 text-slate-400" />
                <span>{ch.name}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Voice Rooms</span>
            {channels.filter((c) => c.type === 'voice').map((ch) => (
              <button
                key={ch.id}
                onClick={() => startCall(null, ch.name, 'voice')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 hover:bg-emerald-100"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>{ch.name}</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-600 text-white rounded-md">Join</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsChannelModalOpen(true)}
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Channel
        </button>
      </div>

      {/* Main Channel Discussion Stream */}
      <div className="md:col-span-3 p-4 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white"># {currentChannel?.name}</h3>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2">
          {currentMessages.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-bold">
              No messages in #{currentChannel?.name} yet. Send the first message!
            </div>
          ) : (
            currentMessages.map((msg) => (
              <div key={msg._id} className="flex gap-3">
                <img src={msg.senderAvatar} alt={msg.senderName} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{msg.senderName}</span>
                    <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Box */}
        <form onSubmit={handleSendChannelMessage} className="p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={channelMessageText}
            onChange={(e) => setChannelMessageText(e.target.value)}
            placeholder={`Message #${currentChannel?.name}...`}
            className="flex-1 px-3 py-2 bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm">
            Send
          </button>
        </form>
      </div>

      {/* Create Channel Modal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Create Channel</h3>
              <button onClick={() => setIsChannelModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Channel Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. project-ideas / voice-lounge-2"
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Channel Type</label>
                <select
                  value={newChannelType}
                  onChange={(e) => setNewChannelType(e.target.value as 'text' | 'voice')}
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                >
                  <option value="text">Text Channel (#)</option>
                  <option value="voice">Voice Room (🔊)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateChannel}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Create Channel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
