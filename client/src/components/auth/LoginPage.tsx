'use client';

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiPost } from '@/lib/api';

interface LoginPageProps {
  onSwitchToSignUp: () => void;
}

type View = 'login' | 'forgot-step1' | 'forgot-step2' | 'forgot-done';

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignUp }) => {
  const { login } = useAppStore();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [view, setView] = useState<View>('login');

  // Forgot-password flow state
  const [fpEmailOrUsername, setFpEmailOrUsername] = useState('');
  const [fpEmail, setFpEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername || !password) { setError('Please enter your email/username and password'); return; }
    setIsLoading(true); setError('');
    try {
      const data = await apiPost('/api/auth/login', { emailOrUsername, password });
      if (data.success) login(data.user, data.token);
      else setError(data.message || 'Invalid credentials. Please try again.');
    } catch (err: any) {
      setError(err.message || 'Unable to reach the server. Please try again.');
    } finally { setIsLoading(false); }
  };

  const resetForgotState = () => {
    setFpEmailOrUsername('');
    setFpEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setFpError('');
    setFpLoading(false);
  };

  const backToLogin = () => {
    resetForgotState();
    setView('login');
  };

  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmailOrUsername || !fpEmail) { setFpError('Please fill in both fields.'); return; }
    setFpLoading(true); setFpError('');
    try {
      const data: any = await apiPost('/api/auth/forgot-password', { emailOrUsername: fpEmailOrUsername, email: fpEmail });
      if (data.success && data.resetToken) {
        setResetToken(data.resetToken);
        setView('forgot-step2');
      } else {
        setFpError(data.message || 'That email does not match this account.');
      }
    } catch (err: any) {
      setFpError(err.message || 'Unable to reach the server. Please try again.');
    } finally { setFpLoading(false); }
  };

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { setFpError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmNewPassword) { setFpError('Passwords do not match.'); return; }
    setFpLoading(true); setFpError('');
    try {
      const data: any = await apiPost('/api/auth/reset-password', { resetToken, newPassword });
      if (data.success) setView('forgot-done');
      else setFpError(data.message || 'Unable to reset password. Please try again.');
    } catch (err: any) {
      setFpError(err.message || 'Unable to reach the server. Please try again.');
    } finally { setFpLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 select-none">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-lg bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg shadow-blue-600/30">
            UC
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">UniConnect</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 space-y-5 border border-slate-200 shadow-sm">
          {view === 'login' && (
          <>
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-black text-slate-900">Welcome back</h2>
            <p className="text-xs font-medium text-slate-500">
              Sign in to continue to your campus hub
            </p>
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={e => setEmailOrUsername(e.target.value)}
                  placeholder="you@university.edu or @handle"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                <button
                  type="button"
                  onClick={() => { resetForgotState(); setView('forgot-step1'); }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <button onClick={onSwitchToSignUp} className="font-bold text-blue-600 hover:underline">
              Create one free →
            </button>
          </p>
          </>
          )}

          {/* FORGOT PASSWORD — STEP 1: verify identity */}
          {view === 'forgot-step1' && (
            <>
              <div className="space-y-1 text-center">
                <div className="mx-auto mb-1 w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Reset password</h2>
                <p className="text-xs font-medium text-slate-500">
                  Confirm your registered email to continue. No email will be sent — you&apos;ll set a new password right here.
                </p>
              </div>

              {fpError && (
                <div className="px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-600">
                  {fpError}
                </div>
              )}

              <form onSubmit={handleForgotStep1} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Username or Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={fpEmailOrUsername}
                      onChange={e => setFpEmailOrUsername(e.target.value)}
                      placeholder="you@university.edu or @handle"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={fpEmail}
                      onChange={e => setFpEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={fpLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                >
                  {fpLoading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500">
                <button onClick={backToLogin} className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </p>
            </>
          )}

          {/* FORGOT PASSWORD — STEP 2: set new password */}
          {view === 'forgot-step2' && (
            <>
              <div className="space-y-1 text-center">
                <div className="mx-auto mb-1 w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Set new password</h2>
                <p className="text-xs font-medium text-slate-500">
                  Identity verified. Choose a new password for your account.
                </p>
              </div>

              {fpError && (
                <div className="px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-600">
                  {fpError}
                </div>
              )}

              <form onSubmit={handleForgotStep2} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmNewPassword && (
                    <p className={`text-[11px] font-semibold ${newPassword === confirmNewPassword ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {newPassword === confirmNewPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={fpLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                >
                  {fpLoading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : <><Check className="w-4 h-4" /><span>Reset password</span></>}
                </button>
              </form>

              <p className="text-center text-xs text-slate-500">
                <button onClick={backToLogin} className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </p>
            </>
          )}

          {/* FORGOT PASSWORD — DONE */}
          {view === 'forgot-done' && (
            <>
              <div className="space-y-1 text-center py-2">
                <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Password reset</h2>
                <p className="text-xs font-medium text-slate-500">
                  Your password has been updated. Sign in with your new password.
                </p>
              </div>

              <button
                onClick={backToLogin}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
              >
                Back to Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[11px] font-medium mt-5 text-slate-400">
          © 2025 UniConnect · Made for students, by students
        </p>
      </div>
    </div>
  );
};
