'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AskStormo() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch history when panel opens
  useEffect(() => {
    if (isOpen) {
      const fetchHistory = async () => {
        try {
          const res = await fetch('/api/ask-stormo/history');
          if (res.ok) {
            const data = await res.json();
            if (data.messages) {
              setMessages(data.messages);
            }
          }
        } catch (err) {
          console.error('Failed to load chat history:', err);
        }
      };
      fetchHistory();
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    // Add small delay to ensure rendering finished
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isAiTyping]);

  const suggestions = [
    'What should I focus on this week?',
    'How do I find micro-influencers for my store?',
    "What's working in my niche?",
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userText = text.trim();
    const updatedMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(updatedMessages);
    setInputText('');
    setError('');
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/ask-stormo/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from Stormo AI');
      }

      if (!response.body) {
        throw new Error('Streaming not supported by browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // Add a placeholder message for AI responses
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: '' }]);
      setIsAiTyping(false); // Token streaming has begun

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        // SSE chunks look like "data: {...}\n\n"
        const lines = chunkValue.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content += parsed.token;
                  }
                  return updated;
                });
              }
              if (parsed.error) {
                setError(parsed.error);
              }
            } catch (err) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setIsAiTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputText);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 bg-primary hover:bg-[#C4531A] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer relative group"
          title="Ask Stormo"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          {/* Tooltip */}
          {!isOpen && (
            <span className="absolute right-16 bg-dark text-white text-xs font-semibold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Ask Stormo
            </span>
          )}
        </button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 z-50 flex flex-col bg-white md:rounded-xl shadow-2xl overflow-hidden border border-gray-200 md:w-[400px] md:h-[500px] animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-[#C4531A] text-white p-4 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
              <h3 className="font-bold text-base">Ask Stormo</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-light-bg">
            {messages.length === 0 ? (
              /* Suggestions & Welcome */
              <div className="h-full flex flex-col justify-center items-center p-4 text-center space-y-6">
                <div>
                  <h4 className="font-bold text-dark text-base">How can I help you today?</h4>
                  <p className="text-subtle text-xs mt-1">
                    Ask me anything about your SaaS marketing campaigns, daily tasks, or audience strategy.
                  </p>
                </div>
                <div className="w-full space-y-2">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug)}
                      className="w-full text-left bg-white hover:bg-orange-tint border border-gray-200 hover:border-primary text-dark text-xs font-semibold rounded-lg p-3 transition-all cursor-pointer shadow-sm"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Logs */
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-dark rounded-tl-none border border-gray-100 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-dark rounded-2xl rounded-tl-none border border-gray-100 p-3 shadow-sm max-w-[85%] flex items-center gap-2 text-xs text-subtle">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      Claude is thinking...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-destructive text-xs rounded-xl text-center">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Stormo a question..."
                rows={2}
                className="flex-1 resize-none border-1.5 border-muted rounded-lg px-3 py-2 text-xs text-dark bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all max-h-16"
              />
              <button
                onClick={() => handleSend(inputText)}
                disabled={!inputText.trim() || isAiTyping}
                className="h-10 w-10 bg-primary hover:bg-[#C4531A] text-white rounded-lg flex items-center justify-center shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
