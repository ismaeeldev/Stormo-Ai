'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Loader2,
  Copy,
  Check,
  X,
  Mail,
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Upload,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  platform: string;
  profileUrl: string | null;
  followerCount: number | null;
  nicheMatch: string | null;
  status: string;
  lastContactAt: string | null;
  followUpDue: string | null;
  aiOutreachDraft: string | null;
  notes: string | null;
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'blog', label: 'Blog' },
  { value: 'podcast', label: 'Podcast' },
];

const STATUSES = [
  { value: 'identified', label: 'Identified', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'replied', label: 'Replied', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'agreed', label: 'Agreed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'declined', label: 'Declined', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'no_response', label: 'No Response', color: 'bg-gray-100 text-gray-500 border-gray-200' },
];

export default function OutreachPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  
  // Bulk Import State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkPlatform, setBulkPlatform] = useState('instagram');
  const [bulkText, setBulkText] = useState('');
  const [analyzingBulk, setAnalyzingBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState('');
  const [savingBulk, setSavingBulk] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Add Contact Form State
  const [formName, setFormName] = useState('');
  const [formPlatform, setFormPlatform] = useState('instagram');
  const [formProfileUrl, setFormProfileUrl] = useState('');
  const [formFollowerCount, setFormFollowerCount] = useState('');
  const [formNicheMatch, setFormNicheMatch] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Draft View State
  const [draftContent, setDraftContent] = useState('');
  const [draftContactId, setDraftContactId] = useState('');
  const [draftContactName, setDraftContactName] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/outreach/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Name is required');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/outreach/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          platform: formPlatform,
          profileUrl: formProfileUrl || null,
          followerCount: formFollowerCount || null,
          nicheMatch: formNicheMatch || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save contact');
      }

      await fetchContacts();
      setIsAddModalOpen(false);
      // Reset form
      setFormName('');
      setFormPlatform('instagram');
      setFormProfileUrl('');
      setFormFollowerCount('');
      setFormNicheMatch('');
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusChange = async (contactId: string, status: string) => {
    try {
      const res = await fetch(`/api/outreach/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) => (c.id === contactId ? { ...c, status } : c))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const triggerGenerateDraft = async (contact: Contact) => {
    setDraftContactName(contact.name);
    setDraftContactId(contact.id);
    setDraftContent(contact.aiOutreachDraft || '');
    setIsDraftModalOpen(true);
    setCopied(false);

    if (!contact.aiOutreachDraft) {
      setGeneratingDraft(true);
      try {
        const res = await fetch('/api/outreach/generate-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: contact.id }),
        });
        if (res.ok) {
          const data = await res.json();
          setDraftContent(data.draft);
          setContacts((prev) =>
            prev.map((c) => (c.id === contact.id ? { ...c, aiOutreachDraft: data.draft } : c))
          );
        } else {
          throw new Error('Generation failed');
        }
      } catch (err) {
        setDraftContent('Failed to generate draft. Please try again.');
      } finally {
        setGeneratingDraft(false);
      }
    }
  };

  const handleBulkAnalyze = async () => {
    if (!bulkText.trim()) {
      setBulkError('Please enter at least one handle');
      return;
    }

    setAnalyzingBulk(true);
    setBulkError('');
    setBulkResults([]);

    try {
      const parsedHandles = Array.from(
        new Set(
          bulkText
            .split('\n')
            .map((line) => {
              let cleaned = line.trim();
              if (!cleaned) return '';
              if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
                try {
                  const url = new URL(cleaned);
                  const pathSegments = url.pathname.split('/').filter(Boolean);
                  cleaned = pathSegments[pathSegments.length - 1] || cleaned;
                } catch (e) {
                  // Fallback
                }
              }
              cleaned = cleaned.replace(/^@/, '');
              return cleaned;
            })
            .filter(Boolean)
        )
      ).slice(0, 20);

      if (parsedHandles.length === 0) {
        throw new Error('No valid handles found');
      }

      const res = await fetch('/api/outreach/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handles: parsedHandles,
          platform: bulkPlatform,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze handles. Make sure you have an active subscription.');
      }

      const data = await res.json();
      
      const results = (data.contacts || []).map((contact: any) => ({
        ...contact,
        checked: true,
      }));

      setBulkResults(results);
    } catch (err: any) {
      setBulkError(err.message || 'An error occurred during analysis');
    } finally {
      setAnalyzingBulk(false);
    }
  };

  const handleBulkSave = async () => {
    const selected = bulkResults.filter((r) => r.checked);
    if (selected.length === 0) {
      setBulkError('Please select at least one contact to add');
      return;
    }

    setSavingBulk(true);
    setBulkError('');

    try {
      const resolveProfileUrl = (handle: string, platform: string): string => {
        if (handle.startsWith('http://') || handle.startsWith('https://')) {
          return handle;
        }
        if (platform === 'instagram') return `https://instagram.com/${handle}`;
        if (platform === 'tiktok') return `https://tiktok.com/@${handle}`;
        if (platform === 'youtube') return `https://youtube.com/@${handle}`;
        return handle;
      };

      const savePromises = selected.map(async (contact) => {
        const profileUrl = resolveProfileUrl(contact.handle, bulkPlatform);
        return fetch('/api/outreach/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: contact.name,
            platform: bulkPlatform,
            profileUrl,
            nicheMatch: contact.nicheMatch,
            followerCount: null,
          }),
        });
      });

      await Promise.all(savePromises);

      setToastMessage(`${selected.length} contacts added to your CRM`);
      setTimeout(() => setToastMessage(''), 4000);

      await fetchContacts();
      setIsBulkModalOpen(false);
      setBulkText('');
      setBulkResults([]);
    } catch (err: any) {
      setBulkError(err.message || 'Failed to save selected contacts');
    } finally {
      setSavingBulk(false);
    }
  };

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draftContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Stats calculation
  const totalContacts = contacts.length;
  const contactsReplied = contacts.filter((c) => c.status === 'replied' || c.status === 'negotiating' || c.status === 'agreed').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const followUpsDueToday = contacts.filter((c) => c.followUpDue && c.followUpDue <= todayStr && c.status !== 'declined' && c.status !== 'agreed').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark">Outreach CRM</h1>
          <p className="text-subtle text-sm mt-1">Manage and track your outreach leads and AI draft pitches</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => {
              setIsBulkModalOpen(true);
              setBulkError('');
              setBulkText('');
              setBulkResults([]);
            }}
            className="flex items-center justify-center gap-2 border border-primary text-primary bg-transparent hover:bg-orange-tint text-sm font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="h-4.5 w-4.5" />
            Bulk Import
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-[#C4531A] text-white text-sm font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Total Leads</p>
            <h3 className="text-2xl font-extrabold text-dark mt-1">{totalContacts}</h3>
          </div>
          <Users className="h-8 w-8 text-primary/40" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Positive Replies</p>
            <h3 className="text-2xl font-extrabold text-dark mt-1">{contactsReplied}</h3>
          </div>
          <MessageSquare className="h-8 w-8 text-green-500/40" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Follow-ups Due</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-dark">{followUpsDueToday}</h3>
              {followUpsDueToday > 0 && (
                <span className="bg-orange-tint text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 animate-pulse">
                  Due Today
                </span>
              )}
            </div>
          </div>
          <AlertCircle className="h-8 w-8 text-primary/40" />
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col justify-center items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-subtle text-xs">Loading leads...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
            <Users className="h-14 w-14 text-muted/30" />
            <h3 className="font-bold text-dark text-lg">No outreach leads yet</h3>
            <p className="text-subtle text-xs max-w-sm">
              Start building your outreach pipeline by adding micro-influencers, brands, or blogs in your store's niche.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-[#C4531A] text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Add Your First Lead
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-subtle font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Platform</th>
                  <th className="p-4">Status Pipeline</th>
                  <th className="p-4">Follow-up Due</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((contact) => {
                  const currentStatus = STATUSES.find((s) => s.value === contact.status) || STATUSES[0];
                  const isOverdue = contact.followUpDue && contact.followUpDue <= todayStr && contact.status !== 'agreed' && contact.status !== 'declined';
                  
                  return (
                    <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-semibold text-dark">
                        <div className="flex flex-col">
                          <span>{contact.name}</span>
                          {contact.profileUrl && (
                            <a
                              href={contact.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              Profile Link <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="capitalize bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 font-medium">
                          {contact.platform}
                        </span>
                        {contact.followerCount && (
                          <span className="text-[10px] text-subtle block mt-1">
                            {contact.followerCount.toLocaleString()} followers
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${currentStatus.color}`}>
                            {currentStatus.label}
                          </span>
                          <select
                            value={contact.status}
                            onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                            className="bg-white border border-gray-300 rounded text-[10px] p-1 text-dark focus:border-primary focus:outline-none"
                          >
                            {STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className={`p-4 font-medium ${isOverdue ? 'text-primary font-bold' : 'text-subtle'}`}>
                        {contact.followUpDue ? (
                          <span className={isOverdue ? 'bg-orange-tint px-2 py-0.5 rounded border border-primary/20' : ''}>
                            {contact.followUpDue}
                          </span>
                        ) : (
                          'Not set'
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => triggerGenerateDraft(contact)}
                          className="inline-flex items-center gap-1 bg-white hover:bg-orange-tint border border-primary text-primary text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Pitch Draft
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-primary to-[#C4531A] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-base">Add Outreach Contact</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center font-medium">
                  {formError}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-dark uppercase block">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-dark focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-dark uppercase block">Platform</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-xs text-dark focus:border-primary focus:outline-none"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-dark uppercase block">Followers (optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={formFollowerCount}
                    onChange={(e) => setFormFollowerCount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-dark focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-dark uppercase block">Profile URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://instagram.com/sarahj"
                  value={formProfileUrl}
                  onChange={(e) => setFormProfileUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-dark focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-dark uppercase block">Niche Match / Notes</label>
                <textarea
                  placeholder="e.g. Posts organic home decor reels, matches our minimalist product line."
                  value={formNicheMatch}
                  onChange={(e) => setFormNicheMatch(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-dark focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 hover:bg-gray-50 text-dark text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2 px-4 bg-primary hover:bg-[#C4531A] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Pitch Draft Modal */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-primary to-[#C4531A] text-white p-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-orange-tint animate-pulse" />
                <h3 className="font-bold text-base">AI Cold Pitch for {draftContactName}</h3>
              </div>
              <button
                onClick={() => setIsDraftModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-light-bg space-y-4">
              {generatingDraft ? (
                <div className="h-44 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-subtle text-xs">Stormo is crafting a personalized cold pitch...</p>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm min-h-[120px]">
                  <p className="text-dark text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {draftContent}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <span className="text-[10px] text-subtle font-medium">
                Copy and personalize before sending
              </span>
              <button
                onClick={handleCopyDraft}
                disabled={generatingDraft || !draftContent}
                className={`flex items-center gap-2 py-2 px-5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md ${
                  copied
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-primary hover:bg-[#C4531A] text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied! ✓
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-primary to-[#C4531A] text-white p-4 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-base">Bulk Import Contacts</h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1 relative">
              {bulkError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center font-medium">
                  {bulkError}
                </div>
              )}

              {bulkResults.length === 0 ? (
                /* INPUT FORM VIEW */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-dark uppercase block">Platform</label>
                    <select
                      value={bulkPlatform}
                      onChange={(e) => setBulkPlatform(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-xs text-dark focus:border-primary focus:outline-none"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-dark uppercase block">Handles</label>
                    <textarea
                      rows={10}
                      placeholder="Paste handles one per line, e.g:&#10;@handlemike&#10;@sarahjane&#10;https://instagram.com/somestore"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-dark focus:border-primary focus:outline-none resize-none font-mono"
                    />
                    <p className="text-[10px] text-subtle mt-1">
                      Paste up to 20 handles at a time. One per line.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkModalOpen(false)}
                      className="flex-1 py-2 px-4 border border-gray-300 hover:bg-gray-50 text-dark text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkAnalyze}
                      disabled={analyzingBulk || !bulkText.trim()}
                      className="flex-1 py-2 px-4 bg-primary hover:bg-[#C4531A] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                    >
                      {analyzingBulk && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Import & Analyze
                    </button>
                  </div>
                </div>
              ) : (
                /* RESULTS GRID VIEW */
                <div className="space-y-4">
                  <p className="text-xs text-subtle font-medium">
                    AI successfully analyzed the handles. Review and select which ones to add to your CRM.
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200 text-subtle font-bold uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="p-3 w-10">Add</th>
                          <th className="p-3">Handle</th>
                          <th className="p-3">Name</th>
                          <th className="p-3">Niche Match</th>
                          <th className="p-3">Follower Est</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bulkResults.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={(e) => {
                                  const updated = [...bulkResults];
                                  updated[idx].checked = e.target.checked;
                                  setBulkResults(updated);
                                }}
                                className="h-4.5 w-4.5 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-semibold text-dark">
                              @{item.handle}
                            </td>
                            <td className="p-3 text-dark">{item.name}</td>
                            <td className="p-3 text-subtle">{item.nicheMatch}</td>
                            <td className="p-3">
                              <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase border border-gray-200">
                                {item.followerEstimate}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBulkResults([])}
                      className="flex-1 py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-dark text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkSave}
                      disabled={savingBulk || bulkResults.filter(r => r.checked).length === 0}
                      className="flex-1 py-2.5 px-4 bg-primary hover:bg-[#C4531A] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                    >
                      {savingBulk && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Add Selected Contacts
                    </button>
                  </div>
                </div>
              )}

              {analyzingBulk && (
                <div className="absolute inset-0 bg-white/75 flex flex-col justify-center items-center gap-3 animate-in fade-in duration-200">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-dark font-bold text-sm">Analyzing handles with AI...</p>
                  <p className="text-subtle text-xs">Stormo is gathering influencer data...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-dark text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-gray-800 animate-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
