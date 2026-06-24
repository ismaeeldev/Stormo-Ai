'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Send, CheckCircle2, Circle, Loader2, Sparkles, AlertCircle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Question {
  id: string;
  topic: number;
  type: 'welcome' | 'text' | 'choice' | 'multi-choice' | 'confirmation' | 'closing';
  text: string | ((answers: Record<string, any>) => string);
  options?: string[];
  key?: string;
  placeholder?: string;
}

const ONBOARDING_QUESTIONS: Question[] = [
  {
    id: 'welcome',
    topic: 1,
    type: 'welcome',
    text: "Welcome to Stormo. I'm your AI marketing advisor and I'm going to help you get customers, without spending money on ads. Before I build your personalized acquisition plan I need to learn about your store. This conversation will take between five and ten minutes. The more details you provide in your answers, the more personalized and powerful your AI acquisition plan will be.",
    options: ["Let's Go"],
  },
  // Topic 1
  {
    id: 't1_q1_url',
    topic: 1,
    type: 'text',
    text: "What is your store URL?",
    key: 'storeUrl',
    placeholder: "e.g. https://myawesomebrand.com",
  },
  {
    id: 't1_q2_platform',
    topic: 1,
    type: 'choice',
    text: "What platform is your store on?",
    options: ['Shopify', 'Etsy', 'WooCommerce', 'Squarespace', 'Wix', 'BigCommerce', 'Other, type your own'],
    key: 'storePlatform',
  },
  {
    id: 't1_q3_desc',
    topic: 1,
    type: 'text',
    text: "What do you sell? Describe your products in your own words.",
    key: 'productType',
    placeholder: "e.g. Handcrafted wooden watches, leather bags...",
  },
  {
    id: 't1_q4_live',
    topic: 1,
    type: 'choice',
    text: "How long has your store been live?",
    options: ['Just launched', '1–6 months', '6–12 months', 'Over a year'],
    key: 'storeLiveDuration',
  },
  {
    id: 't1_q5_price',
    topic: 1,
    type: 'choice',
    text: "What is your average product price?",
    options: ['Under $10', '$10–$25', '$25–$50', '$50–$100', '$100+'],
    key: 'priceRange',
  },
  {
    id: 't1_q6_media',
    topic: 1,
    type: 'choice',
    text: "Do you have photos or videos of your products ready to use?",
    options: ['Yes, photos and videos', 'Yes, photos only', 'Basic photos only', 'Not yet'],
    key: 'hasProductMedia',
  },
  {
    id: 't1_confirm',
    topic: 1,
    type: 'confirmation',
    text: (ans) => `Got it. You're selling ${ans.productType || 'products'} on ${ans.storePlatform || 'your platform'} and your store has been live for ${ans.storeLiveDuration || 'some time'}. Let me learn a bit more about your customers.`,
    options: ['Next Step'],
  },
  // Topic 2
  {
    id: 't2_q1_target',
    topic: 2,
    type: 'text',
    text: "Who is your target customer? Describe them in your own words, even a rough idea helps.",
    key: 'targetCustomer',
    placeholder: "e.g. Young professionals looking for unique minimalist styling...",
  },
  {
    id: 't2_q2_age',
    topic: 2,
    type: 'choice',
    text: "What is the age range of your ideal customer?",
    options: ['Under 18', '18–24', '25–34', '35–49', '50+', 'Any age, no specific demographic'],
    key: 'targetAgeRange',
  },
  {
    id: 't2_q3_gender',
    topic: 2,
    type: 'choice',
    text: "What is the gender of your ideal customer?",
    options: ['Mostly female', 'Mostly male', 'Both equally'],
    key: 'targetGender',
  },
  {
    id: 't2_q4_value',
    topic: 2,
    type: 'text',
    text: "What makes your product the right choice for your ideal customer? Think about why they would pick you over anything else.",
    key: 'valueProposition',
    placeholder: "e.g. Premium quality, organic materials, handmade with care...",
  },
  {
    id: 't2_confirm',
    topic: 2,
    type: 'confirmation',
    text: "Perfect. I have a clear picture of your ideal customer. Now let me understand where you are right now.",
    options: ['Next Step'],
  },
  // Topic 3
  {
    id: 't3_q1_sales',
    topic: 3,
    type: 'choice',
    text: "How many sales have you made so far?",
    options: ['Zero', '1–10', '11–50', '50+'],
    key: 'salesMade',
  },
  {
    id: 't3_q2_ads',
    topic: 3,
    type: 'choice',
    text: "Have you ever run paid ads before?",
    options: ["Yes, I've run ads before", "No, never run ads", "I tried but stopped"],
    key: 'runAdsBefore',
  },
  {
    id: 't3_q3_marketing',
    topic: 3,
    type: 'text',
    text: "What marketing have you already tried, if any, and what were the results?",
    key: 'marketingTried',
    placeholder: "e.g. Posted on social media but got low organic reach...",
  },
  {
    id: 't3_confirm',
    topic: 3,
    type: 'confirmation',
    text: "Thanks for being honest about where you are. That helps me build the right plan for you. Let's talk about your time and resources.",
    options: ['Next Step'],
  },
  // Topic 4
  {
    id: 't4_q1_time',
    topic: 4,
    type: 'choice',
    text: "How much time can you dedicate to marketing each day?",
    options: ['15 minutes', '30 minutes', '1 hour', '2+ hours'],
    key: 'weeklyTimeAvailable',
  },
  {
    id: 't4_q2_socials',
    topic: 4,
    type: 'multi-choice',
    text: "Which social platforms are you comfortable using?",
    options: ['TikTok', 'Instagram', 'Facebook', 'Pinterest', 'YouTube', 'X (Twitter)', 'LinkedIn', 'None yet'],
    key: 'socialPlatformsComfortable',
  },
  {
    id: 't4_q3_budget',
    topic: 4,
    type: 'choice',
    text: "What is your monthly marketing budget right now?",
    options: ['$0, organic only', 'Under $100', '$100–$500', '$500+'],
    key: 'monthlyBudget',
  },
  {
    id: 't4_q4_camera',
    topic: 4,
    type: 'choice',
    text: "Do you have a smartphone with a decent camera?",
    options: ['Yes', 'No', "I have a camera but it's not great"],
    key: 'hasSmartphoneCamera',
  },
  {
    id: 't4_q5_on_camera',
    topic: 4,
    type: 'choice',
    text: "Are you comfortable appearing on camera for videos or reels?",
    options: ["Yes, I'm comfortable on camera", "Maybe, I'd try it", "No, I prefer not to be on camera"],
    key: 'comfortableOnCamera',
  },
  {
    id: 't4_confirm',
    topic: 4,
    type: 'confirmation',
    text: "Perfect. I have everything I need. One last topic and then I will build your plan.",
    options: ['Next Step'],
  },
  // Topic 5
  {
    id: 't5_q1_success',
    topic: 5,
    type: 'text',
    text: "What does success look like for you in 90 days? Be specific.",
    key: 'currentChallenges',
    placeholder: "e.g. Getting my first 10 organic sales, post content daily...",
  },
  {
    id: 't5_q2_goal_type',
    topic: 5,
    type: 'choice',
    text: "Is this a side project or your main income goal?",
    options: ['Side project', 'Building toward full time', 'Already my main focus'],
    key: 'incomeGoalType',
  },
  {
    id: 't5_confirm',
    topic: 5,
    type: 'confirmation',
    text: "I have everything I need. Let me build your personalized acquisition plan now.",
    options: ['Next Step'],
  },
  {
    id: 'closing',
    topic: 5,
    type: 'closing',
    text: "Perfect. I have everything I need to build your personalized action plan. Let's get you more customers.",
    options: ['Build My Plan'],
  },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isWelcome?: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  // Custom text options
  const [showOtherPlatformInput, setShowOtherPlatformInput] = useState(false);
  const [otherPlatformText, setOtherPlatformText] = useState('');

  // Multi-select state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const topicSteps = [
    { id: 1, name: 'Your Store' },
    { id: 2, name: 'Your Customer' },
    { id: 3, name: 'Your Situation' },
    { id: 4, name: 'Your Capacity' },
    { id: 5, name: 'Your Goals' },
  ];

  // Set page title
  useEffect(() => {
    document.title = "Onboarding | Stormo.io";
  }, []);

  // Redirect if already completed
  useEffect(() => {
    if (session?.user) {
      const completed = (session.user as any).onboardingCompleted || false;
      if (completed) {
        router.push('/dashboard');
      }
    }
  }, [session]);

  // Load from localStorage (Refresh Resumability)
  useEffect(() => {
    const saved = localStorage.getItem('stormo_onboarding_state');
    if (saved) {
      try {
        const { index, ans, msgs } = JSON.parse(saved);
        setCurrentQuestionIndex(index);
        setAnswers(ans);
        setMessages(msgs);
      } catch (_) {}
    } else {
      // Initialize with first welcome question
      const welcomeQuestion = ONBOARDING_QUESTIONS[0];
      setMessages([
        { role: 'assistant', content: welcomeQuestion.text as string, isWelcome: true }
      ]);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (currentQuestionIndex > 0) {
      localStorage.setItem('stormo_onboarding_state', JSON.stringify({
        index: currentQuestionIndex,
        ans: answers,
        msgs: messages
      }));
    }
  }, [currentQuestionIndex, answers, messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];

  // Helper to check valid URL
  const isValidUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return pattern.test(url);
  };

  const handleNextQuestion = async (userAnswerText: string, rawAnswerValue: any) => {
    setError('');

    // Save answer
    if (currentQuestion.key) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.key!]: rawAnswerValue,
      }));
    }

    // Add user response to chat list
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userAnswerText },
    ];
    setMessages(updatedMessages);
    setInputText('');

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < ONBOARDING_QUESTIONS.length) {
      const nextQ = ONBOARDING_QUESTIONS[nextIndex];
      let nextQText = '';
      if (typeof nextQ.text === 'function') {
        // Merge the current answer so the function can access it
        const tempAnswers = { ...answers, [currentQuestion.key || '']: rawAnswerValue };
        nextQText = nextQ.text(tempAnswers);
      } else {
        nextQText = nextQ.text;
      }

      // Add assistant response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: nextQText }
        ]);
        setCurrentQuestionIndex(nextIndex);

        // Reset states for inputs
        setShowOtherPlatformInput(false);
        setOtherPlatformText('');
        setSelectedPlatforms([]);
      }, 600);
    }
  };

  const handleTextSubmit = () => {
    if (!inputText.trim()) return;

    // Validate URL for Q1
    if (currentQuestion.id === 't1_q1_url') {
      if (!isValidUrl(inputText.trim())) {
        setError('Please enter a valid store URL (e.g. https://mybrand.com).');
        return;
      }
    }

    handleNextQuestion(inputText.trim(), inputText.trim());
  };

  const handleChoiceSelect = (option: string) => {
    if (option === 'Other, type your own' && currentQuestion.id === 't1_q2_platform') {
      setShowOtherPlatformInput(true);
      return;
    }
    handleNextQuestion(option, option);
  };

  const handleOtherSubmit = () => {
    if (!otherPlatformText.trim()) return;
    handleNextQuestion(otherPlatformText.trim(), otherPlatformText.trim());
  };

  const handleMultiChoiceToggle = (option: string) => {
    if (option === 'None yet') {
      setSelectedPlatforms(['None yet']);
    } else {
      setSelectedPlatforms((prev) => {
        const filtered = prev.filter((p) => p !== 'None yet');
        if (filtered.includes(option)) {
          return filtered.filter((p) => p !== option);
        } else {
          return [...filtered, option];
        }
      });
    }
  };

  const handleMultiChoiceConfirm = () => {
    if (selectedPlatforms.length === 0) return;
    const value = selectedPlatforms.join(', ');
    handleNextQuestion(value, selectedPlatforms);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding on server');
      }

      // Explode confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Clear localStorage
      localStorage.removeItem('stormo_onboarding_state');

      // Update NextAuth session state
      await updateSession();

      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'An error occurred completing onboarding. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  // Determine current active topic tab index
  const activeTopic = currentQuestion ? currentQuestion.topic : 1;

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5] overflow-hidden">

      {/* ── Header ── */}
      <header className="h-16 bg-[#1A1A1A] border-b border-white/8 flex items-center justify-between px-5 sm:px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/stormo-logo.png" alt="Stormo Logo" className="h-10 sm:h-12 w-auto object-contain" />
          <div className="hidden sm:block h-4 w-px bg-white/15" />
          <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
            Store Setup
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-white/40 text-[11px] font-medium">
            Step {activeTopic} of 5
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`rounded-full transition-all duration-500 ${
                  n < activeTopic
                    ? 'h-2 w-6 bg-primary'
                    : n === activeTopic
                    ? 'h-2 w-6 bg-primary/50'
                    : 'h-2 w-2 bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar (desktop only) ── */}
        <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 p-6 flex-shrink-0 justify-between">
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Progress</p>
              <h2 className="font-extrabold text-dark text-lg mt-0.5">Build Your Store Profile</h2>
            </div>

            {/* Steps with connecting line */}
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[19px] top-8 bottom-4 w-px bg-gray-100 z-0" />

              <div className="space-y-1 relative z-10">
                {topicSteps.map((step) => {
                  const status =
                    step.id < activeTopic ? 'completed' : step.id === activeTopic ? 'active' : 'pending';
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        status === 'active'
                          ? 'bg-orange-tint border border-primary/15'
                          : ''
                      }`}
                    >
                      {/* Circle badge */}
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-extrabold border-2 transition-all duration-200 ${
                          status === 'completed'
                            ? 'bg-primary border-primary text-white shadow-sm'
                            : status === 'active'
                            ? 'bg-white border-primary text-primary shadow-sm shadow-primary/20'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        {status === 'completed' ? <Check className="h-4 w-4" /> : step.id}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider leading-none ${
                            status === 'active' ? 'text-primary' : status === 'completed' ? 'text-subtle' : 'text-subtle/60'
                          }`}
                        >
                          Topic {step.id}
                        </p>
                        <p
                          className={`text-sm font-semibold mt-0.5 truncate ${
                            status === 'active' ? 'text-dark' : status === 'completed' ? 'text-dark' : 'text-gray-400'
                          }`}
                        >
                          {step.name}
                        </p>
                      </div>

                      {status === 'active' && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-subtle leading-relaxed px-3 py-3 bg-gray-50 rounded-xl border border-gray-100">
            Your answers shape every action plan, content piece, and outreach strategy Stormo builds for you.
          </p>
        </aside>

        {/* ── Right Panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Mobile progress bar — single smooth fill */}
          <div className="md:hidden h-1 bg-gray-200 flex-shrink-0 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-[#C4531A] transition-all duration-700 ease-out"
              style={{ width: `${((activeTopic - 1) / 4) * 100 + 5}%` }}
            />
          </div>

          {/* ── Step guide header ── */}
          <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5 flex-shrink-0 z-10 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-dark text-sm leading-none">
                      {topicSteps.find((s) => s.id === activeTopic)?.name}
                    </h3>
                    <span className="hidden sm:inline text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                      {activeTopic} / 5
                    </span>
                  </div>
                  <p className="text-[11px] text-subtle mt-0.5 leading-tight">
                    {activeTopic === 1 && "Store URL, platform, pricing structure, and product assets."}
                    {activeTopic === 2 && "Understand who you sell to, their age, gender, and purchase motives."}
                    {activeTopic === 3 && "Where you are in growth: sales, advertising history, tried approaches."}
                    {activeTopic === 4 && "Your capacity, social channels, content comfort, and budget."}
                    {activeTopic === 5 && "Target metrics, side vs. main focus, and final review."}
                  </p>
                </div>
              </div>

              {/* Mobile step number pills */}
              <div className="md:hidden flex gap-1 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className={`h-6 w-6 rounded-full text-[9px] font-black flex items-center justify-center transition-all ${
                      n < activeTopic
                        ? 'bg-primary text-white'
                        : n === activeTopic
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {n < activeTopic ? <Check className="h-3 w-3" /> : n}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Chat messages ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Stormo avatar */}
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-full bg-[#1A1A1A] border border-gray-800 flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-[#C4531A] text-white rounded-br-sm'
                        : 'bg-white text-dark rounded-bl-sm border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.06)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {/* Submitting / success state */}
              {isSubmitting && (
                <div className="flex justify-center py-6">
                  <div className="bg-white border border-green-100 rounded-3xl p-8 text-center max-w-md shadow-[0_12px_40px_rgba(34,197,94,0.06)] flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shadow-sm animate-bounce">
                      <Sparkles className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-dark text-xl">Your dashboard is ready!</h3>
                      <p className="text-subtle text-sm mt-2 leading-relaxed">
                        Onboarding complete. Generating your tailored marketing plan. Redirecting you in just a moment...
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-green-600 font-bold mt-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finalizing setup...
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-destructive text-sm rounded-2xl flex items-center justify-center gap-2 max-w-md mx-auto">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── Action area (buttons / inputs) ── */}
          {currentQuestion && !isSubmitting && (
            <div className="bg-white border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-col items-center gap-3 flex-shrink-0 z-10 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">

              {/* Choice buttons */}
              {currentQuestion.type === 'choice' && !showOtherPlatformInput && (
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl w-full">
                  {currentQuestion.options?.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleChoiceSelect(opt)}
                      className="bg-white hover:bg-orange-tint text-dark hover:text-primary font-semibold text-xs border border-gray-200 hover:border-primary/40 rounded-2xl px-4 py-2.5 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.97]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Welcome button */}
              {currentQuestion.type === 'welcome' && (
                <button
                  onClick={() => handleNextQuestion("Let's Go", true)}
                  className="bg-primary hover:bg-[#C4531A] text-white font-bold text-sm rounded-2xl px-10 py-3 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.97]"
                >
                  Let's Go →
                </button>
              )}

              {/* Confirmation button */}
              {currentQuestion.type === 'confirmation' && (
                <button
                  onClick={() => handleNextQuestion("Next Step", true)}
                  className="bg-primary hover:bg-[#C4531A] text-white font-bold text-sm rounded-2xl px-10 py-3 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.97]"
                >
                  Continue →
                </button>
              )}

              {/* Closing / Build My Plan button */}
              {currentQuestion.type === 'closing' && (
                <button
                  onClick={handleFinish}
                  className="bg-primary hover:bg-[#C4531A] text-white font-bold text-sm rounded-2xl px-10 py-3 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.97] flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Build My Plan
                </button>
              )}

              {/* Multi-choice */}
              {currentQuestion.type === 'multi-choice' && (
                <div className="flex flex-col items-center gap-3 w-full max-w-2xl">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {currentQuestion.options?.map((opt) => {
                      const isSelected = selectedPlatforms.includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => handleMultiChoiceToggle(opt)}
                          className={`font-semibold text-xs border rounded-2xl px-4 py-2.5 transition-all cursor-pointer active:scale-[0.97] flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary border-primary text-white shadow-md'
                              : 'bg-white border-gray-200 text-dark hover:bg-orange-tint hover:border-primary/40 shadow-sm'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleMultiChoiceConfirm}
                    disabled={selectedPlatforms.length === 0}
                    className="bg-primary hover:bg-[#C4531A] text-white font-bold text-xs rounded-2xl px-8 py-2.5 transition-all cursor-pointer shadow-md active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Selection →
                  </button>
                </div>
              )}

              {/* Other platform input */}
              {showOtherPlatformInput && (
                <div className="flex items-center gap-3 w-full max-w-md">
                  <input
                    type="text"
                    value={otherPlatformText}
                    onChange={(e) => setOtherPlatformText(e.target.value)}
                    placeholder="Enter platform (e.g. WooCommerce)..."
                    className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                  <button
                    onClick={handleOtherSubmit}
                    disabled={!otherPlatformText.trim()}
                    className="bg-primary hover:bg-[#C4531A] text-white font-bold text-xs rounded-2xl px-5 py-2.5 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.97]"
                  >
                    Submit
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ── Free-text input ── */}
          {currentQuestion && currentQuestion.type === 'text' && !isSubmitting && (
            <div className="px-4 sm:px-6 pb-4 pt-0 bg-white flex-shrink-0 z-10">
              <div className="max-w-3xl mx-auto flex items-end gap-2.5">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentQuestion.placeholder || "Type your answer..."}
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-3 text-sm text-dark bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all max-h-24 min-h-[46px] placeholder:text-gray-400"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!inputText.trim()}
                  className="h-11 w-11 bg-primary hover:bg-[#C4531A] text-white rounded-2xl flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-40 active:scale-[0.95] flex-shrink-0"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
