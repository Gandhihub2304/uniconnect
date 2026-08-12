import { create } from 'zustand';
import { disconnectSocket } from '@/lib/socket';
import { clearPushToken } from '@/lib/push';

export type NavTab =
  | 'home'
  | 'chats'
  | 'reels'
  | 'explore'
  | 'saved'
  | 'profile'
  | 'settings';

export interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  followers?: string[];
  following?: string[];
  sentFollowRequestIds?: string[];
}

export interface SavedAccount {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  token: string;
}

interface AppState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;

  savedAccounts: SavedAccount[];
  isAddingAccount: boolean;
  startAddAccount: () => void;
  cancelAddAccount: () => void;
  switchAccount: (userId: string) => void;
  removeAccount: (userId: string) => void;

  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;

  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

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

  pendingChatUserId: string | null;
  openChatWithUser: (userId: string) => void;
  clearPendingChatUser: () => void;
}

const loadSavedAccounts = (): SavedAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('uniconnect_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistSavedAccounts = (accounts: SavedAccount[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('uniconnect_accounts', JSON.stringify(accounts));
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  token: null,
  user: null,

  login: (user, token) => {
    const accounts = loadSavedAccounts();
    const next: SavedAccount = { userId: user._id, name: user.name, username: user.username, avatar: user.avatar, token };
    const withoutThis = accounts.filter(a => a.userId !== user._id);
    const updatedAccounts = [next, ...withoutThis];

    if (typeof window !== 'undefined') {
      localStorage.setItem('uniconnect_user', JSON.stringify(user));
      localStorage.setItem('uniconnect_token', token);
    }
    persistSavedAccounts(updatedAccounts);
    set({ isAuthenticated: true, user, token, savedAccounts: updatedAccounts, isAddingAccount: false });
  },

  logout: () => {
    const { user } = get();
    const remaining = loadSavedAccounts().filter(a => a.userId !== user?._id);
    persistSavedAccounts(remaining);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('uniconnect_token');
      localStorage.removeItem('uniconnect_user');
    }
    clearPushToken().catch(() => {});
    disconnectSocket();
    set({ isAuthenticated: false, token: null, user: null, savedAccounts: remaining });
  },

  savedAccounts: loadSavedAccounts(),
  isAddingAccount: false,
  startAddAccount: () => set({ isAddingAccount: true }),
  cancelAddAccount: () => set({ isAddingAccount: false }),

  // Switches the active session to a different saved account without a network round-trip
  // or a login-page flash: stays "authenticated" optimistically (this account logged in
  // successfully before), while page.tsx's token-watching effect silently re-validates
  // and refreshes the full profile from /api/auth/me in the background.
  switchAccount: (userId) => {
    const account = get().savedAccounts.find(a => a.userId === userId);
    if (!account) return;

    disconnectSocket();
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniconnect_token', account.token);
      localStorage.setItem('uniconnect_user', JSON.stringify({
        _id: account.userId, name: account.name, username: account.username, avatar: account.avatar,
      }));
    }
    set({
      token: account.token,
      isAuthenticated: true,
      user: { _id: account.userId, name: account.name, username: account.username, avatar: account.avatar, email: '' },
      isAddingAccount: false,
    });
  },

  removeAccount: (userId) => {
    const remaining = get().savedAccounts.filter(a => a.userId !== userId);
    persistSavedAccounts(remaining);
    set({ savedAccounts: remaining });
  },

  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

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

  pendingChatUserId: null,
  openChatWithUser: (userId) => set({ activeTab: 'chats', pendingChatUserId: userId }),
  clearPendingChatUser: () => set({ pendingChatUserId: null }),
}));
