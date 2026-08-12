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
import { connectSocket } from '@/lib/socket';

export default function Home() {
  const { isAuthenticated, activeTab, login, logout, token } = useAppStore();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;
    const savedToken = localStorage.getItem('uniconnect_token');
    if (!savedToken) {
      logout();
      return;
    }
    apiGet('/api/auth/me')
      .then((data) => {
        if (data.success) login(data.user, savedToken);
        else logout();
      })
      .catch(() => logout());
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    }
  }, [isAuthenticated, token]);

  // Prevent SSR hydration mismatch
  if (!isMounted) {
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
