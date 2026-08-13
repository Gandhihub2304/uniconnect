'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Phone, 
  Video, 
  Mic, 
  Paperclip, 
  Send, 
  ShieldCheck, 
  Flame,
  CheckCheck,
  ChevronDown,
  UserPlus,
  Lock,
  MessageCircle,
  Camera,
  Download,
  Eye,
  EyeOff,
  FileText,
  X,
  RefreshCw,
  Image as ImageIcon,
  MoreVertical,
  Edit3,
  Trash2,
  Smile,
  Check,
  Reply,
  CornerUpLeft,
  Palette,
  ArrowLeft,
  Play,
  Pause
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '@/lib/api';
import { getSocket } from '@/lib/socket';

type DisappearingTimer = 'off' | '10s' | '24h' | '7d';

// Instagram-style chat wallpapers: a neutral default plus a handful of solid/gradient themes.
const CHAT_WALLPAPERS: Record<string, { label: string; swatch: string; bg: string }> = {
  default: { label: 'Default', swatch: '#F0F2F5', bg: '' },
  midnight: { label: 'Midnight', swatch: '#0F172A', bg: 'linear-gradient(180deg, #0F172A, #1E293B)' },
  ocean: { label: 'Ocean', swatch: '#0EA5E9', bg: 'linear-gradient(180deg, #0EA5E9, #38BDF8)' },
  sunset: { label: 'Sunset', swatch: '#F97316', bg: 'linear-gradient(180deg, #F97316, #EC4899)' },
  forest: { label: 'Forest', swatch: '#16A34A', bg: 'linear-gradient(180deg, #16A34A, #4ADE80)' },
  grape: { label: 'Grape', swatch: '#7C3AED', bg: 'linear-gradient(180deg, #7C3AED, #A78BFA)' },
  rose: { label: 'Rose', swatch: '#E11D48', bg: 'linear-gradient(180deg, #E11D48, #FB7185)' },
  classic: { label: 'Instagram', swatch: '#833AB4', bg: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)' },
};

export const ChatView: React.FC = () => {
  const { startCall, user, pendingChatUserId, clearPendingChatUser } = useAppStore();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordSeconds, setVoiceRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const [disappearingTimer, setDisappearingTimer] = useState<DisappearingTimer>('off');
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false);
  const [isWallpaperMenuOpen, setIsWallpaperMenuOpen] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState<string>('default');
  const chatFileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // View-Once state for input bar
  const [isViewOnceSelected, setIsViewOnceSelected] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Lightbox view modals
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [viewOnceModalMedia, setViewOnceModalMedia] = useState<{ url: string; msgId: string } | null>(null);

  // 3-dots message menu & inline edit states
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Reply-to-message state
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  // Presence / typing indicator state
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEmitRef = useRef<number>(0);

  const [chats, setChats] = useState<any[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeMessages = activeChatId ? (messages[activeChatId] || []) : [];

  // Fetch real user chats
  const fetchChats = async () => {
    try {
      setIsLoadingChats(true);
      const data = await apiGet('/api/chats');
      if (data.success && data.chats) {
        const formattedChats = data.chats.map((c: any) => ({
          id: c._id,
          name: c.name || 'Chat',
          username: c.username || 'user',
          avatar: c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          otherUserId: c.otherUserId,
          isOnline: !!c.isOnline,
          lastSeen: c.lastSeen,
          lastMessage: c.lastMessage || '',
          lastMessageTime: c.lastMessageTime,
          unread: c.unread || 0,
          wallpaper: c.wallpaper || 'default',
          isFriend: true
        }));
        setChats(formattedChats);
        setOnlineUserIds(prev => {
          const next = new Set(prev);
          formattedChats.forEach((c: any) => {
            if (c.otherUserId) {
              if (c.isOnline) next.add(c.otherUserId);
              else next.delete(c.otherUserId);
            }
          });
          return next;
        });
        if (formattedChats.length > 0 && !activeChatId) {
          setActiveChatId(formattedChats[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user?._id]);

  // Keep the wallpaper picker in sync with whichever chat is active
  useEffect(() => {
    setChatWallpaper(activeChat?.wallpaper || 'default');
    setIsWallpaperMenuOpen(false);
  }, [activeChatId, activeChat?.wallpaper]);

  const handleSetWallpaper = async (wallpaperId: string) => {
    setChatWallpaper(wallpaperId);
    setIsWallpaperMenuOpen(false);
    if (!activeChatId) return;
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, wallpaper: wallpaperId } : c));
    try {
      await apiPut(`/api/chats/${activeChatId}/wallpaper`, { wallpaper: wallpaperId });
    } catch (err) {
      console.error('Failed to update wallpaper:', err);
    }
  };

  // If navigated here via "Message" from a suggestion/search result, open (or create) that 1:1 chat
  useEffect(() => {
    if (!pendingChatUserId) return;
    (async () => {
      try {
        const data = await apiPost('/api/chats', { participantId: pendingChatUserId });
        if (data.success && data.chat) {
          await fetchChats();
          setActiveChatId(data.chat._id);
        }
      } catch (err) {
        console.error('Failed to open chat:', err);
      } finally {
        clearPendingChatUser();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingChatUserId]);

  // Fetch messages for current active chat
  useEffect(() => {
    if (!activeChatId) return;
    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const data = await apiGet(`/api/chats/${activeChatId}/messages`);
        if (data.success && data.messages) {
          const myId = String(user?._id || '');
          const formattedMsgs = data.messages.map((m: any) => {
            const expiresAtMs = m.expiresAt ? new Date(m.expiresAt).getTime() : null;
            const remainingTtl = expiresAtMs ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)) : null;

            return {
              id: m._id || m.id,
              sender: m.senderName || 'User',
              avatar: m.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
              text: m.text,
              mediaUrl: m.mediaUrl,
              mediaType: m.mediaType,
              fileName: m.fileName,
              fileSize: m.fileSize,
              voiceDuration: m.voiceDuration,
              isViewOnce: m.isViewOnce,
              viewedBy: m.viewedBy || [],
              reactions: m.reactions || [],
              isDeletedForEveryone: m.isDeletedForEveryone || false,
              isEdited: m.isEdited || false,
              expiresAt: expiresAtMs,
              ttl: remainingTtl,
              disappearingTimer: m.disappearingTimer || 'off',
              replyToId: m.replyToId,
              readBy: m.readBy || [],
              time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: String(m.senderId) === myId,
            };
          });
          setMessages(prev => ({ ...prev, [activeChatId]: formattedMsgs }));
        }
      } catch (err) {
        console.error('Failed to fetch chat messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeChatId, user?._id]);

  // Mark messages as read whenever the active chat is opened / receives new messages
  useEffect(() => {
    if (!activeChatId) return;
    apiPut(`/api/chats/${activeChatId}/read`, {}).then(() => {
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, unread: 0 } : c));
    }).catch(() => {});
  }, [activeChatId, activeMessages.length]);

  // Real-time socket events for dynamic instant updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeChatId) return;

    // Join active chat room
    socket.emit('join_chat', activeChatId);

    const handleNewMsg = (m: any) => {
      if (m.chatId !== activeChatId) return;
      const myId = String(user?._id || '');
      const expiresAtMs = m.expiresAt ? new Date(m.expiresAt).getTime() : null;
      const remainingTtl = expiresAtMs ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)) : null;

      const formatted = {
        id: m._id || m.id,
        sender: m.senderName || 'User',
        avatar: m.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        text: m.text,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        fileName: m.fileName,
        fileSize: m.fileSize,
        voiceDuration: m.voiceDuration,
        isViewOnce: m.isViewOnce,
        viewedBy: m.viewedBy || [],
        reactions: m.reactions || [],
        isDeletedForEveryone: m.isDeletedForEveryone || false,
        isEdited: m.isEdited || false,
        expiresAt: expiresAtMs,
        ttl: remainingTtl,
        disappearingTimer: m.disappearingTimer || 'off',
        time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: String(m.senderId) === myId,
      };

      setMessages(prev => {
        const existing = prev[activeChatId] || [];
        // 1. If already present with same DB ID, ignore duplicate
        if (existing.some(x => x.id === formatted.id)) return prev;

        // 2. If optimistic message exists from me, replace it with official server message
        const optIdx = existing.findIndex(x => x.isMe && x.text === formatted.text && (!formatted.mediaUrl || x.mediaUrl === formatted.mediaUrl));
        if (optIdx !== -1) {
          const copy = [...existing];
          copy[optIdx] = formatted;
          return { ...prev, [activeChatId]: copy };
        }

        // 3. Otherwise append new incoming message
        return { ...prev, [activeChatId]: [...existing, formatted] };
      });
    };

    const handleViewOnceOpened = (data: { messageId: string; viewedBy: string[] }) => {
      setMessages(prev => {
        const updated = { ...prev };
        if (activeChatId && updated[activeChatId]) {
          updated[activeChatId] = updated[activeChatId].map(m => 
            m.id === data.messageId ? { ...m, viewedBy: data.viewedBy } : m
          );
        }
        return updated;
      });
    };

    const handleMsgEdited = (data: { messageId: string; text: string; isEdited: boolean }) => {
      setMessages(prev => {
        const updated = { ...prev };
        if (activeChatId && updated[activeChatId]) {
          updated[activeChatId] = updated[activeChatId].map(m => 
            m.id === data.messageId ? { ...m, text: data.text, isEdited: true } : m
          );
        }
        return updated;
      });
    };

    const handleMsgDeleted = (data: { messageId: string; deleteType: string; isDeletedForEveryone?: boolean; deletedFor?: string[]; userId?: string }) => {
      const myId = String(user?._id || '');
      setMessages(prev => {
        const updated = { ...prev };
        if (activeChatId && updated[activeChatId]) {
          if (data.deleteType === 'everyone') {
            updated[activeChatId] = updated[activeChatId].map(m => 
              m.id === data.messageId ? { ...m, isDeletedForEveryone: true, text: '🚫 This message was deleted', mediaUrl: null, mediaType: null, isViewOnce: false } : m
            );
          } else if (data.userId === myId) {
            updated[activeChatId] = updated[activeChatId].filter(m => m.id !== data.messageId);
          }
        }
        return updated;
      });
    };

    const handleMsgReacted = (data: { messageId: string; reactions: any[] }) => {
      setMessages(prev => {
        const updated = { ...prev };
        if (activeChatId && updated[activeChatId]) {
          updated[activeChatId] = updated[activeChatId].map(m => 
            m.id === data.messageId ? { ...m, reactions: data.reactions } : m
          );
        }
        return updated;
      });
    };

    const handleDisappearingTimerUpdated = (data: { chatId: string; disappearingTimer: DisappearingTimer }) => {
      if (data.chatId === activeChatId) {
        setDisappearingTimer(data.disappearingTimer);
      }
      setChats(prev => prev.map(c => c.id === data.chatId ? { ...c, disappearingTimer: data.disappearingTimer } : c));
    };

    const handleChatCleared = (data: { chatId: string }) => {
      setMessages(prev => ({ ...prev, [data.chatId]: [] }));
    };

    const handleWallpaperUpdated = (data: { chatId: string; wallpaper: string }) => {
      if (data.chatId === activeChatId) setChatWallpaper(data.wallpaper);
      setChats(prev => prev.map(c => c.id === data.chatId ? { ...c, wallpaper: data.wallpaper } : c));
    };

    const handleMessagesRead = (data: { chatId: string; readerId: string }) => {
      if (data.chatId !== activeChatId) return;
      setMessages(prev => {
        const existing = prev[activeChatId] || [];
        return {
          ...prev,
          [activeChatId]: existing.map(m =>
            m.isMe && !(m.readBy || []).includes(data.readerId)
              ? { ...m, readBy: [...(m.readBy || []), data.readerId] }
              : m
          ),
        };
      });
    };

    const handleUserTyping = (data: { chatId: string; userName: string; isTyping: boolean }) => {
      if (data.chatId !== activeChatId) return;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (data.isTyping) {
        setTypingUserName(data.userName);
        typingTimeoutRef.current = setTimeout(() => setTypingUserName(null), 3000);
      } else {
        setTypingUserName(null);
      }
    };

    socket.on('new_message', handleNewMsg);
    socket.on('view_once_opened', handleViewOnceOpened);
    socket.on('message_edited', handleMsgEdited);
    socket.on('message_deleted', handleMsgDeleted);
    socket.on('message_reacted', handleMsgReacted);
    socket.on('disappearing_timer_updated', handleDisappearingTimerUpdated);
    socket.on('chat_cleared', handleChatCleared);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('wallpaper_updated', handleWallpaperUpdated);

    return () => {
      socket.emit('leave_chat', activeChatId);
      socket.off('new_message', handleNewMsg);
      socket.off('view_once_opened', handleViewOnceOpened);
      socket.off('message_edited', handleMsgEdited);
      socket.off('message_deleted', handleMsgDeleted);
      socket.off('message_reacted', handleMsgReacted);
      socket.off('disappearing_timer_updated', handleDisappearingTimerUpdated);
      socket.off('chat_cleared', handleChatCleared);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('wallpaper_updated', handleWallpaperUpdated);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeChatId, user?._id]);

  // Global presence listener (independent of active chat) to keep chat-list online dots live
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handlePresence = (data: { userId: string; isOnline: boolean }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (data.isOnline) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    };
    const handleChatUpdated = (data: { chatId: string; lastMessage: string; lastMessageTime: string }) => {
      setChats(prev => prev.map(c => c.id === data.chatId
        ? { ...c, lastMessage: data.lastMessage, lastMessageTime: data.lastMessageTime }
        : c
      ));
      if (data.chatId !== activeChatId) {
        // Re-fetch to get an accurate unread count for the affected chat (sender-side self-updates net to 0)
        apiGet('/api/chats').then(res => {
          if (res.success && res.chats) {
            const match = res.chats.find((c: any) => c._id === data.chatId);
            if (match) {
              setChats(prev => prev.map(c => c.id === data.chatId ? { ...c, unread: match.unread || 0 } : c));
            }
          }
        }).catch(() => {});
      }
    };
    socket.on('presence_update', handlePresence);
    socket.on('chat_updated', handleChatUpdated);
    return () => {
      socket.off('presence_update', handlePresence);
      socket.off('chat_updated', handleChatUpdated);
    };
  }, [activeChatId]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Auto scroll to latest message when switching chat or receiving new messages
  useEffect(() => {
    scrollToBottom(false);
  }, [activeChatId]);

  useEffect(() => {
    if (activeMessages.length > 0) {
      scrollToBottom(true);
    }
  }, [activeMessages.length]);

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isFarFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight > 120;
    setShowScrollBottom(isFarFromBottom);
  };

  // Countdown timer for 10s disappearing messages — only ticks while at least one
  // message actually has an expiry set, instead of running unconditionally forever.
  const hasExpiringMessages = Object.values(messages).some(list => list.some(m => m.expiresAt));
  useEffect(() => {
    if (!hasExpiringMessages) return;

    const interval = setInterval(() => {
      setMessages(prev => {
        let changed = false;
        const updated: Record<string, any[]> = {};
        for (const chatId of Object.keys(prev)) {
          const list = prev[chatId];
          let listChanged = false;
          const filtered: any[] = [];
          for (const msg of list) {
            if (msg.expiresAt) {
              const remaining = Math.max(0, Math.ceil((msg.expiresAt - Date.now()) / 1000));
              if (remaining <= 0) {
                listChanged = true;
                continue;
              }
              if (remaining !== msg.ttl) {
                filtered.push({ ...msg, ttl: remaining });
                listChanged = true;
                continue;
              }
            }
            filtered.push(msg);
          }
          updated[chatId] = listChanged ? filtered : list;
          if (listChanged) changed = true;
        }
        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasExpiringMessages]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Stop any in-progress voice recording / playback on unmount
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      voiceStreamRef.current?.getTracks().forEach(t => t.stop());
      voiceAudioRef.current?.pause();
    };
  }, []);

  // Stop voice-note playback when switching chats
  useEffect(() => {
    voiceAudioRef.current?.pause();
    setPlayingVoiceId(null);
  }, [activeChatId]);

  // Handle standard text send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const expiresAt = disappearingTimer === '10s' ? Date.now() + 10000 : null;
    const sendText = inputText;
    const replyTo = replyingTo;
    setInputText('');
    setReplyingTo(null);

    const optimisticMsg = {
      id: Date.now().toString(),
      sender: user?.name || 'You',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      text: sendText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      expiresAt,
      ttl: disappearingTimer === '10s' ? 10 : null,
      timerType: disappearingTimer,
      replyToId: replyTo?.id,
      replyPreview: replyTo ? { sender: replyTo.sender, text: replyTo.text, isMe: replyTo.isMe } : null,
    };

    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), optimisticMsg]
    }));

    try {
      const res = await apiPost(`/api/chats/${activeChatId}/messages`, { text: sendText, disappearingTimer, replyToId: replyTo?.id });
      if (res.success && res.message) {
        const realId = res.message._id || res.message.id;
        setMessages(prev => {
          const list = prev[activeChatId] || [];
          const updated = list.map(m => m.id === optimisticMsg.id ? { ...m, id: realId } : m);
          return { ...prev, [activeChatId]: updated };
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Handle File upload (Photos, Documents, Videos, PDFs)
  const handleChatFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    try {
      setIsUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      // Upload file to backend server
      const uploadRes = await apiUpload('/api/upload', formData);
      const fileUrl = uploadRes.fileUrl || uploadRes.url;

      let mediaType: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      const isViewOnce = isViewOnceSelected && (mediaType === 'image' || mediaType === 'video');

      const fileMsg = {
        id: Date.now().toString(),
        sender: user?.name || 'You',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        text: isViewOnce ? '📷 1x View Once Photo' : (mediaType === 'image' ? '📷 Photo' : file.name),
        mediaUrl: fileUrl,
        mediaType,
        fileName: file.name,
        fileSize: file.size,
        isViewOnce,
        viewedBy: [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      };

      setMessages(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), fileMsg]
      }));

      // Post message to server
      await apiPost(`/api/chats/${activeChatId}/messages`, {
        text: fileMsg.text,
        mediaUrl: fileUrl,
        mediaType,
        fileName: file.name,
        fileSize: file.size,
        isViewOnce,
        disappearingTimer
      });

      // Reset view once toggle
      setIsViewOnceSelected(false);
    } catch (err) {
      console.error('Failed to upload attachment:', err);
    } finally {
      setIsUploadingFile(false);
      if (chatFileRef.current) chatFileRef.current.value = '';
    }
  };

  // Camera Functions
  const startCamera = async (facingMode: 'user' | 'environment' = cameraFacingMode) => {
    setCapturedPhoto(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setCameraFacingMode(facingMode);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Unable to access camera:', err);
      alert('Unable to access camera. Please check camera permissions.');
      setIsCameraOpen(false);
    }
  };

  const flipCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    startCamera(cameraFacingMode === 'environment' ? 'user' : 'environment');
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCapturedPhoto(null);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Undo the front-camera preview mirror so the saved photo reads correctly (not flipped)
      if (cameraFacingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
    }
  };

  const sendCameraPhoto = async () => {
    if (!capturedPhoto || !activeChatId) return;

    try {
      setIsUploadingFile(true);
      // Convert dataUrl to Blob
      const res = await fetch(capturedPhoto);
      const blob = await res.blob();
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await apiUpload('/api/upload', formData);
      const fileUrl = uploadRes.fileUrl || uploadRes.url;

      const photoMsg = {
        id: Date.now().toString(),
        sender: user?.name || 'You',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        text: isViewOnceSelected ? '📷 1x View Once Photo' : '📷 Photo',
        mediaUrl: fileUrl,
        mediaType: 'image' as const,
        fileName: file.name,
        fileSize: file.size,
        isViewOnce: isViewOnceSelected,
        viewedBy: [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      };

      setMessages(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), photoMsg]
      }));

      await apiPost(`/api/chats/${activeChatId}/messages`, {
        text: photoMsg.text,
        mediaUrl: fileUrl,
        mediaType: 'image',
        fileName: file.name,
        fileSize: file.size,
        isViewOnce: isViewOnceSelected,
        disappearingTimer
      });

      stopCamera();
      setIsViewOnceSelected(false);
    } catch (err) {
      console.error('Failed to send camera photo:', err);
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Close View-Once Lightbox and mark as viewed
  const closeViewOnceModal = async () => {
    if (!viewOnceModalMedia) return;
    const msgId = viewOnceModalMedia.msgId;

    // Mark as viewed locally
    const myId = String(user?._id || '');
    setMessages(prev => {
      const updated = { ...prev };
      if (activeChatId && updated[activeChatId]) {
        updated[activeChatId] = updated[activeChatId].map(m => {
          if (m.id === msgId) {
            return { ...m, viewedBy: [...(m.viewedBy || []), myId] };
          }
          return m;
        });
      }
      return updated;
    });

    setViewOnceModalMedia(null);

    // Call server to record viewed status
    try {
      await apiPost(`/api/chats/messages/${msgId}/view-once`);
    } catch (err) {
      console.error('Failed to mark view-once as read:', err);
    }
  };

  // Delete for me (local removal for user)
  const handleDeleteForMe = async (msgId: string) => {
    try {
      setActiveMenuMsgId(null);
      setMessages(prev => {
        const updated = { ...prev };
        if (activeChatId && updated[activeChatId]) {
          updated[activeChatId] = updated[activeChatId].filter(m => m.id !== msgId);
        }
        return updated;
      });
      await apiDelete(`/api/chats/messages/${msgId}?type=me`);
    } catch (err) {
      console.error('Failed to delete for me:', err);
    }
  };

  // Delete for everyone
  const handleDeleteForEveryone = async (msgId: string) => {
    try {
      setActiveMenuMsgId(null);
      setMessages(prev => {
        const updated = { ...prev };
        if (activeChatId && updated[activeChatId]) {
          updated[activeChatId] = updated[activeChatId].map(m => {
            if (m.id === msgId) {
              return { 
                ...m, 
                isDeletedForEveryone: true, 
                text: '🚫 This message was deleted', 
                mediaUrl: null, 
                mediaType: null,
                isViewOnce: false 
              };
            }
            return m;
          });
        }
        return updated;
      });
      await apiDelete(`/api/chats/messages/${msgId}?type=everyone`);
    } catch (err) {
      console.error('Failed to delete for everyone:', err);
    }
  };

  // Save edit message
  const handleSaveEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    try {
      setEditingMsgId(null);
      setMessages(prev => {
        const updated = { ...prev };
        if (activeChatId && updated[activeChatId]) {
          updated[activeChatId] = updated[activeChatId].map(m => {
            if (m.id === msgId) {
              return { ...m, text: editText, isEdited: true };
            }
            return m;
          });
        }
        return updated;
      });
      await apiPut(`/api/chats/messages/${msgId}`, { text: editText });
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  // Emoji reaction handler
  const handleReact = async (msgId: string, emoji: string) => {
    try {
      setActiveMenuMsgId(null);
      const myId = String(user?._id || '');
      setMessages(prev => {
        const updated = { ...prev };
        if (activeChatId && updated[activeChatId]) {
          updated[activeChatId] = updated[activeChatId].map(m => {
            if (m.id === msgId) {
              const reactions = (m.reactions || []).filter((r: any) => r.userId !== myId);
              reactions.push({ emoji, userId: myId });
              return { ...m, reactions };
            }
            return m;
          });
        }
        return updated;
      });
      await apiPost(`/api/chats/messages/${msgId}/react`, { emoji });
    } catch (err) {
      console.error('Failed to react to message:', err);
    }
  };

  // Change disappearing timer for chat (syncs for both users)
  const handleSetDisappearingTimer = async (timer: DisappearingTimer) => {
    setDisappearingTimer(timer);
    setIsTimerMenuOpen(false);
    if (!activeChatId) return;
    try {
      await apiPut(`/api/chats/${activeChatId}/disappearing`, { timer });
    } catch (err) {
      console.error('Failed to update disappearing timer:', err);
    }
  };

  // Clear chat history for both participants
  const handleClearChat = async () => {
    if (!activeChatId) return;
    if (!window.confirm('Are you sure you want to clear all chat history and media for both participants?')) return;

    try {
      setMessages(prev => ({ ...prev, [activeChatId]: [] }));
      await apiDelete(`/api/chats/${activeChatId}/clear`);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  // Emit typing indicator, throttled to avoid flooding the socket
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeChatId || !user) return;
    const socket = getSocket();
    if (!socket) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current > 1500) {
      lastTypingEmitRef.current = now;
      socket.emit('typing', { chatId: activeChatId, userName: user.name, isTyping: true });
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startVoiceRecording = async () => {
    if (!activeChatId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;

      setVoiceRecordSeconds(0);
      setIsRecordingVoice(true);
      voiceTimerRef.current = setInterval(() => setVoiceRecordSeconds(s => s + 1), 1000);
    } catch (err) {
      console.error('Unable to access microphone:', err);
      alert('Unable to access microphone. Please check microphone permissions.');
    }
  };

  const cancelVoiceRecording = () => {
    mediaRecorderRef.current?.stop();
    voiceStreamRef.current?.getTracks().forEach(t => t.stop());
    voiceStreamRef.current = null;
    mediaRecorderRef.current = null;
    voiceChunksRef.current = [];
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    setIsRecordingVoice(false);
    setVoiceRecordSeconds(0);
  };

  const sendVoiceRecording = async () => {
    if (!mediaRecorderRef.current || !activeChatId) { cancelVoiceRecording(); return; }
    const recorder = mediaRecorderRef.current;
    const durationSecs = voiceRecordSeconds;

    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    setIsRecordingVoice(false);
    setVoiceRecordSeconds(0);

    recorder.onstop = async () => {
      voiceStreamRef.current?.getTracks().forEach(t => t.stop());
      voiceStreamRef.current = null;
      mediaRecorderRef.current = null;

      if (voiceChunksRef.current.length === 0) return;
      const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      voiceChunksRef.current = [];
      if (blob.size === 0) return;

      const ext = recorder.mimeType?.includes('mp4') ? 'm4a' : 'webm';
      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });

      try {
        setIsUploadingFile(true);
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await apiUpload('/api/upload', formData);
        const fileUrl = uploadRes.fileUrl || uploadRes.url;

        const text = `🎙️ Voice Note (${formatDuration(durationSecs)})`;
        const voiceMsg = {
          id: Date.now().toString(),
          sender: user?.name || 'You',
          avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          text,
          mediaUrl: fileUrl,
          mediaType: 'audio' as const,
          voiceDuration: durationSecs,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: true,
        };
        setMessages(prev => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), voiceMsg]
        }));

        await apiPost(`/api/chats/${activeChatId}/messages`, {
          text,
          mediaUrl: fileUrl,
          mediaType: 'audio',
          voiceDuration: durationSecs,
          disappearingTimer,
        });
      } catch (err) {
        console.error('Failed to send voice note:', err);
      } finally {
        setIsUploadingFile(false);
      }
    };

    recorder.stop();
  };

  const toggleVoicePlayback = (msgId: string, url: string) => {
    if (playingVoiceId === msgId) {
      voiceAudioRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
    }
    const audio = new Audio(url);
    audio.onended = () => setPlayingVoiceId(null);
    audio.play().catch(err => console.error('Failed to play voice note:', err));
    voiceAudioRef.current = audio;
    setPlayingVoiceId(msgId);
  };

  const filteredChats = chats.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRelativeTime = (dateStr?: string | number | Date) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString();
  };

  const findRepliedMessage = (replyToId?: string) => {
    if (!replyToId) return null;
    return activeMessages.find(m => m.id === replyToId) || null;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-[calc(100vh-9.5rem)] md:h-[calc(100vh-6.5rem)] grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4 bg-white dark:bg-slate-900 rounded-none md:rounded-2xl border-0 md:border border-slate-200 dark:border-slate-800 shadow-sm p-0 md:p-2 overflow-hidden select-none relative -m-2.5 sm:-m-4 md:m-0">
      {/* Left Chat List Column — full-screen on mobile until a chat is opened, always visible on md+ */}
      <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} md:col-span-1 border-r border-slate-200 dark:border-slate-800 p-3 flex-col h-full overflow-hidden bg-white dark:bg-slate-900`}>
        {/* Header & Search Bar (Fixed Top) */}
        <div className="space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.username || 'Messages'}</h2>
          </div>

          {/* Search Pill — Instagram style */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversations List (Static Panel with Internal Overflow) */}
        <div className="overflow-y-auto flex-1 mt-2 -mx-1">
          {isLoadingChats ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">
              Loading chats...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400 space-y-2">
              <MessageCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p>No chats found.</p>
              <p className="text-[10px] text-slate-500 font-medium">Follow users to start a conversation!</p>
            </div>
          ) : (
            filteredChats.map((c) => {
              const isOnline = c.otherUserId ? onlineUserIds.has(c.otherUserId) : c.isOnline;
              const hasUnread = (c.unread || 0) > 0 && activeChatId !== c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveChatId(c.id)}
                  className={`px-2 py-2 mx-1 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                    activeChatId === c.id
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img src={c.avatar} alt={c.name} className="w-14 h-14 rounded-full object-cover" />
                      {isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm truncate max-w-[140px] ${hasUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-900 dark:text-white'}`}>
                        {c.name}
                      </h4>
                      <p className={`text-[13px] truncate max-w-[160px] ${hasUnread ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {c.lastMessage ? c.lastMessage : `@${c.username}`}
                        {c.lastMessageTime && <span className="text-slate-400"> · {formatRelativeTime(c.lastMessageTime)}</span>}
                      </p>
                    </div>
                  </div>
                  {hasUnread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0095F6] shrink-0"></span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Conversation Window (Smooth Scrolling Chat Box) — full-screen on mobile once a chat is open */}
      <div className={`${activeChatId ? 'flex' : 'hidden md:flex'} md:col-span-2 p-2 md:p-3 flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 rounded-none md:rounded-2xl relative`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2.5">
            <MessageCircle className="w-10 h-10 text-blue-500 opacity-60" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Chat Selected</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Select an existing chat from the left panel or follow suggested users to start a new chat.
            </p>
          </div>
        ) : (
          <>
            {/* Active Chat Header Bar (Static Top Bar) — Instagram style */}
            <div className="px-2 py-2.5 md:px-3 bg-white dark:bg-slate-900 rounded-none md:rounded-2xl border-0 md:border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <button
                  onClick={() => setActiveChatId(null)}
                  className="md:hidden p-1.5 -ml-1 rounded-full text-slate-900 dark:text-white active:bg-slate-100 dark:active:bg-slate-800 shrink-0"
                  aria-label="Back to chats"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative shrink-0">
                  <img src={activeChat.avatar} alt={activeChat.name} className="w-9 h-9 rounded-full object-cover" />
                  {(activeChat.otherUserId ? onlineUserIds.has(activeChat.otherUserId) : activeChat.isOnline) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {activeChat.username}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {typingUserName ? (
                      <span className="text-[#0095F6] font-medium">typing...</span>
                    ) : (activeChat.otherUserId ? onlineUserIds.has(activeChat.otherUserId) : activeChat.isOnline) ? (
                      'Active now'
                    ) : activeChat.lastSeen ? (
                      `Active ${formatRelativeTime(activeChat.lastSeen)} ago`
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 relative shrink-0">
                <button
                  onClick={() => startCall(activeChat.otherUserId || activeChat.id, activeChat.name, 'voice')}
                  className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-900 dark:text-white active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                  title="Voice Call"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={() => startCall(activeChat.otherUserId || activeChat.id, activeChat.name, 'video')}
                  className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-900 dark:text-white active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                  title="Video Call"
                >
                  <Video className="w-5 h-5" />
                </button>

                {/* Chat Wallpaper Picker Trigger */}
                <button
                  onClick={() => { setIsWallpaperMenuOpen(!isWallpaperMenuOpen); setIsTimerMenuOpen(false); }}
                  className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-900 dark:text-white active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                  title="Chat Theme"
                >
                  <Palette className="w-5 h-5" />
                </button>

                {/* Disappearing Messages Dropdown Trigger */}
                <button
                  onClick={() => { setIsTimerMenuOpen(!isTimerMenuOpen); setIsWallpaperMenuOpen(false); }}
                  className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full transition-colors ${
                    disappearingTimer !== 'off' ? 'text-amber-500' : 'text-slate-900 dark:text-white'
                  } active:bg-slate-100 dark:active:bg-slate-800`}
                  title={disappearingTimer === 'off' ? 'Disappearing Off' : `Self-Destruct (${disappearingTimer})`}
                >
                  <Flame className="w-5 h-5" />
                </button>

                {/* Timer Options Menu */}
                {isTimerMenuOpen && (
                  <div className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-1.5 z-30 text-xs font-semibold text-slate-700 dark:text-slate-200 space-y-1">
                    <button
                      onClick={() => handleSetDisappearingTimer('off')}
                      className={`w-full px-3 py-2 rounded-xl text-left ${disappearingTimer === 'off' ? 'bg-blue-50 dark:bg-blue-950 font-bold text-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      Off (Keep Messages)
                    </button>
                    <button
                      onClick={() => handleSetDisappearingTimer('10s')}
                      className={`w-full px-3 py-2 rounded-xl text-left ${disappearingTimer === '10s' ? 'bg-amber-50 dark:bg-amber-950 font-bold text-amber-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      🔥 10 Seconds Self-Destruct
                    </button>
                    <button
                      onClick={() => handleSetDisappearingTimer('24h')}
                      className={`w-full px-3 py-2 rounded-xl text-left ${disappearingTimer === '24h' ? 'bg-blue-50 dark:bg-blue-950 font-bold text-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      ⏱️ 24 Hours
                    </button>
                    <button
                      onClick={() => handleSetDisappearingTimer('7d')}
                      className={`w-full px-3 py-2 rounded-xl text-left ${disappearingTimer === '7d' ? 'bg-blue-50 dark:bg-blue-950 font-bold text-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      📅 7 Days
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button
                      onClick={handleClearChat}
                      className="w-full px-3 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Chat History</span>
                    </button>
                  </div>
                )}

                {/* Wallpaper Picker Menu */}
                {isWallpaperMenuOpen && (
                  <div className="absolute right-0 top-11 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-3 z-30">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 px-0.5">Chat Theme</p>
                    <div className="grid grid-cols-4 gap-2.5">
                      {Object.entries(CHAT_WALLPAPERS).map(([id, wp]) => (
                        <button
                          key={id}
                          onClick={() => handleSetWallpaper(id)}
                          className="flex flex-col items-center gap-1"
                          title={wp.label}
                        >
                          <span
                            className={`w-9 h-9 rounded-full border-2 ${chatWallpaper === id ? 'border-[#0095F6]' : 'border-slate-200 dark:border-slate-700'} flex items-center justify-center`}
                            style={{ background: wp.bg || wp.swatch }}
                          >
                            {chatWallpaper === id && <Check className="w-4 h-4 text-white drop-shadow" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Discussion Feed — background reflects the selected chat wallpaper */}
            <div
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto py-4 space-y-1 px-2 relative scroll-smooth"
              style={
                chatWallpaper !== 'default' && CHAT_WALLPAPERS[chatWallpaper]?.bg
                  ? { background: CHAT_WALLPAPERS[chatWallpaper].bg }
                  : undefined
              }
            >
              {isLoadingMessages ? (
                <div className="py-6 text-center text-xs font-bold text-slate-400 animate-pulse">
                  Loading messages...
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold space-y-1">
                  <p className="font-bold">No messages in this chat yet 👋</p>
                  <p>Send a message below to start chatting!</p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const myId = String(user?._id || '');
                  const hasViewedOnce = msg.isViewOnce && msg.viewedBy && msg.viewedBy.includes(myId);
                  const isEditingThis = editingMsgId === msg.id;
                  const repliedMsg = msg.replyPreview || findRepliedMessage(msg.replyToId);
                  const isLastMyMessage = msg.isMe && activeMessages.filter(m => m.isMe).slice(-1)[0]?.id === msg.id;
                  const isSeen = msg.isMe && (msg.readBy || []).length > 0;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 group ${msg.isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150 relative py-0.5`}
                    >
                      {!msg.isMe && (
                        <img src={msg.avatar} alt={msg.sender} className="w-6 h-6 rounded-full object-cover mb-0.5" />
                      )}

                      {/* 3 Dots Menu Button for Opposite / Left-Side Message */}
                      {!msg.isMe && (
                        <div className="relative flex items-center">
                          <button
                            onClick={() => setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id)}
                            className="p-1.5 min-w-[28px] min-h-[28px] rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-800 transition-colors opacity-70 md:opacity-0 md:group-hover:opacity-100"
                            title="Message Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {activeMenuMsgId === msg.id && (
                            <div className="absolute top-6 left-0 z-30 w-48 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-1.5 text-xs font-semibold space-y-1">
                              {/* Emoji reaction bar */}
                              <div className="flex items-center justify-around p-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                {['❤️', '👍', '😂', '🔥', '😮', '😢', '🙏'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReact(msg.id, emoji)}
                                    className="text-base hover:scale-125 transition-transform"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => { setReplyingTo(msg); setActiveMenuMsgId(null); }}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <CornerUpLeft className="w-3.5 h-3.5 text-blue-500" />
                                <span>Reply</span>
                              </button>
                              <button
                                onClick={() => handleDeleteForMe(msg.id)}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                                <span>Delete for Me</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Bubble Container — Instagram-style fully-rounded pill */}
                      <div
                        className={`max-w-[75%] sm:max-w-md px-3.5 py-2 rounded-3xl text-sm space-y-1.5 relative ${
                          msg.isMe
                            ? 'bg-[#0095F6] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {/* QUOTED REPLY BLOCK */}
                        {repliedMsg && !msg.isDeletedForEveryone && (
                          <div className={`px-2.5 py-1.5 rounded-lg border-l-2 text-[10px] ${
                            msg.isMe ? 'bg-white/15 border-white/50 text-blue-50' : 'bg-slate-100 dark:bg-slate-900 border-blue-400 text-slate-500 dark:text-slate-400'
                          }`}>
                            <p className="font-bold opacity-90">{repliedMsg.isMe ? 'You' : repliedMsg.sender}</p>
                            <p className="truncate max-w-[220px] opacity-80">
                              {repliedMsg.isViewOnce ? '📷 View Once Photo' : (repliedMsg.text || 'Media')}
                            </p>
                          </div>
                        )}

                        {/* DELETED FOR EVERYONE */}
                        {msg.isDeletedForEveryone ? (
                          <div className="flex items-center gap-1.5 text-slate-400 italic text-xs py-0.5">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>This message was deleted</span>
                          </div>
                        ) : (
                          <>
                            {/* VIEW-ONCE MEDIA CONTENT */}
                            {msg.isViewOnce ? (
                              <div className="my-1">
                                {msg.isMe ? (
                                  // Sender cannot view sent 1x photo
                                  <div className="flex items-center gap-2 px-3 py-2 bg-black/20 rounded-xl text-blue-100 text-xs font-semibold select-none border border-white/20">
                                    <Lock className="w-4 h-4 text-amber-300" />
                                    <span>1x View Once Photo Sent</span>
                                  </div>
                                ) : hasViewedOnce ? (
                                  // Recipient already opened photo
                                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-slate-400 text-xs font-semibold select-none border border-slate-200/50 dark:border-slate-800">
                                    <EyeOff className="w-4 h-4 text-slate-400" />
                                    <span>Photo • Opened</span>
                                  </div>
                                ) : (
                                  // Recipient can view photo 1 time only
                                  <button
                                    onClick={() => setViewOnceModalMedia({ url: msg.mediaUrl, msgId: msg.id })}
                                    className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all animate-pulse"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>View Once Photo (1x)</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <>
                                {/* REGULAR IMAGE MEDIA */}
                                {msg.mediaType === 'image' && msg.mediaUrl && (
                                  <div className="relative group rounded-xl overflow-hidden my-1">
                                    <img 
                                      src={msg.mediaUrl} 
                                      alt="Attachment" 
                                      className="w-full max-h-60 object-cover cursor-pointer rounded-xl transition-transform hover:scale-[1.01]" 
                                      onClick={() => setPreviewImageModal(msg.mediaUrl)}
                                    />
                                    <div className="absolute top-2 right-2 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-1">
                                      <a 
                                        href={msg.mediaUrl} 
                                        download={msg.fileName || 'photo.jpg'} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md"
                                        title="Download Photo"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                )}

                                {/* VIDEO MEDIA */}
                                {msg.mediaType === 'video' && msg.mediaUrl && (
                                  <div className="my-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <video src={msg.mediaUrl} controls className="max-w-full rounded-xl max-h-56" />
                                  </div>
                                )}

                                {/* VOICE NOTE PLAYER */}
                                {msg.mediaType === 'audio' && msg.mediaUrl && (
                                  <button
                                    onClick={() => toggleVoicePlayback(msg.id, msg.mediaUrl)}
                                    className={`flex items-center gap-2.5 px-1 py-1 rounded-full min-w-[180px] ${
                                      msg.isMe ? 'text-white' : 'text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                      msg.isMe ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}>
                                      {playingVoiceId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                    </span>
                                    <span className="flex-1 flex items-center gap-0.5 h-6">
                                      {Array.from({ length: 24 }).map((_, i) => (
                                        <span
                                          key={i}
                                          className={`w-0.5 rounded-full ${msg.isMe ? 'bg-white/60' : 'bg-slate-400 dark:bg-slate-500'}`}
                                          style={{ height: `${20 + Math.abs(Math.sin(i * 1.7)) * 60}%` }}
                                        />
                                      ))}
                                    </span>
                                    {msg.voiceDuration !== undefined && (
                                      <span className="text-[10px] font-semibold opacity-80 shrink-0">
                                        {formatDuration(msg.voiceDuration)}
                                      </span>
                                    )}
                                  </button>
                                )}

                                {/* DOCUMENT / FILE ATTACHMENT */}
                                {msg.mediaType === 'document' && (
                                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                                    msg.isMe ? 'bg-blue-700/40 border-blue-400/30 text-white' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                  }`}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                      <div className="truncate">
                                        <p className="font-bold text-xs truncate">{msg.fileName || 'Attachment Document'}</p>
                                        {msg.fileSize && (
                                          <p className="text-[10px] opacity-75">{formatFileSize(msg.fileSize)}</p>
                                        )}
                                      </div>
                                    </div>
                                    <a 
                                      href={msg.mediaUrl} 
                                      download={msg.fileName || 'document'} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 flex-shrink-0 transition-colors shadow-sm"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Download</span>
                                    </a>
                                  </div>
                                )}
                              </>
                            )}

                            {/* INLINE EDIT MODE OR REGULAR TEXT */}
                            {isEditingThis ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  value={editText}
                                  onChange={e => setEditText(e.target.value)}
                                  className="flex-1 px-2 py-1 bg-white/20 dark:bg-black/30 rounded-lg text-xs outline-none text-white placeholder-white/60"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveEdit(msg.id)} className="p-1 text-emerald-300 hover:text-emerald-100">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingMsgId(null)} className="p-1 text-rose-300 hover:text-rose-100">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              msg.text && !msg.isViewOnce && (
                                <p>
                                  {msg.text}
                                  {msg.isEdited && <span className="text-[9px] opacity-60 ml-1.5 font-normal">(edited)</span>}
                                </p>
                              )
                            )}
                          </>
                        )}

                        {/* EMOJI REACTIONS DISPLAY */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {msg.reactions.map((r: any, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-black/20 text-white rounded-md text-[10px]">
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Self-Destruct Live Countdown Pill */}
                        {msg.ttl !== undefined && msg.ttl !== null && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-black/20 px-2 py-0.5 rounded-md w-fit">
                            <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span>Self-destructing in {msg.ttl}s</span>
                          </div>
                        )}

                        <div className={`flex items-center justify-end gap-1 text-[9px] ${msg.isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                          <span>{msg.time}</span>
                          {msg.isMe && <CheckCheck className={`w-3 h-3 ${isSeen ? 'text-white' : 'text-blue-200'}`} />}
                        </div>
                        {isLastMyMessage && isSeen && (
                          <p className="text-right text-[9px] text-blue-100 -mt-1">Seen</p>
                        )}
                      </div>

                      {/* 3 Dots Menu Button for My / Right-Side Message */}
                      {msg.isMe && (
                        <div className="relative flex items-center">
                          <button
                            onClick={() => setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id)}
                            className="p-1.5 min-w-[28px] min-h-[28px] rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-800 transition-colors opacity-70 md:opacity-0 md:group-hover:opacity-100"
                            title="Message Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuMsgId === msg.id && (
                            <div className="absolute top-6 right-0 z-30 w-48 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-1.5 text-xs font-semibold space-y-1 text-slate-800 dark:text-slate-200">
                              {/* Emoji reaction bar */}
                              <div className="flex items-center justify-around p-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                {['❤️', '👍', '😂', '🔥', '😮', '😢', '🙏'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReact(msg.id, emoji)}
                                    className="text-base hover:scale-125 transition-transform"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>

                              {/* Reply option */}
                              <button
                                onClick={() => { setReplyingTo(msg); setActiveMenuMsgId(null); }}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                              >
                                <CornerUpLeft className="w-3.5 h-3.5 text-blue-500" />
                                <span>Reply</span>
                              </button>

                              {/* Edit option */}
                              {!msg.isDeletedForEveryone && !msg.isViewOnce && (
                                <button
                                  onClick={() => { setEditingMsgId(msg.id); setEditText(msg.text); setActiveMenuMsgId(null); }}
                                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Edit Message</span>
                                </button>
                              )}

                              {/* Delete for Me */}
                              <button
                                onClick={() => handleDeleteForMe(msg.id)}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                                <span>Delete for Me</span>
                              </button>

                              {/* Delete for Everyone */}
                              {!msg.isDeletedForEveryone && (
                                <button
                                  onClick={() => handleDeleteForEveryone(msg.id)}
                                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete for Everyone</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Scroll Anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* FLOATING SCROLL TO BOTTOM BUTTON */}
            {showScrollBottom && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-20 right-8 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all animate-bounce z-20 flex items-center gap-1 text-xs font-bold"
                title="Scroll to latest message"
              >
                <ChevronDown className="w-4 h-4" />
                <span className="text-[10px] pr-1">New Messages</span>
              </button>
            )}

            {/* Reply Quote Preview Bar */}
            {replyingTo && (
              <div className="mx-1 mb-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between gap-2 border-l-4 border-blue-500 flex-shrink-0">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-blue-500">
                    Replying to {replyingTo.isMe ? 'yourself' : replyingTo.sender}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                    {replyingTo.isViewOnce ? '📷 View Once Photo' : replyingTo.text || 'Media'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Dynamic Message Form Input Bar — Instagram pill style */}
            <form onSubmit={handleSendMessage} className="px-1 py-1.5 flex items-center gap-1.5 relative flex-shrink-0">
              <input
                type="file"
                ref={chatFileRef}
                onChange={handleChatFileChange}
                accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip"
                className="hidden"
              />

              {/* Camera Photo Button */}
              <button
                type="button"
                onClick={() => startCamera()}
                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-900 dark:text-white active:bg-slate-100 dark:active:bg-slate-800 transition-colors shrink-0"
                title="Take Photo with Camera"
              >
                <Camera className="w-6 h-6" />
              </button>

              {isRecordingVoice ? (
                <div className="flex-1 min-w-0 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full pl-3.5 pr-1.5 py-1.5">
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-rose-500 active:opacity-60 shrink-0"
                    title="Cancel Recording"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                    {formatDuration(voiceRecordSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={sendVoiceRecording}
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-[#0095F6] text-white active:opacity-80 shrink-0"
                    title="Send Voice Note"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-w-0 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full pl-3.5 pr-1 py-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder={
                      isViewOnceSelected
                        ? 'Send 1x View Once Photo...'
                        : disappearingTimer !== 'off'
                          ? `Send disappearing message (${disappearingTimer})...`
                          : `Message...`
                    }
                    className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none py-1.5"
                  />

                  {/* Attach File Button */}
                  <button
                    type="button"
                    onClick={() => chatFileRef.current?.click()}
                    disabled={isUploadingFile}
                    className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-900 dark:text-white active:opacity-60 transition-opacity disabled:opacity-50 shrink-0"
                    title="Attach File / Document / Photo"
                  >
                    {isUploadingFile ? <RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> : <Paperclip className="w-5 h-5" />}
                  </button>

                  {/* 1x View Once Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsViewOnceSelected(!isViewOnceSelected)}
                    className={`p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full transition-all shrink-0 ${
                      isViewOnceSelected ? 'text-amber-500' : 'text-slate-900 dark:text-white active:opacity-60'
                    }`}
                    title="Toggle 1x View Once Photo"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              )}

              {!isRecordingVoice && (
                inputText.trim() ? (
                  <button
                    type="submit"
                    disabled={isUploadingFile}
                    className="text-[#0095F6] font-semibold text-sm px-3 py-2 disabled:opacity-50 shrink-0"
                  >
                    Send
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-900 dark:text-white active:bg-slate-100 dark:active:bg-slate-800 transition-all shrink-0"
                    title="Voice Note"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                )
              )}
            </form>
          </>
        )}
      </div>

      {/* CAMERA SNAPSHOT MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 max-w-lg w-full p-4 space-y-4 shadow-xl relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Camera Snap</span>
              </h3>
              <div className="flex items-center gap-1.5">
                {!capturedPhoto && (
                  <button
                    onClick={flipCamera}
                    className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
                    title="Switch Camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button onClick={stopCamera} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
              {!capturedPhoto ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              ) : (
                <img src={capturedPhoto} alt="Captured preview" className="w-full h-full object-cover" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex items-center justify-between pt-2">
              {!capturedPhoto ? (
                <div className="w-full flex items-center justify-center">
                  <button 
                    onClick={takePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white bg-red-600 hover:bg-red-700 transition-transform active:scale-95 shadow-lg"
                    title="Take Photo"
                  />
                </div>
              ) : (
                <div className="w-full flex items-center justify-between gap-3">
                  <button 
                    onClick={() => setCapturedPhoto(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsViewOnceSelected(!isViewOnceSelected)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isViewOnceSelected 
                        ? 'bg-amber-500 text-white shadow-md' 
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{isViewOnceSelected ? '1x View Once (ON)' : '1x View Once'}</span>
                  </button>

                  <button 
                    onClick={sendCameraPhoto}
                    disabled={isUploadingFile}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isUploadingFile ? 'Sending...' : 'Send Photo'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REGULAR IMAGE PREVIEW LIGHTBOX MODAL */}
      {previewImageModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full flex flex-col items-center space-y-3">
            <div className="w-full flex items-center justify-between text-white">
              <span className="text-xs font-bold">Photo Preview</span>
              <div className="flex items-center gap-3">
                <a 
                  href={previewImageModal} 
                  download="photo.jpg" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
                <button 
                  onClick={() => setPreviewImageModal(null)} 
                  className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <img src={previewImageModal} alt="Enlarged preview" className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800" />
          </div>
        </div>
      )}

      {/* 1x VIEW ONCE LIGHTBOX MODAL */}
      {viewOnceModalMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between text-white px-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>1x View Once Photo</span>
                </span>
              </div>
              <button 
                onClick={closeViewOnceModal}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg"
              >
                <X className="w-4 h-4" />
                <span>Close & Destroy</span>
              </button>
            </div>
            <img 
              src={viewOnceModalMedia.url} 
              alt="View once photo" 
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800 select-none" 
              onContextMenu={e => e.preventDefault()}
            />
            <p className="text-slate-400 text-xs font-semibold">⚠️ This photo will be closed permanently once you click Close.</p>
          </div>
        </div>
      )}
    </div>
  );
};

