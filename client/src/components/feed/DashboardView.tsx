'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  Smile, 
  BarChart2, 
  Calendar, 
  ChevronDown, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Sparkles, 
  MoreHorizontal, 
  SlidersHorizontal,
  CheckCircle2,
  Bot,
  Send,
  Pin,
  Trash2,
  Copy,
  EyeOff,
  Flag
} from 'lucide-react';
import { useAppStore, CircleFilter } from '@/store/useAppStore';
import { CreatePostModal } from './CreatePostModal';
import { CreateStoryModal } from '../stories/CreateStoryModal';
import { StoryViewerModal } from '../stories/StoryViewerModal';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

const REPORT_REASONS = ['Spam', 'Harassment', 'Inappropriate', 'Other'];

export const DashboardView: React.FC = () => {
  const { circleFilter, setCircleFilter, setCreatePostOpen, setAIAssistantOpen, user } = useAppStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Story Viewer State
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [isStoryCreateOpen, setIsStoryCreateOpen] = useState(false);
  const [hoveredStoryId, setHoveredStoryId] = useState<string | null>(null);

  // Active Post State Features
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  // Dynamic Time of Day Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const fetchPosts = async () => {
    try {
      setIsLoadingPosts(true);
      const data = await apiGet(`/api/posts?circle=${encodeURIComponent(circleFilter)}`);
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchStories = async (showNotification = false) => {
    try {
      const data = await apiGet('/api/stories');
      if (data.success && data.stories) {
        setStories(data.stories);
        if (showNotification) {
          showToast('Story Published Successfully! ✨');
        }
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  const fetchSaved = async () => {
    try {
      const data = await apiGet('/api/saved');
      if (data.success && data.posts) {
        setSavedPostIds(data.posts.map((p: any) => p._id));
      }
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStories();
    fetchSaved();
  }, [circleFilter]);

  const handleLikeToggle = async (postId: string) => {
    try {
      const data = await apiPost(`/api/posts/${postId}/like`);
      if (data.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              likes: data.likes,
              likedBy: data.liked ? [...(p.likedBy || []), user?._id] : (p.likedBy || []).filter((id: string) => id !== user?._id)
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const data = await apiGet(`/api/posts/${postId}/comments`);
      if (data.success) {
        setPostComments(prev => ({ ...prev, [postId]: data.comments }));
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleToggleComments = (postId: string) => {
    const next = openCommentsPostId === postId ? null : postId;
    setOpenCommentsPostId(next);
    if (next) fetchComments(postId);
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const data = await apiPost(`/api/posts/${postId}/comments`, { text });
      if (data.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        showToast('Comment published! 💬');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
      showToast('Could not post comment. Try again.');
    }
  };

  const handleToggleSave = async (postId: string) => {
    try {
      const data = await apiPost(`/api/posts/${postId}/save`);
      if (data.success) {
        if (data.saved) {
          setSavedPostIds(prev => [...prev, postId]);
          showToast('Post saved to your Bookmarks 🔖');
        } else {
          setSavedPostIds(prev => prev.filter(id => id !== postId));
          showToast('Post removed from Saved 🔖');
        }
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handlePinPost = async (postId: string, isPinned: boolean) => {
    try {
      await apiPatch(`/api/posts/${postId}`, { isPinned: !isPinned });
      showToast(!isPinned ? 'Post pinned to top 📌' : 'Post unpinned');
      fetchPosts();
    } catch (err) {
      console.error('Failed to pin post:', err);
    }
  };

  const handleHidePost = async (postId: string) => {
    try {
      await apiPatch(`/api/posts/${postId}`, { isHidden: true });
      setPosts(prev => prev.filter(p => p._id !== postId));
      showToast('Post hidden');
    } catch (err) {
      console.error('Failed to hide post:', err);
    }
  };

  const handleReportPost = async (postId: string, reason: string) => {
    try {
      const data = await apiPost('/api/reports', { targetType: 'post', targetId: postId, reason });
      if (data.success) {
        showToast('Post reported. Our team will review it.');
      } else {
        showToast('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Failed to report post:', err);
      showToast('Something went wrong. Please try again.');
    } finally {
      setReportingPostId(null);
      setActiveMenuPostId(null);
    }
  };

  const handleSharePost = (postId: string) => {
    navigator.clipboard?.writeText?.(`http://localhost:3000/posts/${postId}`);
    showToast('Post link copied to clipboard! 🔗');
  };

  const handleStoryClick = (story: any) => {
    setSelectedStory(story);
    setIsStoryViewerOpen(true);
  };

  const categories: CircleFilter[] = ['For You', 'Friends', 'Family', 'College', 'Work', 'Gaming', 'Travel'];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl border border-slate-700 shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Top Banner Greeting & Create Post Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {getGreeting()}, {user?.name || 'Manoj Gandhi'}! 👋
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Discover what's happening around you
          </p>
        </div>
        <button
          onClick={() => setCreatePostOpen(true)}
          className="flex items-center gap-1.5 py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all hover:scale-[1.02]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Stories 2.0 Carousel Bar */}
      <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
        {/* Your Story trigger */}
        {(() => {
          const myStory = stories.find(s => s.user?.name === user?.name || s.userName === user?.name);
          return (
            <div 
              onClick={() => {
                if (myStory) {
                  handleStoryClick(myStory);
                } else {
                  setIsStoryCreateOpen(true);
                }
              }}
              className="flex flex-col items-center gap-1 min-w-[68px] cursor-pointer group relative"
            >
              <div className="relative">
                <div className={`w-14 h-14 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
                  myStory
                    ? 'bg-gradient-to-tr from-yellow-500 via-rose-500 to-blue-600'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}>
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
                    alt="Your Story"
                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                  />
                </div>
                <div
                  onClick={(e) => { e.stopPropagation(); setIsStoryCreateOpen(true); }}
                  className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900"
                  title="Add New Story"
                >
                  <Plus className="w-3 h-3" />
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[64px]">Your Story</span>
              <span className="text-[9px] text-slate-400 font-medium">{myStory ? 'Active ⚡' : 'Add content'}</span>
            </div>
          );
        })()}

        {/* Live Stories Stream with Hover Preview Card */}
        {stories.map((story, idx) => (
          <div 
            key={idx} 
            onClick={() => handleStoryClick(story)}
            onMouseEnter={() => setHoveredStoryId(story._id || `story_${idx}`)}
            onMouseLeave={() => setHoveredStoryId(null)}
            className="flex flex-col items-center gap-1 min-w-[68px] cursor-pointer group relative"
          >
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-400 transition-transform group-hover:scale-105">
              <img
                src={story.user?.avatar || story.userAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300"}
                alt={story.user?.name || story.userName}
                className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
              />
            </div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[64px]">{story.user?.name || story.userName}</span>
            <span className="text-[9px] text-slate-400 font-medium">2h ago</span>

            {/* Hover Floating Card Preview */}
            {hoveredStoryId === (story._id || `story_${idx}`) && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-44 p-2 bg-slate-900/90 text-white rounded-2xl border border-slate-700 shadow-lg z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-center">
                <img 
                  src={story.mediaUrl || story.media || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600"} 
                  alt="Story preview" 
                  className="w-full h-24 object-cover rounded-xl mb-1.5"
                />
                <p className="text-[11px] font-bold truncate">{story.user?.name || story.userName}</p>
                <p className="text-[10px] text-slate-300 truncate">{story.caption || 'Click to view story ✨'}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Post Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div
          onClick={() => setCreatePostOpen(true)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
            alt={user?.name || "User"}
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-slate-400">
            What's on your mind, {user?.name?.split(' ')[0] || 'Manoj'}?
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-3.5">
            <button onClick={() => setCreatePostOpen(true)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Photo</span>
            </button>
            <button onClick={() => setCreatePostOpen(true)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <Video className="w-3.5 h-3.5 text-cyan-500" />
              <span>Video</span>
            </button>
            <button onClick={() => setCreatePostOpen(true)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <Mic className="w-3.5 h-3.5 text-emerald-500" />
              <span>Voice</span>
            </button>
            <button onClick={() => setCreatePostOpen(true)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <Smile className="w-3.5 h-3.5 text-amber-500" />
              <span>Feeling</span>
            </button>
            <button onClick={() => setCreatePostOpen(true)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <BarChart2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Poll</span>
            </button>
            <button onClick={() => setCreatePostOpen(true)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>Event</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreatePostOpen(true)}
              className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all"
            >
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Circle Category Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCircleFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                circleFilter === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dynamic Feed Posts */}
      {isLoadingPosts ? (
        <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">
          Loading live feed posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2.5">
          <Sparkles className="w-7 h-7 text-blue-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No posts in {circleFilter} circle yet</h3>
          <p className="text-xs text-slate-400">Be the first to create a post in this category!</p>
          <button
            onClick={() => setCreatePostOpen(true)}
            className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
          >
            + Create First Post
          </button>
        </div>
      ) : (
        posts.map((post) => {
          const isLiked = post.likedBy?.includes(user?._id || 'user_manoj');
          const isSaved = savedPostIds.includes(post._id);
          const isMenuOpen = activeMenuPostId === post._id;
          const isCommentsOpen = openCommentsPostId === post._id;
          const commentsList = postComments[post._id] || [];

          return (
            <article key={post._id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 relative">
              {/* Post Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={post.user?.avatar || post.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
                    alt={post.user?.name || post.userName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{post.user?.name || post.userName}</h3>
                      {post.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/20" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>Recent</span>
                      <span>•</span>
                      <span>{post.circle || 'For You'}</span>
                      {post.location && (
                        <>
                          <span>•</span>
                          <span>{post.location}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* 3-Dots Action Menu Trigger */}
                <div className="relative">
                  <button
                    onClick={() => { setActiveMenuPostId(isMenuOpen ? null : post._id); setReportingPostId(null); }}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {/* 3-Dots Interactive Dropdown */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-8 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-1.5 z-30 text-xs font-semibold text-slate-700 dark:text-slate-200 space-y-1 animate-in fade-in duration-100">
                      <button 
                        onClick={() => { handleToggleSave(post._id); setActiveMenuPostId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                      >
                        <Bookmark className="w-4 h-4 text-blue-500" />
                        <span>{isSaved ? 'Unsave Post' : 'Save Post'}</span>
                      </button>
                      <button 
                        onClick={() => { handleSharePost(post._id); setActiveMenuPostId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                      >
                        <Copy className="w-4 h-4 text-cyan-500" />
                        <span>Copy Post Link</span>
                      </button>
                      <button
                        onClick={() => { handlePinPost(post._id, post.isPinned); setActiveMenuPostId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                      >
                        <Pin className="w-4 h-4 text-amber-500" />
                        <span>{post.isPinned ? 'Unpin Post' : 'Pin Post'}</span>
                      </button>
                      <button
                        onClick={() => { handleHidePost(post._id); setActiveMenuPostId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 text-left"
                      >
                        <EyeOff className="w-4 h-4" />
                        <span>Hide Post</span>
                      </button>
                      {reportingPostId === post._id ? (
                        <div className="px-2 py-1.5 space-y-1.5">
                          <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Report reason</p>
                          <div className="flex flex-wrap gap-1">
                            {REPORT_REASONS.map((reason) => (
                              <button
                                key={reason}
                                onClick={() => handleReportPost(post._id, reason)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 dark:bg-rose-950 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                              >
                                {reason}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReportingPostId(post._id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 text-left"
                        >
                          <Flag className="w-4 h-4" />
                          <span>Report Post</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Post Caption */}
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {post.content}
              </p>

              {/* Media if present */}
              {post.media && post.media.length > 0 && (
                <div className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <img 
                    src={post.media[0]} 
                    alt="Post media" 
                    className="w-full max-h-[420px] object-cover hover:scale-[1.01] transition-transform duration-300"
                  />
                </div>
              )}

              {/* Reactions & Engagement Row */}
              <div className="flex items-center justify-between pt-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLikeToggle(post._id)}
                    className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                    <span>{post.likes || 0}</span>
                  </button>

                  <button
                    onClick={() => handleToggleComments(post._id)}
                    className={`flex items-center gap-1.5 transition-colors ${isCommentsOpen ? 'text-blue-600' : 'hover:text-blue-600'}`}
                  >
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    <span>{post.commentsCount || 0}</span>
                  </button>

                  <button 
                    onClick={() => handleSharePost(post._id)}
                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>{post.sharesCount || 0}</span>
                  </button>
                </div>

                <button 
                  onClick={() => handleToggleSave(post._id)}
                  className={`p-1 rounded-full transition-colors ${isSaved ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-600' : ''}`} />
                </button>
              </div>

              {/* Inline Comments Section */}
              {isCommentsOpen && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-3 text-xs animate-in fade-in duration-150">
                  {commentsList.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {commentsList.map((c) => (
                        <div key={c._id} className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700">
                          <span className="font-bold">{c.userName}: </span>{c.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={commentInputs[post._id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                    <button 
                      onClick={() => handleAddComment(post._id)}
                      className="p-2 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </article>
          );
        })
      )}

      {/* Interactive Modals */}
      <CreatePostModal onPostCreated={fetchPosts} />
      <CreateStoryModal 
        isOpen={isStoryCreateOpen}
        onClose={() => setIsStoryCreateOpen(false)}
        onStoryCreated={() => fetchStories(true)}
      />
      <StoryViewerModal 
        story={selectedStory}
        isOpen={isStoryViewerOpen}
        onClose={() => setIsStoryViewerOpen(false)}
        onStoryDeleted={fetchStories}
      />
    </div>
  );
};
