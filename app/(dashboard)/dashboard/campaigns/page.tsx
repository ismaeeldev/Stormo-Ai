'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Plus,
  X,
  Loader2,
  Check,
  ChevronRight,
  TrendingUp,
  Tag,
  BookOpen,
  Mail,
} from 'lucide-react';

interface CampaignPlan {
  eventName: string;
  eventDate: string;
  campaignName: string;
  overview: string;
  suggestedActions: string[];
  contentIdeas: string[];
}

interface StoreProfile {
  productType: string | null;
  targetCustomer: string | null;
  nicheSummary: string | null;
}

const EVENTS = [
  { id: '1', date: '2026-07-04', title: 'Independence Day (US)', color: 'bg-red-500 text-white', category: 'General / Patriotic' },
  { id: '2', date: '2026-07-14', title: 'Amazon Prime Day', color: 'bg-amber-500 text-dark', category: 'Retail' },
  { id: '3', date: '2026-07-25', title: 'Back to School Starts', color: 'bg-blue-500 text-white', category: 'Apparel / Education' },
  { id: '4', date: '2026-08-15', title: 'Back to School Peak', color: 'bg-indigo-600 text-white', category: 'Apparel / Education' },
  { id: '5', date: '2026-08-26', title: 'National Dog Day', color: 'bg-amber-600 text-white', category: 'Pets' },
  { id: '6', date: '2026-08-30', title: 'National Wellness Day', color: 'bg-teal-500 text-white', category: 'Health / Wellness' },
  { id: '7', date: '2026-09-07', title: 'Labor Day (US)', color: 'bg-red-600 text-white', category: 'General / Patriotic' },
  { id: '8', date: '2026-09-22', title: 'Fall Season Start', color: 'bg-orange-500 text-white', category: 'Fashion / Home' },
  { id: '9', date: '2026-10-01', title: 'Breast Cancer Awareness', color: 'bg-pink-500 text-white', category: 'Health / Cause' },
  { id: '10', date: '2026-10-31', title: 'Halloween', color: 'bg-purple-600 text-white', category: 'Retail / Costumes' },
];

const MONTH_DATA = [
  { name: 'July 2026', year: 2026, monthPrefix: '2026-07', daysCount: 31, startDayOfWeek: 3 }, // 3 = Wednesday
  { name: 'August 2026', year: 2026, monthPrefix: '2026-08', daysCount: 31, startDayOfWeek: 6 }, // 6 = Saturday
  { name: 'September 2026', year: 2026, monthPrefix: '2026-09', daysCount: 30, startDayOfWeek: 2 }, // 2 = Tuesday
  { name: 'October 2026', year: 2026, monthPrefix: '2026-10', daysCount: 31, startDayOfWeek: 4 }, // 4 = Thursday
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CAMPAIGN_MSGS = [
  'Matching your niche with the seasonal theme...',
  'Mapping your target customer to this event...',
  'Building your 3-day content calendar...',
  'Crafting campaign-specific content ideas...',
  'Finalizing recommendations for your store...',
];

function getPreSuggestedEvents(productType: string = '') {
  const type = productType.toLowerCase();
  const suggestions: string[] = [];

  suggestions.push('Amazon Prime Day', 'Halloween');

  if (type.includes('apparel') || type.includes('clothing') || type.includes('fashion') || type.includes('shoe') || type.includes('backpack') || type.includes('school')) {
    suggestions.push('Back to School Starts', 'Back to School Peak', 'Labor Day (US)', 'Fall Season Start');
  }
  if (type.includes('pet') || type.includes('dog') || type.includes('cat') || type.includes('animal')) {
    suggestions.push('National Dog Day');
  }
  if (type.includes('health') || type.includes('wellness') || type.includes('skincare') || type.includes('beauty') || type.includes('cosmetics') || type.includes('supplement')) {
    suggestions.push('National Wellness Day', 'Breast Cancer Awareness');
  }
  if (type.includes('home') || type.includes('decor') || type.includes('furniture') || type.includes('kitchen')) {
    suggestions.push('Fall Season Start', 'Independence Day (US)');
  }
  if (type.includes('sport') || type.includes('fitness') || type.includes('gym')) {
    suggestions.push('National Wellness Day');
  }

  if (suggestions.length <= 2) {
    suggestions.push('Independence Day (US)', 'Labor Day (US)');
  }

  return suggestions;
}

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignPlan[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  
  // Filter settings
  const [filterSuggestedOnly, setFilterSuggestedOnly] = useState(true);
  
  // Modal settings
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<CampaignPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [campaignMsgIdx, setCampaignMsgIdx] = useState(0);

  useEffect(() => {
    if (!generating) { setCampaignMsgIdx(0); return; }
    const t = setInterval(() => setCampaignMsgIdx((i) => (i + 1) % CAMPAIGN_MSGS.length), 1800);
    return () => clearInterval(t);
  }, [generating]);

  useEffect(() => {
    document.title = "Seasonal Campaign Planner | Stormo.io Dashboard";
    async function loadData() {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
          setStoreProfile(data.storeProfile || null);
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const triggerBuildCampaign = (event: any) => {
    setSelectedEvent(event);
    
    // Check if campaign already exists for this event
    const existing = campaigns.find(
      (c) => c.eventName === event.title && c.eventDate === event.date
    );
    
    setGeneratedPlan(existing || null);
    setIsBuildModalOpen(true);
    setSaveSuccess(false);
    setGenerating(false);
  };

  const generatePlan = async () => {
    if (!selectedEvent) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: selectedEvent.title,
          eventDate: selectedEvent.date,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPlan(data);
      }
    } catch (err) {
      console.error('Failed to generate campaign:', err);
    } finally {
      setGenerating(false);
    }
  };

  const savePlan = async () => {
    if (!generatedPlan) return;
    setSaving(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedPlan),
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setSaveSuccess(true);
        setTimeout(() => {
          setIsBuildModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to save campaign:', err);
    } finally {
      setSaving(false);
    }
  };

  const suggestedEventTitles = getPreSuggestedEvents(storeProfile?.productType || '');

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark">Seasonal Campaign Planner</h1>
          <p className="text-subtle text-sm mt-1">Design marketing campaigns tailored to high-traffic shopping seasons</p>
        </div>

        {/* Niche recommendations filter toggle */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
          <Sparkles className="h-4.5 w-4.5 text-primary" />
          <span className="text-xs font-semibold text-dark">Niche Recommendations Only</span>
          <input
            type="checkbox"
            checked={filterSuggestedOnly}
            onChange={(e) => setFilterSuggestedOnly(e.target.checked)}
            className="h-4.5 w-4.5 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer ml-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex flex-col justify-center items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-subtle text-xs">Loading campaign planner...</p>
        </div>
      ) : (
        <>
          {/* Horizontal scrollable month layout */}
          <div className="flex gap-8 overflow-x-auto pb-4 snap-x snap-mandatory">
            {MONTH_DATA.map((month) => {
              const days = [];
              // Add padding cells
              for (let i = 0; i < month.startDayOfWeek; i++) {
                days.push(null);
              }
              // Add actual dates
              for (let i = 1; i <= month.daysCount; i++) {
                const dayStr = i < 10 ? `0${i}` : `${i}`;
                days.push(`${month.monthPrefix}-${dayStr}`);
              }
              
              return (
                <div
                  key={month.name}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 w-[330px] md:w-[360px] flex-shrink-0 snap-start"
                >
                  <h3 className="font-bold text-dark text-base border-b border-gray-200 pb-2 mb-4 text-center">
                    {month.name}
                  </h3>
                  
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-subtle mb-2">
                    {WEEKDAYS.map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  {/* Calendar cells grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {days.map((dateStr, idx) => {
                      if (!dateStr) {
                        return <div key={`empty-${idx}`} className="h-10"></div>;
                      }

                      const dayNumber = dateStr.split('-')[2];
                      const dayEvents = EVENTS.filter((e) => e.date === dateStr);
                      const hasSavedCampaign = campaigns.some((c) => c.eventDate === dateStr);

                      // Filter out non-suggested events if filter is toggled
                      const activeEvents = dayEvents.filter(
                        (e) => !filterSuggestedOnly || suggestedEventTitles.includes(e.title)
                      );

                      return (
                        <div
                          key={dateStr}
                          className={`h-12 border border-gray-100 rounded-lg p-1 flex flex-col justify-between relative group ${
                            hasSavedCampaign ? 'bg-orange-tint border-primary/45 ring-2 ring-primary/10' : 'bg-gray-50/50'
                          }`}
                        >
                          <span className={`text-[10px] font-bold leading-none ${
                            hasSavedCampaign ? 'text-primary' : 'text-dark'
                          }`}>
                            {parseInt(dayNumber, 10)}
                          </span>

                          {/* Render event dot/tag */}
                          {activeEvents.map((evt) => (
                            <button
                              key={evt.id}
                              onClick={() => triggerBuildCampaign(evt)}
                              title={`${evt.title} - Click to Build Campaign`}
                              className={`h-3 w-full rounded text-[8px] font-extrabold truncate px-0.5 mt-auto text-left block cursor-pointer transition-all hover:scale-102 ${
                                hasSavedCampaign ? 'bg-primary text-white' : evt.color
                              }`}
                            >
                              {evt.title}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick list view of upcoming shopping dates */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-dark border-b border-gray-200 pb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Upcoming Campaign Opportunities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EVENTS.filter((e) => !filterSuggestedOnly || suggestedEventTitles.includes(e.title)).map((evt) => {
                const isSaved = campaigns.some((c) => c.eventDate === evt.date);
                const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                const eventFormattedDate = new Date(evt.date).toLocaleDateString('en-US', options);

                return (
                  <div
                    key={evt.id}
                    className={`bg-white rounded-xl shadow-xs border p-5 flex items-center justify-between transition-all hover:-translate-y-0.5 ${
                      isSaved ? 'border-primary bg-orange-tint/10' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${evt.color}`}>
                          {evt.category}
                        </span>
                        {suggestedEventTitles.includes(evt.title) && (
                          <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                            <Sparkles className="h-3 w-3" /> Niche Suggestion
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-dark text-base mt-2">{evt.title}</h3>
                      <p className="text-subtle text-xs mt-1">Event Date: {eventFormattedDate}</p>
                    </div>
                    
                    <button
                      onClick={() => triggerBuildCampaign(evt)}
                      className={`py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-orange-tint border border-primary text-primary hover:bg-primary hover:text-white'
                          : 'bg-primary hover:bg-[#C4531A] text-white shadow-md'
                      }`}
                    >
                      {isSaved ? 'Edit Campaign' : 'Build Campaign'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Build Campaign Modal */}
      {isBuildModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-primary to-[#C4531A] text-white p-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-base">Campaign Builder</h3>
                <p className="text-white/80 text-[10px] mt-0.5">
                  Target Event: {selectedEvent.title} ({new Date(selectedEvent.date).toLocaleDateString('en-US', { dateStyle: 'medium' })})
                </p>
              </div>
              <button
                onClick={() => setIsBuildModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-light-bg">
              {!generatedPlan && !generating ? (
                /* INITIAL PLAN TRIGGER STATE */
                <div className="text-center py-10 space-y-4 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                  <CalendarIcon className="h-14 w-14 text-primary/30 mx-auto animate-bounce duration-1000" />
                  <h3 className="font-bold text-dark text-lg">Create a Campaign Strategy</h3>
                  <p className="text-subtle text-xs max-w-sm mx-auto">
                    Stormo will analyze your niche summary, product type, and target customer profile to map out a personalized 3-day marketing campaign for {selectedEvent.title}.
                  </p>
                  <button
                    onClick={generatePlan}
                    className="bg-primary hover:bg-[#C4531A] text-white text-xs font-semibold py-2.5 px-6 rounded-lg shadow-md transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Campaign Plan
                  </button>
                </div>
              ) : generating ? (
                /* AI GENERATING SPINNER STATE */
                <div className="text-center py-16 space-y-3 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                  <h3 className="font-bold text-dark text-base">Crafting Campaign Recommendations...</h3>
                  <p className="text-subtle text-xs transition-all duration-300">{CAMPAIGN_MSGS[campaignMsgIdx]}</p>
                </div>
              ) : generatedPlan ? (
                /* DISPLAY GENERATED CAMPAIGN RESULTS */
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Overview Card */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
                    <span className="text-[10px] text-primary uppercase font-extrabold tracking-wider bg-orange-tint px-2.5 py-0.5 rounded-full border border-primary/20">
                      Campaign Overview
                    </span>
                    <h4 className="font-bold text-dark text-base mt-2">{generatedPlan.campaignName}</h4>
                    <p className="text-subtle text-xs leading-relaxed">{generatedPlan.overview}</p>
                  </div>

                  {/* 3 Day Action Schedule */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-dark text-sm border-b border-gray-200 pb-1.5 flex items-center gap-1">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      3-Day Lead-Up Actions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {generatedPlan.suggestedActions.map((action, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs relative">
                          <span className="absolute top-3 right-3 text-[10px] font-bold text-primary bg-orange-tint px-2 py-0.2 rounded-full border border-primary/10">
                            Day {idx + 1}
                          </span>
                          <h5 className="font-bold text-dark text-xs mt-1">Suggested Task</h5>
                          <p className="text-subtle text-[11px] leading-relaxed mt-2">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Ideas */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-dark text-sm border-b border-gray-200 pb-1.5 flex items-center gap-1">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      Content Ideas
                    </h4>
                    <div className="space-y-2">
                      {generatedPlan.contentIdeas.map((idea, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex gap-3 items-start">
                          <Tag className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-dark text-xs leading-relaxed">{idea}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer Controls */}
            {generatedPlan && !generating && (
              <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                <button
                  onClick={generatePlan}
                  className="py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-dark text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Regenerate
                </button>
                
                <button
                  onClick={savePlan}
                  disabled={saving || saveSuccess}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-6 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md text-white ${
                    saveSuccess
                      ? 'bg-green-600'
                      : 'bg-primary hover:bg-[#C4531A] disabled:opacity-50'
                  }`}
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saveSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Saved Successfully!
                    </>
                  ) : (
                    'Save Campaign & Schedule Actions'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
