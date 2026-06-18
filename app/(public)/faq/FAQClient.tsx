'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  User, 
  HelpCircle, 
  RefreshCw, 
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Settings,
  Sparkles
} from 'lucide-react';

const faqs = [
  {
    q: "What is Stormo?",
    a: "Stormo (Store Momentum) is an AI marketing manager built specifically for ecommerce store owners. It learns about your store, products, and customers to deliver one focused, actionable marketing task every day—helping you drive organic traffic and sales without wasting budget on complex ads.",
    category: "General"
  },
  {
    q: "How is Stormo different from other marketing tools?",
    a: "Unlike dashboards that just show data, Stormo acts like a real marketing manager. It tells you exactly what to do, when to do it, and how to execute. No learning curves, no marketing degree, and zero ad spend required to get started.",
    category: "Difference"
  },
  {
    q: "Do I need a marketing background to use Stormo?",
    a: "Not at all. Stormo is built for store owners, not marketers. Whether you are a complete beginner or have tried marketing before without success, Stormo guides you step-by-step with clear, jargon-free tasks.",
    category: "General"
  },
  {
    q: "What platforms does Stormo work with?",
    a: "Stormo connects with all major ecommerce platforms, including Shopify, WooCommerce, Etsy, Squarespace, Wix, and BigCommerce. If you sell online, Stormo is built for you.",
    category: "Technical"
  },
  {
    q: "Do I need a big budget to use Stormo?",
    a: "No! Stormo's Starter plan focuses entirely on organic growth strategies that cost $0. When your business gains traction and you unlock the Growth tier, Stormo will then guide you on scaling efficiently with paid ads.",
    category: "Pricing"
  },
  {
    q: "What happens after the $9 trial?",
    a: "After your 30-day trial for $9, you'll transition to the Starter plan at $29/mo. We'll send you a reminder before the transition, and you can cancel anytime with a single click in your settings.",
    category: "Pricing"
  },
  {
    q: "When will I start seeing results?",
    a: "Most owners see early signals (increased search visibility, profile clicks, and engagement) within 30 days. Meaningful sales growth typically compounds over 60 to 90 days of consistent daily action.",
    category: "Growth"
  },
  {
    q: "What is the Growth tier and how do I unlock it?",
    a: "The Growth tier ($39/mo) unlocks automatically after your store achieves 10 sales. It includes multi-channel campaign automation, paid ads guidance, opportunity queues, and priority support. We build your organic foundation first so ad spend isn't wasted.",
    category: "Growth"
  }
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isThinking?: boolean;
}

export default function FAQClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "👋 Hi there! I'm the Stormo AI Assistant. Pick one of the questions on the side or top, and I will write the answer for you in real-time!"
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [typingText, setTypingText] = useState('');
  
  const chatViewportRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll chat box on typing/state change
  useEffect(() => {
    if (chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
    }
  }, [messages, isThinking, typingText]);

  // Handle bot typing animation
  const startTypingEffect = (fullText: string, messageId: string) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    
    setTypingMessageId(messageId);
    setTypingText('');
    
    let index = 0;
    const words = fullText.split(' ');
    
    typingIntervalRef.current = setInterval(() => {
      if (index < words.length) {
        setTypingText((prev) => prev + (prev ? ' ' : '') + words[index]);
        index++;
      } else {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        // Commit typed message to messages state and reset typing state
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === messageId ? { ...msg, text: fullText } : msg
          )
        );
        setTypingMessageId(null);
        setTypingText('');
      }
    }, 30); // Speed optimized typing
  };

  const handleAskQuestion = (question: string, answer: string) => {
    if (isThinking || typingMessageId) return;

    // Smoothly scroll the chat container into the center of the screen when clicked (Fluctuate effect)
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add user message
    const userMsgId = Date.now().toString();
    const botMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: question }
    ]);

    // Trigger AI thinking state
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      
      // Insert placeholder for bot message
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, sender: 'bot', text: '' }
      ]);

      // Start typing answer
      startTypingEffect(answer, botMsgId);
    }, 800); // Optimized delay for faster interaction
  };

  const handleReset = () => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setTypingMessageId(null);
    setTypingText('');
    setIsThinking(false);
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: "👋 Hi there! I'm the Stormo AI Assistant. Pick one of the questions on the side or top, and I will write the answer for you in real-time!"
      }
    ]);
  };

  return (
    <div className="bg-[#0D0D0E] min-h-screen text-white font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none select-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none select-none z-0"></div>

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 relative z-10 flex-grow flex flex-col">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Interactive AI Assistant</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base mt-3">
            Click on any topic below to query the Stormo AI Assistant.
          </p>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-grow">
          
          {/* LEFT PANEL: Predefined Prompts List (Responsive: Top scrolling chips on Mobile) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="hidden lg:flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider text-white/50 mb-1">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Select a Topic</span>
            </div>

            {/* Scrollable grid for prompts */}
            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-none snap-x snap-mandatory">
              {faqs.map((faq, index) => {
                const getIcon = (cat: string) => {
                  switch (cat) {
                    case 'Pricing': return <ShieldCheck className="h-4 w-4 text-primary" />;
                    case 'Growth': return <TrendingUp className="h-4 w-4 text-primary" />;
                    case 'Technical': return <Settings className="h-4 w-4 text-primary" />;
                    default: return <HelpCircle className="h-4 w-4 text-primary" />;
                  }
                };

                return (
                  <button
                    key={index}
                    onClick={() => handleAskQuestion(faq.q, faq.a)}
                    disabled={isThinking || !!typingMessageId}
                    className="flex-shrink-0 w-[260px] lg:w-full snap-start text-left bg-[#161618] hover:bg-[#1E1E22] active:bg-[#222226] border border-[#26262A] hover:border-primary/40 rounded-2xl p-4 transition-all duration-300 group flex items-start gap-3.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-[#222226] group-hover:bg-primary/10 transition-colors mt-0.5">
                      {getIcon(faq.category)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-0.5">{faq.category}</p>
                      <h3 className="text-sm font-bold text-white leading-snug group-hover:text-primary transition-colors truncate lg:whitespace-normal">
                        {faq.q}
                      </h3>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-primary transition-colors mt-3 hidden lg:block" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: The AI Chatbot Window */}
          <div 
            ref={chatContainerRef} 
            className="lg:col-span-7 flex flex-col bg-[#111112] border border-[#202023] rounded-3xl overflow-hidden shadow-2xl relative min-h-[500px]"
          >
            {/* Chatbot Header */}
            <div className="px-6 py-4 bg-[#161618] border-b border-[#202023] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#161618] animate-pulse"></span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Stormo Copilot</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">AI Assistant ready</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleReset}
                title="Restart Chat"
                className="p-2.5 rounded-xl bg-[#202023] hover:bg-[#28282C] text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Chat messages viewport */}
            <div 
              ref={chatViewportRef} 
              className="flex-grow overflow-y-auto px-6 py-6 space-y-4 max-h-[440px] sm:max-h-[500px] scrollbar-thin scroll-smooth"
            >
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                const isTyping = msg.id === typingMessageId;
                const displayText = isTyping ? typingText : msg.text;

                return (
                  <div key={msg.id} className={`flex gap-3.5 ${!isBot ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`p-2 h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
                      isBot 
                        ? 'bg-primary/10 text-primary border border-primary/10' 
                        : 'bg-white/10 text-white border border-white/5'
                    }`}>
                      {isBot ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                    </div>

                    {/* Chat Bubble */}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isBot 
                        ? 'bg-[#18181A] border border-[#242428] text-white/90 shadow-sm' 
                        : 'bg-primary text-white font-medium shadow-lg'
                    }`}>
                      {displayText ? (
                        <p>{displayText}</p>
                      ) : (
                        // Loader if typing just started or empty placeholder
                        <div className="flex items-center gap-1 py-1">
                          <span className="h-1.5 w-1.5 bg-white/40 rounded-full animate-bounce"></span>
                          <span className="h-1.5 w-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="h-1.5 w-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Thinking Bubble */}
              {isThinking && (
                <div className="flex gap-3.5">
                  <div className="p-2 h-9 w-9 rounded-xl flex-shrink-0 bg-primary/10 text-primary border border-primary/10 flex items-center justify-center">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div className="bg-[#18181A] border border-[#242428] text-white/60 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                    <span className="text-xs font-medium italic">Stormo AI is formulating response</span>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></span>
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Closing CTA */}
        <section className="text-center mt-20 pt-12 border-t border-[#202023]">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary mb-3">
            Ready to get started?
          </h2>
          <p className="text-white text-lg sm:text-xl font-medium mb-10">
            Let&apos;s get you more customers.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-primary hover:bg-[#D45214] text-white font-bold rounded-2xl px-10 py-4.5 text-base transition-all duration-200 shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5"
          >
            Start for $9
          </Link>
        </section>
      </div>
    </div>
  );
}
