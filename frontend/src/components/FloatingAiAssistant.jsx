import React, { useState } from 'react';
import { api } from '../utils/api';
import { Sparkles, Bot, Send, X, MessageSquare, ArrowRight, Minimize2 } from 'lucide-react';

const FloatingAiAssistant = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hi ${user?.name || 'there'}! I am your AI Financial Copilot. Ask me anything about collections, branch totals, or student dues!`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "What is total collection today?",
    "Which branch has highest dues?",
    "Show payment mode split"
  ];

  const handleSend = async (queryText = null) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await api.post('/ai/assistant', { question: textToSend });
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: response.answer
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "⚠️ Sorry, I could not connect to Gemini AI right now."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print">
      {/* Floating Chat Modal Popup */}
      {isOpen && (
        <div className="mb-3 w-84 sm:w-96 glass-panel rounded-2xl border border-violet-500/30 shadow-2xl shadow-violet-950/80 flex flex-col h-[460px] overflow-hidden animate-scale-in bg-[#12111d]/95 backdrop-blur-xl">
          {/* Header */}
          <div className="p-3.5 border-b border-white/[0.08] bg-gradient-to-r from-violet-950/60 to-purple-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-violet-600 rounded-lg text-white shadow-md shadow-violet-600/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Financial AI Copilot</h4>
                <span className="text-[9px] text-emerald-400 font-mono">● Grounded in Live Data</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="px-3 py-2 border-b border-white/[0.04] bg-white/[0.01] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap text-[10px] bg-white/[0.03] hover:bg-violet-600/20 text-gray-300 hover:text-violet-300 px-2 py-1 rounded-md border border-white/[0.05] transition shrink-0 cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5 border border-violet-500/20">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-xl text-[11px] max-w-[82%] leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-white/[0.04] border border-white/[0.06] text-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-2 justify-start">
                <div className="w-6 h-6 rounded-md bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-[11px] text-gray-400 rounded-tl-none">
                  Analyzing accounts data...
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="p-2.5 border-t border-white/[0.06] bg-black/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask financial question..."
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full shadow-xl shadow-violet-950/80 border border-violet-400/40 hover:scale-105 transition-all duration-200 cursor-pointer group"
      >
        <Bot className="w-5 h-5 text-white group-hover:rotate-6 transition-transform" />
        <span className="text-xs font-bold tracking-wide">AI Assistant</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
      </button>
    </div>
  );
};

export default FloatingAiAssistant;
