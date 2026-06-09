'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Tag,
  BookOpen,
  FileText,
  Compass,
  Copy,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const InstagramIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface ContentItem {
  id: string;
  contentType: string;
  title: string;
  content: string;
  weekStart: string;
  createdAt: string;
}

interface PastWeek {
  weekStart: string;
  items: ContentItem[];
}

const LABEL_MAP: Record<string, string> = {
  instagram: 'Instagram Post',
  email: 'Outreach Email',
  product_description: 'Product Description',
  blog: 'Blog Outline',
  pinterest: 'Pinterest Pin',
  reddit: 'Reddit Post',
};

function getOfficialBrandIconUrl(contentType: string): string {
  switch (contentType.toLowerCase()) {
    case 'instagram':
      return 'https://cdn.simpleicons.org/instagram/E1306C';
    case 'email':
      return 'https://cdn.simpleicons.org/gmail/D44638';
    case 'product_description':
      return 'https://cdn.simpleicons.org/shopify/7AB55C';
    case 'blog':
      return 'https://cdn.simpleicons.org/wordpress/21759B';
    case 'pinterest':
      return 'https://cdn.simpleicons.org/pinterest/BD081C';
    case 'reddit':
      return 'https://cdn.simpleicons.org/reddit/FF4500';
    default:
      return 'https://cdn.simpleicons.org/gitbook/3884FF';
  }
}

export default function MyContentPage() {
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<ContentItem[]>([]);
  const [previousWeeks, setPreviousWeeks] = useState<PastWeek[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "My Content | Stormo.io Dashboard";
    let isMounted = true;
    let pollInterval: any = null;

    async function fetchData() {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const cur = data.currentWeek || [];
            const prev = data.previousWeeks || [];
            setCurrentWeek(cur);
            setPreviousWeeks(prev);
            
            if (cur.length > 0 || prev.length > 0) {
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
            } else {
              if (!pollInterval) {
                pollInterval = setInterval(fetchData, 4000);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch content:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchData();

    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const toggleWeek = (weekStart: string) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekStart]: !prev[weekStart],
    }));
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-subtle text-sm">Loading content hub...</p>
      </div>
    );
  }

  // If no content generated yet
  if (currentWeek.length === 0 && previousWeeks.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4">
        <div>
          <h1 className="text-3xl font-bold text-dark">My Content</h1>
          <p className="text-subtle text-sm mt-1">Review and manage your generated weekly marketing material</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border-t-3 border-primary p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[350px]">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <h2 className="text-xl font-bold text-dark">Your content is being generated...</h2>
          <p className="text-subtle text-sm max-w-md">
            Our AI engine is crafting tailored social copy, emails, blog outlines, and description assets for your store. This usually takes less than a minute.
          </p>
        </div>
      </div>
    );
  }

  const formatWeekRange = (weekStartStr: string) => {
    const start = new Date(weekStartStr);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `Week of ${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const ContentGrid = ({ items }: { items: ContentItem[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const iconUrl = getOfficialBrandIconUrl(item.contentType);
        return (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-md border-t-3 border-primary p-5 flex flex-col justify-between hover:shadow-lg transition-all hover:-translate-y-0.5 duration-200"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={iconUrl} className="h-4.5 w-4.5 object-contain" alt={item.contentType} />
                <span className="text-xs font-bold uppercase tracking-wider text-dark/70">
                  {item.contentType === 'instagram' ? 'Instagram Post' :
                   item.contentType === 'email' ? 'Outreach Email' :
                   item.contentType === 'product_description' ? 'Product Description' :
                   item.contentType === 'blog' ? 'Blog Outline' :
                   item.contentType === 'pinterest' ? 'Pinterest Pin' :
                   item.contentType === 'reddit' ? 'Reddit Post' : item.contentType}
                </span>
              </div>
              <h3 className="font-bold text-dark text-base line-clamp-1 mb-2">
                {item.title}
              </h3>
              <p className="text-subtle text-xs leading-relaxed line-clamp-3 mb-4">
                {item.content}
              </p>
            </div>
            <button
              onClick={() => {
                setActiveItem(item);
                setCopied(false);
              }}
              className="w-full py-2 px-4 border border-primary text-primary hover:bg-orange-tint text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
            >
              View & Copy
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-dark">My Content</h1>
        <p className="text-subtle text-sm mt-1">Review and manage your generated weekly marketing material</p>
      </div>

      {/* This Week's Content */}
      {currentWeek.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h2 className="text-xl font-bold text-dark">This Week's Content</h2>
            <span className="text-xs font-semibold bg-orange-tint text-primary px-3 py-1 rounded-full">
              {formatWeekRange(currentWeek[0].weekStart)}
            </span>
          </div>
          <ContentGrid items={currentWeek} />
        </section>
      )}

      {/* Previous Weeks Accordion */}
      {previousWeeks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-dark border-b border-gray-200 pb-2">Previous Weeks</h2>
          <div className="space-y-3">
            {previousWeeks.map((week) => {
              const isExpanded = !!expandedWeeks[week.weekStart];
              return (
                <div key={week.weekStart} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleWeek(week.weekStart)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/80 transition-colors text-left cursor-pointer"
                  >
                    <span className="font-bold text-dark text-sm">
                      {formatWeekRange(week.weekStart)}
                    </span>
                    <div className="flex items-center gap-2 text-subtle text-xs">
                      <span>{week.items.length} pieces</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-6 bg-light-bg border-t border-gray-200 animate-in fade-in duration-200">
                      <ContentGrid items={week.items} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* View & Copy Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-[#C4531A] text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded">
                  {LABEL_MAP[activeItem.contentType] || activeItem.contentType}
                </span>
                <h3 className="font-bold text-lg mt-1 truncate max-w-md">{activeItem.title}</h3>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-light-bg">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs min-h-[150px] text-dark text-sm leading-relaxed font-sans space-y-4">
                <ReactMarkdown>{activeItem.content}</ReactMarkdown>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
              <span className="text-[11px] text-subtle font-medium">
                Generated: {new Date(activeItem.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </span>
              <button
                onClick={() => handleCopy(activeItem.content)}
                className={`flex items-center gap-2 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-md ${
                  copied
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-primary hover:bg-[#C4531A] text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied! ✓
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
