'use client';

import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiPost } from '@/lib/api';

interface SignUpPageProps {
  onSwitchToLogin: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToLogin }) => {
  const { login } = useAppStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';

  const handleNext = () => {
    setError('');
    if (!name.trim() || !username.trim() || !email.trim()) { setError('Please fill in all fields.'); return; }
    if (!/^[a-z0-9_.]{3,20}$/i.test(username)) { setError('Username: 3–20 chars, letters/numbers/underscores/dots only.'); return; }
    setStep(2);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setIsLoading(true); setError('');
    try {
      const data = await apiPost('/api/auth/signup', { name, username, email, password, avatar });
      if (data.success) login(data.user, data.token);
      else setError(data.message || 'Error creating account.');
    } catch (err: any) {
      setError(err.message || 'Unable to reach the server.');
    } finally { setIsLoading(false); }
  };

  const stepLabels = ['Account', 'Password'];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 select-none">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-lg bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg shadow-blue-600/30">
            UC
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">UniConnect</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 space-y-4 border border-slate-200 shadow-sm">
          <div className="text-center space-y-0.5">
            <h2 className="text-xl font-black text-slate-900">Create account</h2>
            <p className="text-xs font-medium text-slate-500">
              Step {step} of 2 — {stepLabels[step - 1]}
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {stepLabels.map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-400"
                  style={{ width: step > i ? '100%' : step === i + 1 ? '50%' : '0%' }}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-600">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Manoj Gandhi"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-600">@</span>
                  <input type="text" value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    placeholder="manoj_28"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
              </div>
              <button type="button" onClick={handleNext}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-[11px] font-semibold ${password === confirmPassword ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
              <div className="flex gap-2.5">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={isLoading}
                  className="flex-[2] py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2">
                  {isLoading
                    ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <><Check className="w-4 h-4" /> Sign Up</>}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-bold text-blue-600 hover:underline">
              Sign in →
            </button>
          </p>
        </div>

        <p className="text-center text-[11px] mt-5 text-slate-400">
          © 2025 UniConnect
        </p>
      </div>
    </div>
  );
};
