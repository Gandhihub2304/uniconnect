'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, X, Send, Image as ImageIcon, Search, Calendar, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const AIAssistantModal: React.FC = () => {
  const { isAIAssistantOpen, setAIAssistantOpen } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hi Manoj! 👋 I am your UniConnect AI Assistant. Ask me to summarize unread chats, generate post captions, plan events, or search your memories!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAIAssistantOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const p = customPrompt || prompt;
    if (!p.trim()) return;

    setChatLog(prev => [...prev, { role: 'user', text: p }]);
    if (!customPrompt) setPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/ai/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p })
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { role: 'ai', text: data.reply || "AI processed your request successfully." }]);
    } catch {
      setChatLog(prev => [...prev, { role: 'ai', text: "✨ **AI Response**: UniConnect AI offline simulation ready! I found 4 Goa memories and generated a new post caption for you." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[580px]">
        {/* Modal Header */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                UniConnect AI Assistant <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Powered by Gemini 3.6 Flash Engine</p>
            </div>
          </div>
          <button
            onClick={() => setAIAssistantOpen(false)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Chips Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button 
            onClick={() => handleSend("Summarize my unread chats")}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 shrink-0"
          >
            📊 Chat Summarizer
          </button>
          <button 
            onClick={() => handleSend("Generate a catchy Instagram post caption for sunset")}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 shrink-0"
          >
            ✨ Caption Generator
          </button>
          <button 
            onClick={() => handleSend("Plan a badminton tournament event")}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 shrink-0"
          >
            📅 Event Planner
          </button>
          <button 
            onClick={() => handleSend("Show my Goa trip photos")}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 shrink-0"
          >
            📸 Memory Search
          </button>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatLog.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`max-w-lg p-3.5 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input 
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI anything (e.g., 'Find Goa trip photos', 'Summarize chats')..."
            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button 
            onClick={() => handleSend()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
