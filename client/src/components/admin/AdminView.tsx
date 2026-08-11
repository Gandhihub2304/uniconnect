'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, Rss, BookImage, CalendarDays, Layers, Clock, Trash2, Mail, Flag, Check, X } from 'lucide-react';
import { apiGet, apiDelete, apiPatch } from '@/lib/api';

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatUptime(seconds: number): string {
  if (!seconds && seconds !== 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalPosts: 0,
    totalStories: 0,
    totalEvents: 0,
    activeCommunities: 0,
    uptimeSeconds: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/admin/stats');
      if (data.success) {
        setStats(data.stats || stats);
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setIsPostsLoading(true);
      const data = await apiGet('/api/posts?circle=For You');
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch posts for moderation:', err);
    } finally {
      setIsPostsLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setIsReportsLoading(true);
      const data = await apiGet('/api/reports');
      if (data.success && data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setIsReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPosts();
    fetchReports();
  }, []);

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Delete this post permanently? This action cannot be undone.')) return;
    try {
      const data = await apiDelete(`/api/admin/posts/${id}`);
      if (data.success) {
        setPosts(prev => prev.filter(p => p._id !== id));
        setStats((prev: any) => ({ ...prev, totalPosts: Math.max(0, (prev.totalPosts || 1) - 1) }));
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user permanently? This action cannot be undone.')) return;
    try {
      const data = await apiDelete(`/api/admin/users/${id}`);
      if (data.success) {
        setUsers(prev => prev.filter(u => u._id !== id));
        setStats((prev: any) => ({ ...prev, totalUsers: Math.max(0, (prev.totalUsers || 1) - 1) }));
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleReportAction = async (id: string, status: 'resolved' | 'dismissed') => {
    try {
      const data = await apiPatch(`/api/reports/${id}`, { status });
      if (data.success) {
        setReports(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      console.error('Failed to update report:', err);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Total Posts', value: stats.totalPosts, icon: Rss, color: 'text-cyan-500' },
    { label: 'Total Stories', value: stats.totalStories, icon: BookImage, color: 'text-emerald-500' },
    { label: 'Total Events', value: stats.totalEvents, icon: CalendarDays, color: 'text-rose-500' },
    { label: 'Communities', value: stats.activeCommunities, icon: Layers, color: 'text-amber-500' },
    { label: 'Uptime', value: formatUptime(stats.uptimeSeconds), icon: Clock, color: 'text-sky-500' },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Admin Panel <ShieldAlert className="w-5 h-5 text-rose-500" />
          </h1>
          <p className="text-xs text-slate-500 font-medium">System administration & moderation tool</p>
        </div>
        <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200/50">
          Admin Access Granted
        </span>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white">{isLoading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      {/* Reports Queue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flag className="w-4 h-4 text-amber-500" /> Reports Queue
          </h3>
          <span className="text-xs font-semibold text-slate-400">{reports.length} pending</span>
        </div>

        {isReportsLoading ? (
          <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold text-slate-400">No pending reports 🎉</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
            {reports.map((r) => (
              <div key={r._id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase shrink-0 bg-amber-100 dark:bg-amber-950/50 text-amber-600 border border-amber-200/50">
                    {r.targetType}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{truncate(r.reason, 60)}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Reported by {r.reporterName} • {formatShortDate(r.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleReportAction(r._id, 'resolved')}
                    className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    title="Resolve report"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReportAction(r._id, 'dismissed')}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Dismiss report"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> User Management
          </h3>
          <span className="text-xs font-semibold text-slate-400">{users.length} recent users</span>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold text-slate-400">No users found.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
            {users.map((u) => (
              <div key={u._id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
                    alt={u.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      @{u.username}
                      {u.email && (
                        <span className="flex items-center gap-0.5 truncate">
                          <span>•</span>
                          <Mail className="w-3 h-3" /> {u.email}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteUser(u._id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Moderation Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Rss className="w-4 h-4 text-cyan-500" /> Post Moderation
          </h3>
          <span className="text-xs font-semibold text-slate-400">{posts.length} posts</span>
        </div>

        {isPostsLoading ? (
          <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold text-slate-400">No posts found.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
            {posts.map((p) => (
              <div key={p._id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.user?.avatar || p.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
                    alt={p.user?.name || p.userName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.user?.name || p.userName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{truncate(p.content, 60)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePost(p._id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
