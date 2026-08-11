'use client';

import React, { useState } from 'react';
import { Settings, Shield, Bell, Moon, Sun, Lock, KeyRound, Smartphone, LogOut, Check, Save } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiPut } from '@/lib/api';

export const SettingsView: React.FC = () => {
  const { user, logout } = useAppStore();

  // Settings States
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [callAlerts, setCallAlerts] = useState(true);

  // Security Form State
  const [vaultPin, setVaultPin] = useState('1234');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState('');
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
      showToast('Switched to Light Mode ☀️');
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
      showToast('Switched to Dark Mode 🌙');
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');

    if (newPassword && !currentPassword) {
      setSecurityError('Please enter your current password to set a new password.');
      return;
    }

    const payload: any = {};
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    if (vaultPin) {
      payload.vaultPin = vaultPin;
    }

    setIsSavingSecurity(true);
    try {
      const data: any = await apiPut('/api/auth/settings', payload);
      if (data.success) {
        showToast('Security settings & Vault PIN updated successfully! ✓');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setSecurityError(data.message || 'Unable to update security settings.');
      }
    } catch (err: any) {
      setSecurityError(err.message || 'Unable to reach the server. Please try again.');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Settings & Preferences <Settings className="w-4 h-4 text-blue-500" />
          </h1>
          <p className="text-xs text-slate-500 font-medium">Manage account security, notifications, theme, and privacy</p>
        </div>
        <button
          onClick={logout}
          className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <LogOut className="w-4 h-4" /> Log Out Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Appearance & Theme Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {isDarkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            Appearance & Theme
          </h3>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark Mode Glassmorphism</h4>
              <p className="text-[11px] text-slate-400">Toggle dark visual aesthetic</p>
            </div>
            <button 
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" /> Notifications & Alerts
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Push Notifications</span>
              <button 
                onClick={() => { setPushNotifs(!pushNotifs); showToast(`Push Notifications ${!pushNotifs ? 'Enabled' : 'Disabled'}`); }}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${pushNotifs ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${pushNotifs ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Direct Message Sound Alerts</span>
              <button 
                onClick={() => { setMessageAlerts(!messageAlerts); showToast(`Message Alerts ${!messageAlerts ? 'Enabled' : 'Disabled'}`); }}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${messageAlerts ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${messageAlerts ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">WebRTC Call Vibrations</span>
              <button 
                onClick={() => { setCallAlerts(!callAlerts); showToast(`Call Vibrations ${!callAlerts ? 'Enabled' : 'Disabled'}`); }}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${callAlerts ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${callAlerts ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Vault Password Card */}
        <div className="md:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" /> Account Security & Hidden Vault PIN
          </h3>

          {securityError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
              {securityError}
            </div>
          )}

          <form onSubmit={handleSaveSecurity} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Vault PIN Code</label>
              <input 
                type="text" 
                maxLength={4}
                value={vaultPin}
                onChange={(e) => setVaultPin(e.target.value)}
                placeholder="1234"
                className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Current Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSecurity}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSecurity ? 'Saving...' : 'Save Security Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
