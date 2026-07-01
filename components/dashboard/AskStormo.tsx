'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const MAX_CHARS = 2000;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AskStormo() {
  const [isOpen, setIsOpen]         = useState(false);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [inputText, setInputText]   = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isStreaming, setStreaming]  = useState(false);
  const [error, setError]           = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch history once when panel first opens
  useEffect(() => {
    if (isOpen && !historyLoaded) {
      (async () => {
        try {
          const res = await fetch('/api/ask-stormo/history');
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.messages)) setMessages(data.messages);
          }
        } catch {
          // Non-fatal — user just starts with empty chat
        } finally {
          setHistoryLoaded(true);
        }
      })();
    }
  }, [isOpen, historyLoaded]);

  // Scroll to bottom on new messages or typing indicator
  useEffect(() => {
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(t);
  }, [messages, isAiTyping]);

  const suggestions = [
    'What should I focus on this week?',
    'How do I find micro-influencers for my store?',
    "What's working in my niche right now?",
  ];

  const handleClear = () => {
    setMessages([]);
    setError('');
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isAiTyping || isStreaming) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInputText('');
    setError('');
    setIsAiTyping(true);

    // Placeholder index so we can update it in-place
    let assistantIdx = -1;

    try {
      const response = await fetch('/api/ask-stormo/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to get a response from Stormo');
      }

      if (!response.body) throw new Error('Streaming not supported by this browser');

      // Add empty assistant placeholder and record its index
      setMessages((prev) => {
        assistantIdx = prev.length;
        return [...prev, { role: 'assistant', content: '' }];
      });
      setIsAiTyping(false);
      setStreaming(true);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let done      = false;
      let buffer    = '';
      let hasContent = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        // Accumulate in buffer to handle chunks split across line boundaries
        buffer += decoder.decode(value, { stream: !done });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep the last incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (parsed.token) {
              hasContent = true;
              setMessages((prev) => {
                const updated = [...prev];
                // Find last assistant message robustly
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].role === 'assistant') {
                    updated[i] = { ...updated[i], content: updated[i].content + parsed.token };
                    break;
                  }
                }
                return updated;
              });
            }

            if (parsed.error) {
              setError(parsed.error);
            }
          } catch {
            // Partial / malformed JSON in chunk — skip silently
          }
        }
      }

      // If stream ended with no content, remove the empty placeholder
      if (!hasContent) {
        setMessages((prev) => prev.filter((_, i) => i !== assistantIdx));
        setError('Stormo did not return a response. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(msg);
      setIsAiTyping(false);
      // Remove the empty assistant placeholder if it was added
      if (assistantIdx >= 0) {
        setMessages((prev) => prev.filter((_, i) => i !== assistantIdx));
      }
    } finally {
      setIsAiTyping(false);
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputText);
    }
  };

  const charsLeft   = MAX_CHARS - inputText.length;
  const overLimit   = charsLeft < 0;
  const isSending   = isAiTyping || isStreaming;
  const canSend     = inputText.trim().length > 0 && !overLimit && !isSending;

  return (
    <>
      {/* Floating Button */}
      <div id="tour-ask" className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="h-14 w-14 bg-primary hover:bg-[#C4531A] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer relative group"
          title="Ask Stormo"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          {!isOpen && (
            <span className="absolute right-16 bg-dark text-white text-xs font-semibold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Ask Stormo
            </span>
          )}
        </button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 z-50 flex flex-col bg-white md:rounded-xl shadow-2xl overflow-hidden border border-gray-200 md:w-[400px] md:h-[520px] animate-in slide-in-from-bottom duration-200">

          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-[#C4531A] text-white px-4 py-3 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
              <h3 className="font-bold text-sm">Ask Stormo</h3>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  title="Clear chat"
                  className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center p-4 text-center space-y-5">
                <div>
                  <h4 className="font-bold text-dark text-base">How can I help you today?</h4>
                  <p className="text-subtle text-xs mt-1">
                    Ask anything about marketing, your daily actions, or audience strategy.
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
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-dark rounded-tl-none border border-gray-100 shadow-sm'
                      }`}
                    >
                      {msg.content ? (
                        msg.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none
                            prose-headings:font-bold prose-headings:text-dark prose-headings:text-sm prose-headings:mt-2 prose-headings:mb-1
                            prose-p:text-dark/90 prose-p:leading-relaxed prose-p:my-1
                            prose-strong:text-dark prose-strong:font-bold
                            prose-li:text-dark/90 prose-li:my-0.5
                            prose-ul:my-1 prose-ol:my-1
                            prose-ul:pl-4 prose-ol:pl-4
                            [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )
                      ) : (
                        /* Empty placeholder during streaming — show cursor */
                        <span className="inline-block h-3 w-0.5 bg-primary animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                ))}

                {/* Thinking indicator — shown only before streaming starts */}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-dark rounded-2xl rounded-tl-none border border-gray-100 px-3 py-2.5 shadow-sm flex items-center gap-2 text-xs text-subtle">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      Stormo is thinking…
                    </div>
                  </div>
                )}

                {error && (
                  <div className="px-3 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value.slice(0, MAX_CHARS + 50)); // hard cap to prevent runaway
                    if (error) setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Stormo anything…"
                  rows={2}
                  className={`w-full resize-none rounded-lg px-3 py-2 text-xs text-dark bg-white border transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 max-h-24 ${
                    overLimit
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                      : 'border-gray-200 focus:border-primary'
                  }`}
                />
                {/* Char counter — only shows when nearing limit */}
                {inputText.length > MAX_CHARS * 0.8 && (
                  <span className={`absolute bottom-1.5 right-2 text-[10px] font-semibold ${
                    overLimit ? 'text-red-500' : 'text-subtle'
                  }`}>
                    {charsLeft}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleSend(inputText)}
                disabled={!canSend}
                className="h-9 w-9 bg-primary hover:bg-[#C4531A] text-white rounded-lg flex items-center justify-center shadow-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
              >
                {isSending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Send className="h-3.5 w-3.5" />
                }
              </button>
            </div>
            {overLimit && (
              <p className="text-[10px] text-red-500 mt-1 ml-1">
                Message too long — max {MAX_CHARS.toLocaleString()} characters
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
