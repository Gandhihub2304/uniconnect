'use client';

import React, { useState, useEffect } from 'react';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BottomNav } from '@/components/layout/BottomNav';

import { DashboardView } from '@/components/feed/DashboardView';
import { ChatView } from '@/components/chat/ChatView';
import { ReelsView } from '@/components/reels/ReelsView';
import { ProfileView } from '@/components/profile/ProfileView';
import { SettingsView } from '@/components/settings/SettingsView';
import { SavedView } from '@/components/saved/SavedView';
import { ExploreView } from '@/components/explore/ExploreView';

import { LoginPage } from '@/components/auth/LoginPage';
import { SignUpPage } from '@/components/auth/SignUpPage';

import { WebRTCCallModal } from '@/components/calls/WebRTCCallModal';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { useAppStore } from '@/store/useAppStore';
import { apiGet } from '@/lib/api';
import { connectSocket, onSocket, offSocket } from '@/lib/socket';
import { initPushNotifications } from '@/lib/push';
import { consumePendingCallAccept } from '@/lib/pendingCall';

export default function Home() {
  const { isAuthenticated, activeTab, login, logout, token, isAddingAccount, cancelAddAccount, setUnreadChatsCount, setAutoAcceptCallFromId } = useAppStore();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Re-runs whenever the active token changes — covers both first load AND
  // switchAccount() setting a different saved account's token.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedToken = token || localStorage.getItem('uniconnect_token');
    if (!savedToken) {
      setIsCheckingAuth(false);
      return;
    }
    setIsCheckingAuth(true);
    apiGet('/api/auth/me')
      .then((data) => {
        if (data.success) login(data.user, savedToken);
        else logout();
      })
      .catch(() => logout())
      .finally(() => setIsCheckingAuth(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
      initPushNotifications();
    }
  }, [isAuthenticated, token]);

  // If this launch was triggered by tapping Accept on the native full-screen incoming-call
  // notification, flag the caller so WebRTCCallModal auto-accepts as soon as the real
  // call_incoming socket event (carrying the actual WebRTC offer) arrives.
  useEffect(() => {
    if (!isAuthenticated) return;
    consumePendingCallAccept().then((result) => {
      if (result.pending && result.fromId) {
        setAutoAcceptCallFromId(result.fromId);
      }
    });
  }, [isAuthenticated]);

  // Single shared unread-chats count, refreshed on login and on any new message —
  // read by LeftSidebar/BottomNav/TopBar instead of each fetching /api/chats itself.
  useEffect(() => {
    if (!isAuthenticated) return;
    const refreshUnread = async () => {
      try {
        const data = await apiGet('/api/chats');
        if (data.success && data.chats) {
          setUnreadChatsCount(data.chats.reduce((sum: number, c: any) => sum + (c.unread || c.unreadCount || 0), 0));
        }
      } catch { /* silent */ }
    };
    refreshUnread();
    onSocket('new_message', refreshUnread);
    return () => offSocket('new_message', refreshUnread);
  }, [isAuthenticated]);

  // Prevent SSR hydration mismatch, and avoid a login-page flash while we're
  // still verifying a saved token against the server on cold start.
  if (!isMounted || isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl"
          style={{
            background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
            boxShadow: '0 8px 24px rgba(225,48,108,0.3)',
          }}
        >
          IG
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0095F6] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#0095F6] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#0095F6] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onSwitchToSignUp={() => setAuthView('signup')} />
    ) : (
      <SignUpPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  if (isAddingAccount) {
    return (
      <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950">
        <button
          onClick={cancelAddAccount}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          Cancel
        </button>
        <LoginPage onSwitchToSignUp={() => setAuthView('signup')} />
      </div>
    );
  }

  const renderMainView = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardView />;
      case 'chats':
        return <ChatView />;
      case 'reels':
        return <ReelsView />;
      case 'explore':
        return <ExploreView />;
      case 'saved':
        return <SavedView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Left Navigation Sidebar */}
      <LeftSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main
          className="flex-1 p-2.5 sm:p-4 pb-20 md:pb-4 overflow-y-auto"
          style={{ background: 'var(--bg-app)' }}
        >
          {renderMainView()}
        </main>
      </div>

      {/* Right Widgets Sidebar */}
      {activeTab === 'home' && <RightSidebar />}

      {/* Mobile Bottom Tab Bar */}
      <BottomNav />

      {/* Global Modals */}
      <WebRTCCallModal />
      <CommandPalette />
    </div>
  );
}
