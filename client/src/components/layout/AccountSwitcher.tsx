'use client';

import React from 'react';
import { Check, Plus, X, LogOut } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface AccountSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ isOpen, onClose }) => {
  const { user, savedAccounts, switchAccount, removeAccount, startAddAccount, logout } = useAppStore();

  if (!isOpen) return null;

  const handleSwitch = (userId: string) => {
    if (userId === user?._id) { onClose(); return; }
    switchAccount(userId);
    onClose();
  };

  const handleAddAccount = () => {
    startAddAccount();
    onClose();
  };

  const handleRemove = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (userId === user?._id) return; // can't remove the account you're currently using here — use Log Out instead
    removeAccount(userId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full sm:w-96 sm:max-w-[90vw] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 sm:hidden" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Switch Accounts</h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1">
          {savedAccounts.map(acc => {
            const isActive = acc.userId === user?._id;
            return (
              <div
                key={acc.userId}
                onClick={() => handleSwitch(acc.userId)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer active:bg-slate-100 dark:active:bg-slate-800"
              >
                <img src={acc.avatar} alt={acc.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{acc.username}</p>
                  <p className="text-xs text-slate-400 truncate">{acc.name}</p>
                </div>
                {isActive ? (
                  <Check className="w-4 h-4 text-blue-500 shrink-0" />
                ) : (
                  <button
                    onClick={(e) => handleRemove(e, acc.userId)}
                    className="p-1.5 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                    title="Remove from this device"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 py-1">
          <button
            onClick={handleAddAccount}
            className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-800"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Add Account</span>
          </button>
          <button
            onClick={() => { onClose(); logout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-rose-50 dark:active:bg-rose-950/40"
          >
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-sm font-bold text-rose-600">Log Out {user?.username ? `@${user.username}` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
