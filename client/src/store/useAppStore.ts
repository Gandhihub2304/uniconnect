import { create } from 'zustand';
import { disconnectSocket } from '@/lib/socket';

export type NavTab = 
  | 'home'
  | 'chats'
  | 'stories'
  | 'feed'
  | 'reels'
  | 'communities'
  | 'events'
  | 'memories'
  | 'ai'
  | 'nearby'
  | 'saved'
  | 'explore'
  | 'profile'
  | 'settings'
  | 'admin';

export type CircleFilter = 'For You' | 'Friends' | 'Family' | 'College' | 'Work' | 'Gaming' | 'Travel';

export interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  circles: string[];
  vaultPin?: string;
  followers?: string[];
  following?: string[];
}

interface AppState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;

  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  circleFilter: CircleFilter;
  setCircleFilter: (circle: CircleFilter) => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;

  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  isAIAssistantOpen: boolean;
  setAIAssistantOpen: (open: boolean) => void;

  isCreatePostOpen: boolean;
  setCreatePostOpen: (open: boolean) => void;

  isCallModalOpen: boolean;
  activeCallUser: string | null;
  activeCallUserId: string | null;
  callType: 'voice' | 'video' | null;
  callRole: 'caller' | 'callee' | null;
  startCall: (userId: string | null, userName: string, type: 'voice' | 'video') => void;
  endCall: () => void;

  incomingCall: { fromId: string; fromName: string; offer: any; callType: 'voice' | 'video' } | null;
  setIncomingCall: (call: AppState['incomingCall']) => void;
  acceptIncomingCall: () => void;

  isVaultUnlocked: boolean;
  setVaultUnlocked: (unlocked: boolean) => void;

  pendingChatUserId: string | null;
  openChatWithUser: (userId: string) => void;
  clearPendingChatUser: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  token: null,
  user: null,

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniconnect_user', JSON.stringify(user));
      localStorage.setItem('uniconnect_token', token);
    }
    set({ isAuthenticated: true, user, token });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('uniconnect_token');
      localStorage.removeItem('uniconnect_user');
    }
    disconnectSocket();
    set({ isAuthenticated: false, token: null, user: null });
  },

  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  circleFilter: 'For You',
  setCircleFilter: (circle) => set({ circleFilter: circle }),

  theme: (typeof window !== 'undefined' && (localStorage.getItem('uniconnect_theme') as 'light' | 'dark')) || 'light',
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      localStorage.setItem('uniconnect_theme', nextTheme);
    }
    return { theme: nextTheme };
  }),

  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  isAIAssistantOpen: false,
  setAIAssistantOpen: (open) => set({ isAIAssistantOpen: open }),

  isCreatePostOpen: false,
  setCreatePostOpen: (open) => set({ isCreatePostOpen: open }),

  isCallModalOpen: false,
  activeCallUser: null,
  activeCallUserId: null,
  callType: null,
  callRole: null,
  startCall: (userId, userName, type) => set({
    isCallModalOpen: true,
    activeCallUser: userName,
    activeCallUserId: userId,
    callType: type,
    callRole: 'caller',
  }),
  endCall: () => set({
    isCallModalOpen: false,
    activeCallUser: null,
    activeCallUserId: null,
    callType: null,
    callRole: null,
    incomingCall: null,
  }),

  incomingCall: null,
  setIncomingCall: (call) => set({ incomingCall: call }),
  acceptIncomingCall: () => set((state) => state.incomingCall ? {
    isCallModalOpen: true,
    activeCallUser: state.incomingCall.fromName,
    activeCallUserId: state.incomingCall.fromId,
    callType: state.incomingCall.callType,
    callRole: 'callee' as const,
    incomingCall: null,
  } : {}),

  isVaultUnlocked: false,
  setVaultUnlocked: (unlocked) => set({ isVaultUnlocked: unlocked }),

  pendingChatUserId: null,
  openChatWithUser: (userId) => set({ activeTab: 'chats', pendingChatUserId: userId }),
  clearPendingChatUser: () => set({ pendingChatUserId: null }),
}));
