'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Zap, Send, CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type StepStatus = 'pending' | 'active' | 'completed';

interface TopicStep {
  id: number;
  name: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! Welcome to Stormo.io. I'm your AI marketing copilot. Let's get your store set up. To start, what is the URL of your e-commerce store, and which platform (Shopify, WooCommerce, etc.) do you use?",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [currentTopic, setCurrentTopic] = useState<number>(1);
  const [topicStatuses, setTopicStatuses] = useState<Record<number, StepStatus>>({
    1: 'active',
    2: 'pending',
    3: 'pending',
    4: 'pending',
    5: 'pending',
  });
  
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isOnboardingFinished, setIsOnboardingFinished] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const topicSteps: TopicStep[] = [
    { id: 1, name: 'Your Store' },
    { id: 2, name: 'Products & Pricing' },
    { id: 3, name: 'Your Customer' },
    { id: 4, name: 'Your Time' },
    { id: 5, name: 'Your Challenges' },
  ];

  // Adjust onboarding step if session loads steps
  useEffect(() => {
    if (session?.user) {
      const step = (session.user as any).onboardingStep || 1;
      const completed = (session.user as any).onboardingCompleted || false;
      
      if (completed) {
        router.push('/dashboard');
        return;
      }
      
      setCurrentTopic(step);
      setTopicStatuses((prev) => {
        const updated = { ...prev };
        for (let i = 1; i <= 5; i++) {
          if (i < step) updated[i] = 'completed';
          else if (i === step) updated[i] = 'active';
          else updated[i] = 'pending';
        }
        return updated;
      });
    }
  }, [session]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || isAiTyping) return;

    const userText = inputText.trim();
    const updatedMessages: Message[] = [...messages, { role: 'user' as const, content: userText }];
    setMessages(updatedMessages);
    setInputText('');
    setError('');
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/onboarding/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          currentTopic,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from onboarding AI');
      }

      if (!response.body) {
        throw new Error('Readable stream not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // Add a placeholder message for AI responses
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      setIsAiTyping(false); // Token streaming has begun

      let lastNextTopic = currentTopic;
      let isTopicComplete = false;

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

              if (parsed.topicComplete) {
                isTopicComplete = true;
                lastNextTopic = parsed.nextTopic;
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

      // Handle Topic Advancement
      if (isTopicComplete) {
        if (currentTopic < 5) {
          setTopicStatuses((prev) => {
            const updated = { ...prev };
            updated[currentTopic] = 'completed';
            updated[lastNextTopic] = 'active';
            return updated;
          });
          setCurrentTopic(lastNextTopic);
        } else if (currentTopic === 5) {
          setTopicStatuses((prev) => ({ ...prev, 5: 'completed' }));
          setIsOnboardingFinished(true);
          
          // Trigger confetti!
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          });

          // Sync session state to onboardingComplete = true
          await updateSession();

          // Auto-redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 2500);
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
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-light-bg overflow-hidden">
      {/* Top Header Panel */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary fill-primary" />
          <span className="text-xl font-bold text-dark">Stormo.io Onboarding</span>
        </div>
        <div className="text-right">
          <h1 className="text-sm font-bold text-dark">Let's set up your store</h1>
          <p className="text-xs text-subtle">This takes about 10 minutes</p>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Topic Steps Sidebar (Desktop Only) */}
        <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 p-6 flex-shrink-0 justify-between">
          <div className="space-y-6">
            <h2 className="font-bold text-dark text-lg border-b border-gray-100 pb-3">Onboarding Steps</h2>
            <div className="space-y-4">
              {topicSteps.map((step) => {
                const status = topicStatuses[step.id] || 'pending';
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      status === 'active'
                        ? 'bg-orange-tint text-primary font-bold shadow-sm border border-primary/20'
                        : status === 'completed'
                        ? 'text-dark font-medium'
                        : 'text-muted font-normal'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-primary fill-orange-tint" />
                    ) : status === 'active' ? (
                      <Circle className="h-5 w-5 text-primary fill-white animate-pulse" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted" />
                    )}
                    <div className="text-sm">
                      <p className="text-[10px] text-subtle uppercase tracking-wider font-semibold">
                        Step {step.id}
                      </p>
                      <p className="mt-0.5">{step.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-xs text-subtle p-3 bg-light-bg rounded-lg border border-gray-100">
            Powered by Claude 3.5 Sonnet to establish your brand profile.
          </div>
        </aside>

        {/* Right Main Interface */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile Top Progress Bar */}
          <div className="md:hidden flex h-2 bg-gray-200 flex-shrink-0">
            {topicSteps.map((step) => {
              const status = topicStatuses[step.id] || 'pending';
              return (
                <div
                  key={step.id}
                  className={`flex-1 border-r border-white last:border-0 transition-colors ${
                    status === 'completed'
                      ? 'bg-primary'
                      : status === 'active'
                      ? 'bg-primary/50'
                      : 'bg-gray-200'
                  }`}
                ></div>
              );
            })}
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white text-dark rounded-tl-none border border-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-dark rounded-2xl rounded-tl-none border border-gray-100 p-4 shadow-sm max-w-[80%] flex items-center gap-2 text-sm text-subtle">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Claude is thinking...
                  </div>
                </div>
              )}

              {isOnboardingFinished && (
                <div className="flex justify-center py-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center max-w-sm shadow-md flex flex-col items-center gap-3">
                    <Sparkles className="h-10 w-10 text-green-600 animate-bounce" />
                    <div>
                      <h3 className="font-extrabold text-green-800 text-lg">Your plan is ready!</h3>
                      <p className="text-green-600 text-sm mt-1">
                        Onboarding complete. Redirecting you to your marketing dashboard...
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-destructive text-sm rounded-xl text-center">
                  {error}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Chat Input Form Area */}
          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAiTyping || isOnboardingFinished}
                placeholder={isOnboardingFinished ? "Onboarding complete!" : "Type your message..."}
                rows={1}
                className="flex-1 resize-none border-1.5 border-muted rounded-xl px-4 py-3 text-sm text-dark bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all max-h-24 min-h-[46px] disabled:opacity-50 disabled:bg-gray-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isAiTyping || isOnboardingFinished}
                className="h-11 w-11 bg-primary hover:bg-[#C4531A] text-white rounded-xl flex items-center justify-center shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
