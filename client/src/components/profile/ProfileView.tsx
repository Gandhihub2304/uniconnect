import React, { useState, useRef, useEffect } from 'react';
import { Grid, CheckCircle2, Edit3, X, Save, Upload, Camera, Heart, MessageCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiPut, apiPost, apiUpload, apiGet } from '@/lib/api';
import { StoryViewerModal } from '@/components/stories/StoryViewerModal';

export const ProfileView: React.FC = () => {
  const { user, login, token } = useAppStore();

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300');
  const [isLoading, setIsLoading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Followers & Following State
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);
  const [followUserList, setFollowUserList] = useState<any[]>([]);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Own Posts Grid State
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);

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

  const fetchMyPosts = async () => {
    if (!user?._id) return;
    try {
      setIsPostsLoading(true);
      const res = await apiGet('/api/posts');
      if (res.success && res.posts) {
        setMyPosts(res.posts.filter((p: any) => String(p.userId) === String(user._id)));
      }
    } catch (err) {
      console.error('Failed to fetch your posts:', err);
    } finally {
      setIsPostsLoading(false);
    }
  };

  const fetchLatestProfile = async () => {
    try {
      const meRes = await apiGet('/api/auth/me');
      if (meRes.success && meRes.user) {
        login(meRes.user, token!);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  useEffect(() => {
    fetchLatestProfile();
    fetchMyPosts();
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

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 select-none">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6">
          <div className="flex items-start gap-8">
            <div className="relative group cursor-pointer shrink-0" onClick={() => setIsEditModalOpen(true)}>
              <div className="story-avatar-ring">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
                  alt={user?.name || "Profile"}
                  className="w-24 h-24 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold">
                <Camera className="w-6 h-6 mb-1" />
                <span>Change Photo</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-normal text-slate-900 dark:text-white flex items-center gap-1.5">
                  {user?.username || "user"}
                  <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="py-1.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-sm rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="flex items-center gap-8">
                <span className="text-sm">
                  <strong className="text-slate-900 dark:text-white">{myPosts.length}</strong>{' '}
                  <span className="text-slate-500 dark:text-slate-400">posts</span>
                </span>
                <button onClick={() => openFollowModal('followers')} className="text-sm hover:opacity-70 transition-opacity">
                  <strong className="text-slate-900 dark:text-white">{(user?.followers || []).length}</strong>{' '}
                  <span className="text-slate-500 dark:text-slate-400">followers</span>
                </button>
                <button onClick={() => openFollowModal('following')} className="text-sm hover:opacity-70 transition-opacity">
                  <strong className="text-slate-900 dark:text-white">{(user?.following || []).length}</strong>{' '}
                  <span className="text-slate-500 dark:text-slate-400">following</span>
                </button>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</h4>
                {user?.bio && <p className="text-sm text-slate-700 dark:text-slate-300 max-w-md leading-relaxed whitespace-pre-line">{user.bio}</p>}
                {user?.location && <p className="text-sm text-slate-400">📍 {user.location}</p>}
                {user?.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline block">
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="flex items-center gap-4 overflow-x-auto pt-6 pb-1 scrollbar-none">
              {highlights.map((h) => (
                <div
                  key={h._id}
                  onClick={() => openHighlightViewer(h)}
                  className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full p-[2px] border border-slate-200 dark:border-slate-700 transition-transform group-hover:scale-105">
                    <img
                      src={h.mediaUrl || h.media}
                      alt={h.highlightTitle || 'Highlight'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[64px]">
                    {h.highlightTitle || 'Highlight'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Posts Tab */}
        <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b-2 border-b-slate-900 dark:border-b-white">
          <Grid className="w-3.5 h-3.5" /> Posts
        </div>
      </div>

      {/* Posts Grid */}
      {isPostsLoading ? (
        <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">Loading posts...</div>
      ) : myPosts.length === 0 ? (
        <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-1">
          <Grid className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Posts Yet</h3>
          <p className="text-xs text-slate-400">Photos and videos you share will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {myPosts.map((post) => (
            <div key={post._id} className="relative aspect-square rounded-md sm:rounded-xl overflow-hidden group bg-slate-100 dark:bg-slate-800">
              {post.media && post.media.length > 0 ? (
                <img src={post.media[0]} alt={post.content} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4">{post.content}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-bold">
                <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 fill-white" /> {post.likes || 0}</span>
                <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 fill-white" /> {post.commentsCount || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
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
                  className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 shadow-sm"
                >
                  <img src={editAvatar} alt="Avatar preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-[10px] font-bold">
                    <Upload className="w-5 h-5 mb-1" />
                    <span>{isLoading ? 'Uploading...' : 'Upload File'}</span>
                  </div>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline" onClick={() => avatarFileRef.current?.click()}>
                  Change profile photo
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Name</label>
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

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Followers & Following Modal */}
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
