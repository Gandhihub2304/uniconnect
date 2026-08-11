import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Award, Zap, Users, Lock, Grid, KeyRound, CheckCircle2, Edit3, X, Plus, Save, Send, Upload, Camera } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiPut, apiPost, apiUpload, apiGet } from '@/lib/api';
import { StoryViewerModal } from '@/components/stories/StoryViewerModal';

export const ProfileView: React.FC = () => {
  const { user, login, token, isVaultUnlocked, setVaultUnlocked } = useAppStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'vault' | 'circles'>('posts');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || 'Manoj Gandhi');
  const [editBio, setEditBio] = useState(user?.bio || 'Building UniConnect 🚀 | Tech Enthusiast');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300');
  const [isLoading, setIsLoading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Followers & Following Real-time State
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);
  const [followUserList, setFollowUserList] = useState<any[]>([]);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [userPostsCount, setUserPostsCount] = useState(0);

  // Highlights State
  const [highlights, setHighlights] = useState<any[]>([]);
  const [selectedHighlight, setSelectedHighlight] = useState<any | null>(null);
  const [isHighlightViewerOpen, setIsHighlightViewerOpen] = useState(false);

  const fetchHighlights = async () => {
    if (!user?._id) return;
    try {
      const res = await apiGet(`/api/stories/highlights/${user._id}`);
      if (res.success && res.highlights) {
        setHighlights(res.highlights);
      }
    } catch (err) {
      console.error('Failed to fetch highlights:', err);
    }
  };

  const openHighlightViewer = (highlight: any) => {
    setSelectedHighlight(highlight);
    setIsHighlightViewerOpen(true);
  };

  const handleHighlightUpdated = (updated: any) => {
    setHighlights(prev =>
      updated.isHighlighted
        ? prev.map(h => (h._id === updated._id ? updated : h))
        : prev.filter(h => h._id !== updated._id)
    );
  };

  // Circles List — derived from the real user's circles array
  const circleColors = ['bg-blue-500', 'bg-emerald-500', 'bg-cyan-600', 'bg-amber-500', 'bg-rose-500', 'bg-sky-600'];
  const circles = (user?.circles || []).map((name, i) => ({ name, color: circleColors[i % circleColors.length] }));
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');

  // Fetch real-time user followers, following, and posts count
  const fetchFollowData = async () => {
    if (!user?._id) return;
    try {
      const meRes = await apiGet('/api/auth/me');
      if (meRes.success && meRes.user) {
        login(meRes.user, token!);
      }
      const postsRes = await apiGet('/api/posts');
      if (postsRes.success && postsRes.posts) {
        const myPosts = postsRes.posts.filter((p: any) => String(p.userId) === String(user._id));
        setUserPostsCount(myPosts.length);
      }
    } catch (err) {
      console.error('Failed to fetch follow data:', err);
    }
  };

  useEffect(() => {
    fetchFollowData();
    fetchHighlights();
  }, [user?._id]);

  const openFollowModal = async (type: 'followers' | 'following') => {
    setFollowModalType(type);
    setIsFollowLoading(true);
    try {
      const endpoint = type === 'followers' ? `/api/auth/followers/${user?._id}` : `/api/auth/following/${user?._id}`;
      const res = await apiGet(endpoint);
      if (res.success) {
        setFollowUserList(res[type] || []);
      }
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleToggleFollow = async (targetId: string) => {
    try {
      const res = await apiPost(`/api/auth/follow/${targetId}`);
      if (res.success) {
        login(res.user, token!);
        if (followModalType) {
          openFollowModal(followModalType);
        }
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  // Vault Items State
  const [vaultItems, setVaultItems] = useState([
    { title: 'Encrypted Passport & ID Docs.pdf', date: '12 May 2026', size: '2.4 MB' },
    { title: 'Private Goa Beach Video.mp4', date: '04 May 2026', size: '18.5 MB' }
  ]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        setIsLoading(true);
        const data = await apiUpload('/api/upload', formData);
        if (data.success && data.fileUrl) {
          setEditAvatar(data.fileUrl);
        }
      } catch (err) {
        console.error('Failed to upload avatar:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUnlockVault = async () => {
    try {
      const data = await apiPost('/api/auth/vault/verify', { pin: pinInput });
      if (data.success) {
        setVaultUnlocked(true);
        setPinError(false);
      } else {
        setPinError(true);
      }
    } catch {
      setPinError(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiPut('/api/auth/profile', {
        name: editName,
        bio: editBio,
        avatar: editAvatar,
        location: editLocation,
      });
      if (data.success) {
        login(data.user, token!);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to sync profile update to backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;

    try {
      const updatedCircles = [...(user?.circles || []), newCircleName];
      const data = await apiPut('/api/auth/profile', { circles: updatedCircles });
      if (data.success) {
        login(data.user, token!);
        setNewCircleName('');
        setIsCircleModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to add circle:', err);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 select-none">
      {/* Cover Image & Profile Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-36 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 relative">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200"
            alt="Cover"
            className="w-full h-full object-cover opacity-80"
          />
        </div>

        <div className="p-5 relative pt-0">
          <div className="flex items-end justify-between -mt-12 mb-3">
            <div className="relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
                alt={user?.name || "Manoj Gandhi"}
                className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 object-cover shadow-sm"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold">
                <Camera className="w-6 h-6 mb-1" />
                <span>Change Photo</span>
              </div>
              <span className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile & Photo</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{user?.name || "Manoj Gandhi"}</h2>
              <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/20" />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              @{user?.username || "user"}{user?.location ? ` • 📍 ${user.location}` : ''}
            </p>

            {/* Instagram-Style Followers & Following Bar */}
            <div className="flex items-center gap-8 py-2.5 my-2 border-y border-slate-100 dark:border-slate-800/80 max-w-sm">
              <div className="text-center cursor-default">
                <span className="block text-sm font-black text-slate-900 dark:text-white">{userPostsCount}</span>
                <span className="text-[11px] font-semibold text-slate-400">Posts</span>
              </div>
              <button 
                onClick={() => openFollowModal('followers')} 
                className="text-center hover:opacity-80 transition-opacity"
              >
                <span className="block text-sm font-black text-slate-900 dark:text-white">{(user?.followers || []).length}</span>
                <span className="text-[11px] font-semibold text-slate-400 hover:text-blue-500 transition-colors">Followers</span>
              </button>
              <button 
                onClick={() => openFollowModal('following')} 
                className="text-center hover:opacity-80 transition-opacity"
              >
                <span className="block text-sm font-black text-slate-900 dark:text-white">{(user?.following || []).length}</span>
                <span className="text-[11px] font-semibold text-slate-400 hover:text-blue-500 transition-colors">Following</span>
              </button>
            </div>

            {highlights.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {highlights.map((h) => (
                  <div
                    key={h._id}
                    onClick={() => openHighlightViewer(h)}
                    className="flex flex-col items-center gap-1 min-w-[56px] cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-400 to-blue-500 transition-transform group-hover:scale-105">
                      <img
                        src={h.mediaUrl || h.media}
                        alt={h.highlightTitle || 'Highlight'}
                        className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[56px]">
                      {h.highlightTitle || 'Highlight'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-lg leading-relaxed">
              {user?.bio || "Building UniConnect 🚀 | Passionate about Full-Stack Web App Architecture."}
            </p>

            {/* Badges & Gamification Bar */}
            <div className="flex items-center gap-2 pt-2 overflow-x-auto">
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> 12 Day Streak
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Level 14 (2,840 XP)
              </span>
              <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-xl">
                🚀 Early Adopter
              </span>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex items-center gap-4 px-6 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`py-3 border-b-2 flex items-center gap-1.5 ${activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
          >
            <Grid className="w-4 h-4" /> Activity & Posts
          </button>
          <button 
            onClick={() => setActiveTab('circles')}
            className={`py-3 border-b-2 flex items-center gap-1.5 ${activeTab === 'circles' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
          >
            <Users className="w-4 h-4" /> Circle Privacy ({circles.length})
          </button>
          <button 
            onClick={() => setActiveTab('vault')}
            className={`py-3 border-b-2 flex items-center gap-1.5 ${activeTab === 'vault' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
          >
            <Lock className="w-4 h-4 text-amber-500" /> Hidden Vault
          </button>
        </div>
      </div>

      {/* Your Active Story Section */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span> Your Active Instagram Story
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold">24-Hour Expiration Active</span>
        </div>

        <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-yellow-500 via-rose-500 to-blue-600 shrink-0">
            <img src={user?.avatar} alt={user?.name} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Viewable by all friends & followers on feed</p>
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'circles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Privacy Circles</h3>
            <button 
              onClick={() => setIsCircleModalOpen(true)}
              className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Circle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {circles.map((c, i) => (
              <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.name} Circle</h4>
                </div>
                <span className={`w-3 h-3 rounded-full ${c.color}`}></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vault' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-md mx-auto shadow-sm">
          {!isVaultUnlocked ? (
            <>
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center">
                <KeyRound className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Protected Hidden Vault</h3>
                <p className="text-xs text-slate-500 mt-1">Enter your 4-digit Vault PIN to view protected media (Default: 1234)</p>
              </div>

              <input 
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="• • • •"
                className="w-40 text-center tracking-widest text-lg font-black py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none"
              />

              {pinError && <p className="text-xs font-bold text-rose-500">Invalid Vault PIN code!</p>}

              <button 
                onClick={handleUnlockVault}
                className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Unlock Vault
              </button>
            </>
          ) : (
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-xs rounded-full">
                  Vault Unlocked ✓
                </span>
                <button onClick={() => setVaultUnlocked(false)} className="text-xs font-bold text-rose-500 hover:underline">
                  Lock Vault
                </button>
              </div>

              <div className="space-y-2">
                {vaultItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white">{item.title}</h5>
                      <span className="text-[10px] text-slate-400">{item.date} • {item.size}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">Encrypted</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Profile & Avatar Picture</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Native File Avatar Attachment */}
              <input 
                type="file" 
                ref={avatarFileRef}
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-2">
                <div 
                  onClick={() => avatarFileRef.current?.click()}
                  className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 shadow-md"
                >
                  <img src={editAvatar} alt="Avatar preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-[10px] font-bold">
                    <Upload className="w-5 h-5 mb-1" />
                    <span>{isLoading ? 'Uploading...' : 'Upload File'}</span>
                  </div>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline" onClick={() => avatarFileRef.current?.click()}>
                  Click to select picture file from device
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Bio</label>
                <textarea 
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700 resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Uploading & Saving...' : 'Save Profile & Avatar'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Circle Modal */}
      {isCircleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Create Privacy Circle</h3>
              <button onClick={() => setIsCircleModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCircle} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Circle Name</label>
                <input 
                  type="text" 
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="e.g. Office / Badminton Squad / Best Friends"
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Create Circle</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Followers & Following Modal */}
      {followModalType && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black capitalize text-slate-900 dark:text-white">{followModalType}</h3>
              <button onClick={() => setFollowModalType(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {isFollowLoading ? (
                <div className="py-8 text-center text-xs font-bold text-slate-400 animate-pulse">
                  Loading {followModalType}...
                </div>
              ) : followUserList.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-slate-400">
                  No {followModalType} found yet.
                </div>
              ) : (
                followUserList.map((u) => {
                  const isFollowing = (user?.following || []).includes(u._id);
                  return (
                    <div key={u._id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</h4>
                          <p className="text-[11px] font-medium text-slate-400">@{u.username}</p>
                        </div>
                      </div>

                      {String(u._id) !== String(user?._id) && (
                        <button
                          onClick={() => handleToggleFollow(u._id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                            isFollowing
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Highlight Story Viewer */}
      <StoryViewerModal
        story={selectedHighlight}
        isOpen={isHighlightViewerOpen}
        onClose={() => setIsHighlightViewerOpen(false)}
        onStoryUpdated={handleHighlightUpdated}
      />
    </div>
  );
};
