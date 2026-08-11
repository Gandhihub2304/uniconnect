'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, DollarSign, Users, Image as ImageIcon, X, Send } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet, apiPost } from '@/lib/api';

export const EventsView: React.FC = () => {
  const { user } = useAppStore();
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('College');
  const [image, setImage] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await apiGet('/api/events');
      if (data.success && data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location) return;

    setIsLoading(true);
    try {
      const data = await apiPost('/api/events', {
        title,
        date: date || '15 JUN',
        time: time || '06:00 PM',
        location,
        category,
        image: image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600',
        expenses: expenseTitle && expenseAmount ? [{ title: expenseTitle, amount: Number(expenseAmount), paidBy: user?.name || 'Manoj Gandhi' }] : []
      });

      if (data.success) {
        fetchEvents();
        setTitle('');
        setLocation('');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRSVP = async (evtId: string) => {
    try {
      const data = await apiPost(`/api/events/${evtId}/rsvp`);
      if (data.success) {
        setEvents(prev => prev.map(e => {
          if (e._id === evtId) {
            return { ...e, attendeesCount: data.attendeesCount, attendees: data.event?.attendees ?? e.attendees };
          }
          return e;
        }));
      }
    } catch (err) {
      console.error('Failed to RSVP for event:', err);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Event Planner</h1>
          <p className="text-xs text-slate-500 font-medium">Schedule events, split expenses, and share albums with friends</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md"
        >
          <Plus className="w-3.5 h-3.5" /> Create Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {events.map(evt => {
          const isAttending = !!(evt.attendees && user?._id && evt.attendees.includes(user._id));
          return (
          <div key={evt._id} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="h-44 rounded-2xl overflow-hidden relative">
              <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md">
                {evt.category}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{evt.title}</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {evt.date}, {evt.time}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-rose-500" /> {evt.location}</span>
              </div>
            </div>

            {/* Expense Split Summary */}
            {evt.expenses && evt.expenses.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-1 border border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Expense Splitter</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ₹{evt.expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0)} Total
                  </span>
                </div>
                {evt.expenses.map((exp: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px] text-slate-500">
                    <span>{exp.title} ({exp.paidBy})</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">₹{exp.amount}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleRSVP(evt._id)}
                className={`flex-1 py-2 font-bold text-xs rounded-xl transition-all ${
                  isAttending ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isAttending ? 'RSVP Confirmed ✓' : `RSVP Going (${evt.attendeesCount || 0})`}
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Create New Event</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Event Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Badminton Match / College Party"
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Date</label>
                  <input 
                    type="text" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    placeholder="25 MAY"
                    className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Time</label>
                  <input 
                    type="text" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                    placeholder="10:00 AM"
                    className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Location *</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="Main Sports Complex / Campus Hub"
                  className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Expense Title</label>
                  <input 
                    type="text" 
                    value={expenseTitle} 
                    onChange={(e) => setExpenseTitle(e.target.value)} 
                    placeholder="Court Booking"
                    className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Expense Amount (₹)</label>
                  <input 
                    type="number" 
                    value={expenseAmount} 
                    onChange={(e) => setExpenseAmount(e.target.value)} 
                    placeholder="1500"
                    className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreateEvent}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Creating Event...' : 'Publish Event'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
