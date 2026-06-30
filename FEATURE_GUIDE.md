# Stormo.io — Complete Feature Guide
**Version:** 1.0 · **Audience:** End users, QA, client stakeholders

---

## Table of Contents
1. [Account & Authentication](#1-account--authentication)
2. [Onboarding — Store Profile Setup](#2-onboarding--store-profile-setup)
3. [Dashboard — Home](#3-dashboard--home)
4. [Daily Action Plan](#4-daily-action-plan)
5. [Sales Tracker](#5-sales-tracker)
6. [Today's Focus Panel](#6-todays-focus-panel)
7. [Action History](#7-action-history)
8. [My Content — Weekly Content Hub](#8-my-content--weekly-content-hub)
9. [Campaigns — Seasonal Planner](#9-campaigns--seasonal-planner)
10. [Outreach — Influencer CRM](#10-outreach--influencer-crm)
11. [Performance Dashboard](#11-performance-dashboard)
12. [Milestones & Achievements](#12-milestones--achievements)
13. [Settings & Subscription](#13-settings--subscription)
14. [Ask Stormo — AI Chatbot](#14-ask-stormo--ai-chatbot)
15. [Push Notifications](#15-push-notifications)
16. [Weekly Summary Card](#16-weekly-summary-card)
17. [AI Insight Card](#17-ai-insight-card)
18. [Progress Tracker](#18-progress-tracker)

---

## 1. Account & Authentication

### What it does
Secure email/password authentication with email verification, password recovery, and protected routes throughout the entire application. Unauthenticated users are redirected to `/login` automatically.

### Pages
| Page | URL | Purpose |
|---|---|---|
| Register | `/register` | Create new account |
| Login | `/login` | Sign in to existing account |
| Verify Email | `/verify-email` | Confirm email after registration |
| Verify Required | `/verify-email-required` | Prompt if email not yet verified |
| Forgot Password | `/forgot-password` | Request reset link |
| Reset Password | `/reset-password?token=…` | Set new password via email link |

### How to Register
1. Go to `/register`
2. Enter your name, email, and a password (8+ characters)
3. Check the **"I accept the Terms of Service"** checkbox — registration will fail without it
4. Click **Create Account**
5. Check your inbox for a verification email and click the link inside
6. After verifying, you are redirected to onboarding

### How to Log In
1. Go to `/login`
2. Enter email and password, click **Sign In**
3. On success you land on `/dashboard`
4. If email is not verified, you are redirected to `/verify-email-required`

### How to Reset Password
1. Go to `/forgot-password`, enter your email, click **Send Reset Link**
2. Open the email, click the link (valid 1 hour)
3. On `/reset-password`, enter and confirm your new password, click **Reset Password**
4. Log in with the new password

### Testing Checklist
- [ ] Register with valid data → receives verification email
- [ ] Register without checking Terms → `400` error shown, account not created
- [ ] Register with duplicate email → "Email already in use" error
- [ ] Login with wrong password → error shown, no access
- [ ] Login with unverified email → redirected to verify-email-required
- [ ] Forgot password → email arrives, link works once, expires after use
- [ ] Accessing `/dashboard` while logged out → redirects to `/login`

---

## 2. Onboarding — Store Profile Setup

### What it does
A multi-step AI-guided interview that builds your store's marketing profile. Stormo uses every answer to personalise all AI-generated actions, content, campaigns, and chatbot responses. **This runs once** after first registration and cannot be skipped.

### How it works
- You are asked a series of questions (product type, store URL, target customer, weekly time available, current channels, niche description, challenges, goals)
- Each answer is optionally parsed by AI to skip redundant follow-up questions
- All answers are saved as your **store profile** in the database
- On completion, you are redirected to `/dashboard`

### How to use
1. After verifying your email, you land on `/onboarding`
2. Read each question and type your answer in the text area
3. Press **Enter** or click **Next** to advance
4. Some questions offer quick-select chips — tap a chip to pre-fill the answer
5. After the final question, click **Complete Setup**
6. The AI spends ~5–10 seconds building your first action plan, then redirects to the dashboard

### Testing Checklist
- [ ] Complete onboarding → redirected to dashboard with action plan ready
- [ ] Skip a question (empty input) → should either block or accept with a default
- [ ] Re-visit `/onboarding` after completing → should redirect to `/dashboard`
- [ ] Verify store profile saved: open **Ask Stormo**, ask "What is my store about?" — it should reference your answers

---

## 3. Dashboard — Home

**URL:** `/dashboard`

### What it does
The central control panel. Shows your personalised greeting, live stats, today's action plan, sales tracker, focus panel, and complete action history in a single scrollable view.

### Widgets visible on this page
| Widget | Location | Purpose |
|---|---|---|
| Welcome header | Top | Name, date, plan badge, streak, sales count |
| Notification banner | Below header | One-time push notification opt-in |
| Weekly Summary Card | Conditional (Mon–Wed) | Last week's recap (dismissible) |
| AI Insight Card | Below summary | Latest AI-generated marketing insight |
| Dashboard Banner | Context-aware | Onboarding prompt / day-streak encouragement |
| Progress Tracker | Cards row | Actions this week, streak, completion rate |
| Daily Action Card | Main (70% width) | Today's personalised marketing task |
| Sales Counter | Sidebar | Log and track sales toward Growth tier |
| Today's Focus Panel | Below Sales | Quick context: channel, effort, priority |
| Action History | Bottom | Full paginated record of all past actions |

### Stats on the welcome header
- **Plan badge** — Starter / Growth (reflects subscription tier)
- **Days active** — days since account creation
- **Sales** — total logged sales
- **Streak badge** — visible only when streak ≥ 1 day

### Testing Checklist
- [ ] Log in → dashboard loads within 3 seconds
- [ ] Header shows correct first name and today's date
- [ ] Plan badge matches subscription tier in Settings
- [ ] Streak badge appears after completing an action
- [ ] All widgets visible without horizontal scroll on mobile

---

## 4. Daily Action Plan

**Component:** `DailyActionCard` · **API:** `GET /api/actions/today`, `POST /api/actions/generate`

### What it does
The most important feature. Every day, Stormo's AI generates one specific, personalised marketing task for your store — tailored to your channel history, niche, target customer, and what you have already tried. The card shows the task title, a description, the estimated time, and a ready-to-use copy template.

### Action lifecycle
```
[generated] → pending → [user acts] → completed / postponed / skipped
```

### How to use
1. Open the dashboard — the card loads your action for today automatically
2. Read the **title** and **description** to understand what to do
3. Use the **Copy Template** box to copy the exact text to post/send
4. When done, click **Mark Complete** — the card switches to "All caught up!"
5. If you cannot do it today, click **Do Tomorrow** — moves the action to tomorrow with status `postponed`

### Status meanings
| Status | Meaning |
|---|---|
| `pending` / `scheduled` | Today's active action — do this now |
| `completed` | Done — results can be logged in History |
| `postponed` | Moved to tomorrow via "Do Tomorrow" |
| `skipped` | Manually skipped from History |

### "All caught up" state
After marking complete (or if you already completed today's action and re-open the dashboard), the card shows a green checkmark and "All caught up!" — no new action is generated until tomorrow.

### Generation skeleton
While the action loads or generates, you see an animated skeleton with rotating status messages ("Evaluating your marketing channel history...", etc.). This is normal and takes 5–15 seconds on first generation.

### Testing Checklist
- [ ] Fresh day → skeleton appears, then action card appears with title + description + template
- [ ] Copy template button → text copies to clipboard, button shows "Copied!"
- [ ] Mark Complete → card instantly shows "All caught up!" green state
- [ ] Mark Complete → Action History immediately shows the completed action at top
- [ ] Mark Complete → Today's Focus panel also switches to "All done today!"
- [ ] Mark Complete, reload page → still shows "All caught up!" (no duplicate generation)
- [ ] Do Tomorrow → action moves to tomorrow, card shows next available action or "All caught up!"
- [ ] Error state → "Generation paused" card with **Try Again** button appears

---

## 5. Sales Tracker

**Component:** `SalesCounter` · **API:** `GET /api/sales`, `POST /api/sales`

### What it does
Tracks every sale you make and displays your progress toward the **10-sale Growth milestone**. Once 10 sales are logged, you become eligible to upgrade to the Growth plan.

### How to use
1. On the dashboard sidebar, find the **Sales Tracker** card
2. Click **Log a Sale**
3. Select the **channel** where the sale came from (Instagram, TikTok, Email, Pinterest, Reddit, Other)
4. Optionally add a **note** (e.g., "First customer from my reel")
5. Click **Save Sale** — the counter updates immediately

### Progress bar
- Shows `X / 10 sales — N more to unlock Growth`
- Once 10 reached: bar fills, **Growth plan is now available!** upgrade prompt appears
- Confetti fires when the 10th sale is logged

### Testing Checklist
- [ ] Click Log a Sale → inline form appears without page reload
- [ ] Submit with channel only (no notes) → sale saved, counter increments
- [ ] Submit with notes → note appears in "Recent" list below the counter
- [ ] Log 10th sale → confetti fires, Growth upgrade prompt appears
- [ ] Cancel form → form closes with no changes

---

## 6. Today's Focus Panel

**Component:** `ActionContextPanel` · **API:** `GET /api/actions/today`

### What it does
A compact sidebar card that shows key metadata about today's active action: channel, category, estimated effort, priority, and a scheduled date. Also shows a **Suggested Next Step** tip based on the action type. When today's action is done, it shows "All done today!" automatically.

### Rows displayed
| Row | Example value |
|---|---|
| Channel | Instagram |
| Category | Content |
| Est. Effort | ~35 min |
| Priority | High |
| Scheduled | Mon, Jun 29 |

### Suggested Next Step examples
- **Community** → "Engage with 5 posts in your niche community before end of day."
- **Content** → "Schedule your next post before the day ends to stay consistent."
- **Outreach** → "Follow up with anyone who didn't respond within 48 hours."
- **SEO** → "Check ranking changes in Google Search Console tomorrow."
- **Paid Ads** → "Review spend vs. conversions before your next budget reload."

### Testing Checklist
- [ ] Panel shows correct channel and category matching the Daily Action Card
- [ ] After marking action complete → panel switches to "All done today!" green card
- [ ] Panel updates without page reload when action is completed

---

## 7. Action History

**Component:** `ActionHistoryList` · **API:** `GET /api/actions/history`

### What it does
A paginated table of every action ever generated for you, with status badges, channel tags, and an expandable results panel for each row. Supports filtering by status and channel.

### How to use
1. Scroll to the bottom of the dashboard
2. See all actions in reverse chronological order
3. Use the **Status** and **Channel** dropdowns to filter
4. Click the **↺ refresh** icon to manually reload
5. Click any row to expand its results panel
6. For **completed** actions — log your results (reach, engagement, sales, notes)
7. For **pending / postponed** actions — change status to Complete or Skip

### Filters
| Filter | Options |
|---|---|
| Status | All · Completed · Pending · Postponed · Skipped |
| Channel | All · Reddit · Instagram · Email · Pinterest · SEO · Paid Ads |

### Results panel (completed actions)
When you expand a completed action row:
- **Log Results** form with: Reach, Engagement, Followers Gained, Sales Attributed, Clicks to Store, Email Signups, Notes
- Click **Save Results** — data is stored and shown next time you expand
- Results feed the Performance Dashboard analytics (unlocks at 20 logged results)

### Status change controls (pending/postponed actions)
When you expand a pending or postponed row:
- **Mark Complete** button — immediately sets status to completed
- **Skip** button — sets status to skipped
- Changes update the row badge instantly without a full page reload

### Load more
Click **Load More** at the bottom to fetch the next page (10 rows per page). Filters reset to page 1 automatically.

### Testing Checklist
- [ ] Table loads with all past actions on dashboard open
- [ ] Filter by Status: Completed → only completed rows shown
- [ ] Filter by Channel: Reddit → only Reddit actions shown
- [ ] Expand completed row → results form appears
- [ ] Fill results form and Save → "Results saved!" confirmation, data persists on re-expand
- [ ] Expand pending row → Mark Complete button appears
- [ ] Mark Complete from history → row status badge updates to "Completed" instantly
- [ ] Skip from history → row status badge updates to "Skipped" instantly
- [ ] Load More → 10 more rows appended (table does not flash/reload)
- [ ] After completing action via Daily Action Card → history refreshes silently (no skeleton flash)
- [ ] Manual refresh button → table updates, existing rows stay visible during refresh

---

## 8. My Content — Weekly Content Hub

**URL:** `/dashboard/content` · **API:** `GET /api/content`, `POST /api/content/generate`

### What it does
Every week, Stormo generates **6 pieces of ready-to-use marketing content** tailored to your store: Instagram post, Reddit post, outreach email, product description, Pinterest pin, and blog outline. All content is AI-written using your store profile.

### Content types generated
| Type | What you get |
|---|---|
| Instagram Post | Caption with hashtags and CTA |
| Reddit Post | Community-friendly thread with natural tone |
| Outreach Email | Cold/warm email template for partnerships |
| Product Description | SEO-optimised product copy |
| Pinterest Pin | Pin title + description |
| Blog Outline | Structured H1–H3 outline with content points |

### How content is generated
- Content is generated in **parallel** (6 independent AI calls) in the background
- A **"Generating your weekly content…"** progress banner shows with live checkmarks
- Content appears piece by piece as each completes (every ~30–60 seconds)
- The page **polls automatically** — no manual refresh needed
- Polling stops automatically after all 6 pieces are ready (max 4 minutes)

### How to use
1. Go to **My Content** in the sidebar
2. If content is generating, watch the progress banner — each piece appears as a card
3. When ready, click **View & Copy** on any card
4. In the modal: read the full content, click **Copy All** to copy to clipboard
5. Paste directly into your platform of choice
6. Previous weeks appear in a collapsible accordion below this week's content

### Testing Checklist
- [ ] First visit this week → generating banner appears with 6 spinner badges
- [ ] Watch for 1–2 minutes → badges turn green one by one as pieces complete
- [ ] Click View & Copy → modal opens with full content
- [ ] Copy All in modal → clipboard contains full text, button turns green "Copied!"
- [ ] Close modal → returns to content grid, no state lost
- [ ] Previous week accordion → click to expand, shows prior content cards
- [ ] Onboarding not complete → "Setup Profile Required" prompt shown instead of content

---

## 9. Campaigns — Seasonal Planner

**URL:** `/dashboard/campaigns` · **API:** `POST /api/campaigns/generate`

### What it does
A visual event calendar showing upcoming retail and seasonal events (July–October). For any event, you can generate a **complete 3-day AI campaign plan** personalised to your store, including a campaign overview, suggested daily actions, and content ideas.

### Upcoming events in the calendar
July 4 · Amazon Prime Day (Jul 14) · Back to School (Jul 25, Aug 15) · National Dog Day (Aug 26) · Labor Day (Sep 7) · Fall Season Start (Sep 22) · Breast Cancer Awareness Month (Oct) · Halloween (Oct 31)

### How to use
1. Go to **Campaigns** in the sidebar
2. Browse the 4-month calendar grid — coloured event badges mark each event date
3. Click any event badge or the **Plan Campaign** button in the event list below the calendar
4. Wait ~10–20 seconds while the AI generates (rotating status messages show progress)
5. Review your campaign plan: overview paragraph, 3 suggested daily actions, and content ideas
6. Use the plan to schedule your work around that date

### Testing Checklist
- [ ] Calendar renders with correct event dates (Jul 4 on a Saturday, etc.)
- [ ] Click an event → generating animation starts
- [ ] Campaign plan appears with event name, overview, suggested actions list, content ideas
- [ ] Generate for a second event → new plan replaces the previous one
- [ ] Campaign text references your actual store niche (not generic)

---

## 10. Outreach — Influencer CRM

**URL:** `/dashboard/outreach`

### What it does
A lightweight CRM for managing influencer contacts. Add individual contacts, generate personalised AI cold-pitch emails for each, or paste a list of handles for bulk AI scoring and analysis.

### Features
| Feature | What it does |
|---|---|
| Add Contact | Save name, platform, profile URL, follower count, niche, notes |
| AI Pitch Generator | Write a personalised cold-pitch email for any contact |
| Bulk Analyse | Paste multiple handles → AI scores each for store fit |
| Contact List | View all saved contacts with platform icons |

### How to add a contact
1. Click **+ Add Contact**
2. Fill in: Name, Platform (Instagram/TikTok/YouTube/Blog/Podcast), Profile URL, Follower count, Niche, Notes
3. Click **Save** — contact appears in the list

### How to generate an AI pitch
1. Find the contact in the list
2. Click **Draft Pitch** (email icon)
3. Wait ~10 seconds — AI writes a personalised pitch referencing the contact's niche and your store
4. Click **Copy** to copy the full email text

### How to use Bulk Analyse
1. Click **Bulk Analyse**
2. Paste a list of Instagram/TikTok handles (one per line)
3. Click **Analyse** — AI scores each handle for relevance to your store, estimates audience size and engagement
4. Results show a scored table — use this to prioritise who to contact

### Testing Checklist
- [ ] Add contact → appears in list with platform icon
- [ ] Add contact with profile URL → URL is clickable
- [ ] Draft Pitch → email references the contact's name, platform, and niche
- [ ] Draft Pitch → email references your store product type (from profile)
- [ ] Copy pitch → clipboard contains full email
- [ ] Bulk analyse → paste 3 handles, results appear scored
- [ ] Delete contact → removed from list without page reload

---

## 11. Performance Dashboard

**URL:** `/dashboard/performance`

### What it does
Aggregate analytics built from the results you log in Action History. Shows a full marketing funnel, 30-day vs prior period trends, platform and action-type breakdowns, and your top 5 highest-performing actions.

### Unlock requirement
You must log results for **at least 20 completed actions** before the dashboard unlocks. Until then, a progress bar shows how many you have logged (`X / 20`).

### Sections
| Section | What it shows |
|---|---|
| Conversion Funnel | Total Reach → Engagement → Clicks to Store → Sales Attributed |
| 30-Day Trend | Reach, Engagement, Sales vs prior 30 days with +/- badges |
| Platform Breakdown | Bar chart — which channel drives the most sales |
| Action Type Comparison | Bar chart — which action type (community/content/outreach/seo) converts best |
| Top 5 Actions | Ranked list of your best actions by sales attributed |

### How to use
1. Go to **Performance** in the sidebar
2. If not yet unlocked, continue logging results in Action History
3. Once unlocked, all sections load automatically
4. Use Platform Breakdown to identify your best channel
5. Use Action Type Comparison to see whether community, content, outreach, or SEO drives most sales
6. Use 30-Day Trend to see if your marketing is improving month over month

### Testing Checklist
- [ ] With fewer than 20 results → lock screen with progress bar shown
- [ ] With 20+ results → full dashboard loads with all 4 sections
- [ ] Conversion funnel shows correct totals (cross-check with history logs)
- [ ] 30-day trend: complete an action and log results → numbers update next visit
- [ ] Platform breakdown bar widths are proportional to sales values
- [ ] Top 5 actions are ranked highest → lowest by sales attributed
- [ ] Trend badges: green for positive change, red for negative

---

## 12. Milestones & Achievements

**URL:** `/dashboard/milestones`

### What it does
Gamified achievement system that rewards consistency and growth. 9 milestones unlock automatically as you use the platform. Each unlocked milestone triggers a confetti animation on the dashboard.

### All 9 milestones
| Milestone | Key | How to unlock |
|---|---|---|
| First Step Forward | `first_action` | Complete your first daily action |
| Consistency Builder | `first_week` | Maintain a 7-day streak |
| Content Creator | `first_content` | View your first AI-generated content |
| Outreach Explorer | `first_outreach` | Add your first contact to Outreach CRM |
| First Dollar | `first_sale` | Log your first sale |
| Growth Engine | `ten_sales` | Log 10 total sales |
| One Month Strong | `thirty_days` | Be active for 30 days |
| Marketing Pro | `ninety_days` | Be active for 90 days |
| Influencer Partner | `first_influencer_deal` | Close first influencer deal |

### How to use
1. Go to **Milestones** in the sidebar
2. Unlocked milestones appear as **orange-bordered cards** with a Trophy icon and the date achieved
3. Locked milestones appear as **grey cards** with a Lock icon and the unlock requirement
4. The **total sales counter** at top shows your progress toward Growth Engine
5. Click **Report a Sale** to log a sale directly from this page (same as Sales Tracker)
6. If you have 10+ sales and have not yet upgraded, a pulsing **upgrade banner** appears

### Testing Checklist
- [ ] Complete first action → "First Step Forward" card turns orange on next Milestones visit
- [ ] View content page → "Content Creator" milestone unlocks
- [ ] Add outreach contact → "Outreach Explorer" milestone unlocks
- [ ] Log first sale from Milestones page → "First Dollar" milestone unlocks
- [ ] Log 10th sale → "Growth Engine" unlocks + upgrade banner appears + confetti fires
- [ ] Locked milestones show description of how to unlock
- [ ] Achieved milestones show exact unlock date

---

## 13. Settings & Subscription

**URL:** `/dashboard/settings`

### What it does
Manages your Stormo subscription plan (Starter / Growth), shows billing dates, and provides push notification controls.

### Plan information shown
| Field | Description |
|---|---|
| Current Plan | Starter or Growth |
| Next Billing Date | Date of next charge |
| Trial Ends At | If on trial, expiry date |
| Growth Unlocked | Whether 10-sale milestone reached |
| Total Sales | Your cumulative sales count |

### Plan actions
| Action | When available | What happens |
|---|---|---|
| Upgrade to Growth | On Starter plan + Growth unlocked | Redirects to Stripe checkout |
| Downgrade to Starter | On Growth plan | Cancels Growth at period end |
| Cancel Subscription | On any paid plan | Subscription ends at billing period end |

### How to upgrade
1. Ensure you have 10+ logged sales (unlocks Growth eligibility)
2. Go to Settings, click **Upgrade to Growth — $39/month**
3. Stripe checkout opens — complete payment
4. After success, redirected back to Settings with "You are now on the Growth plan!" banner

### How to cancel
1. Go to Settings, click **Cancel Subscription**
2. A confirmation dialog appears — read the warning
3. Confirm → subscription is cancelled at period end (you keep access until then)

### Push Notification Settings
A sub-section within Settings to manage browser push notifications (see Section 15 for full details).

### Testing Checklist
- [ ] Settings page loads with correct plan tier badge
- [ ] Upgrade button visible only when Growth is unlocked (10+ sales)
- [ ] Upgrade → redirects to Stripe, after payment shows success message
- [ ] Cancel → confirmation dialog appears, requires explicit confirm
- [ ] Downgrade → confirmation dialog appears, tier changes at period end
- [ ] Settings loads with `?upgraded=true` param → success banner shown

---

## 14. Ask Stormo — AI Chatbot

**Component:** `AskStormo` · **API:** `POST /api/ask-stormo/message`, `GET /api/ask-stormo/history`

### What it does
A floating AI assistant (bottom-right of every dashboard page) powered by Claude. It knows your store profile — product type, niche, target customer, and available time — so every answer is specific to your situation. Conversation history is saved and restored when you reopen the chat.

### How to open
Click the **orange circular chat button** at the bottom-right of any dashboard page. Click it again (or the X) to close.

### Suggestion prompts (shown when chat is empty)
- "What should I focus on this week?"
- "How do I find micro-influencers for my store?"
- "What's working in my niche right now?"

### How to use
1. Click the chat button
2. Click a suggestion or type your question in the text area
3. Press **Enter** (without Shift) or click the orange **Send** button
4. Watch Stormo respond in real time — text streams in word by word
5. Ask follow-up questions — full conversation context is maintained (last 20 messages)
6. Click the **trash icon** in the chat header to start a fresh conversation
7. Click the **X** to close the panel (history is preserved for next time)

### Message limits
- Maximum **2,000 characters** per message
- A character counter appears when you are within 400 characters of the limit
- Messages over 2,000 characters are blocked with an error

### Testing Checklist
- [ ] Chat button visible on all dashboard pages
- [ ] Click button → panel slides up with suggestion prompts
- [ ] Click a suggestion → sends immediately, AI response streams in
- [ ] Type a custom question → response references your store niche/product type
- [ ] Close and reopen chat → previous conversation history restored
- [ ] Ask follow-up question → AI has context of previous messages
- [ ] Type 2,001+ characters → send button disabled, red counter shown, error message
- [ ] Trash icon → chat clears, suggestions screen shows again
- [ ] X button → panel closes, chat button returns
- [ ] Network error mid-stream → error message shown, empty placeholder removed

---

## 15. Push Notifications

**Component:** `NotificationPermissionBanner`, `PushNotificationSettings` · **API:** `POST/DELETE/GET /api/notifications/subscribe`

### What it does
Browser push notifications for when new daily actions are ready, milestones are unlocked, and weekly summaries are available. Works on desktop Chrome, Edge, Firefox, and Android Chrome.

### How to enable
**Method 1 — Banner (first-time prompt):**
1. After completing onboarding, a **"Stay on track" banner** appears at the top of the dashboard
2. Click **Enable Notifications**
3. Browser shows a native permission popup — click **Allow**
4. Banner disappears, notifications are now active

**Method 2 — Settings:**
1. Go to `/dashboard/settings`
2. In the **Push Notifications** section, click **Enable Push Notifications**
3. Browser permission popup → Allow

### How to disable
- Go to Settings → Push Notifications → click **Disable Notifications**
- Or go to your browser's site settings and revoke the permission manually

### Testing Checklist
- [ ] First dashboard visit post-onboarding → notification banner appears
- [ ] Click Enable → browser permission prompt appears
- [ ] Allow → banner disappears, no re-prompt on next visit
- [ ] Settings page → Push Notification status shows "Subscribed"
- [ ] Disable from settings → status changes to "Not subscribed"
- [ ] Re-enable from settings → works again without re-registering account

---

## 16. Weekly Summary Card

**Component:** `WeeklySummaryCard` · **API:** `GET /api/weekly-summary`

### What it does
A dismissible recap card that appears at the top of the dashboard on **Monday, Tuesday, and Wednesday** only, showing last week's performance: actions completed, day streak, total sales, and top channel. Generated automatically by a background cron job each Sunday night.

### Information shown
- Week label (e.g., "Week of Jun 23 – Jun 29")
- Actions completed last week
- Current day streak
- Total sales to date
- Top channel used
- Results highlight (if any results were logged)
- Sales progress toward Growth tier

### How to dismiss
Click the **X** button in the top-right corner. The card will not appear again for the rest of this week (stored in browser localStorage per week start date).

### Testing Checklist
- [ ] Visit dashboard on a Monday → summary card appears
- [ ] Visit dashboard Thursday–Sunday → summary card not shown
- [ ] Click X → card disappears immediately
- [ ] Refresh page after dismissing → card stays dismissed (localStorage check)
- [ ] Following Monday → new week's summary reappears

---

## 17. AI Insight Card

**Component:** `InsightCard` · **API:** `GET /api/insights`

### What it does
Shows the latest unread AI-generated marketing insight personalised to your store. Insights are generated by the platform based on your niche, channel patterns, and market trends. Each insight includes a title, body text, and optionally a "Read more" link.

### How to use
1. Insight card appears automatically on the dashboard below the weekly summary
2. Read the insight
3. Click **Dismiss** (or the X icon) to mark it as read — it will not show again
4. New insights appear as they are generated (typically weekly)

### Testing Checklist
- [ ] Insight card appears if unread insight exists
- [ ] Insight content references your store niche
- [ ] Dismiss insight → card disappears, does not reappear on refresh
- [ ] No unread insights → card does not render (no empty space)

---

## 18. Progress Tracker

**Component:** `ProgressTracker` · **API:** `GET /api/progress`

### What it does
Three stat cards at the top of the dashboard showing your current marketing momentum:
- **Actions this week** — how many actions completed in the current 7-day period
- **Current streak** — consecutive days with a completed action
- **Completion rate** — percentage of generated actions marked complete

### Testing Checklist
- [ ] After completing today's action → "Actions this week" increments
- [ ] Complete actions on consecutive days → streak counter climbs
- [ ] Miss a day → streak resets to 0 the following day
- [ ] Completion rate = (completed / total) × 100, shown as a percentage

---

## Quick Reference — All Dashboard URLs

| Page | URL | Auth required |
|---|---|---|
| Dashboard Home | `/dashboard` | ✅ |
| My Content | `/dashboard/content` | ✅ |
| Campaigns | `/dashboard/campaigns` | ✅ |
| Outreach CRM | `/dashboard/outreach` | ✅ |
| Performance | `/dashboard/performance` | ✅ |
| Milestones | `/dashboard/milestones` | ✅ |
| Settings | `/dashboard/settings` | ✅ |
| Onboarding | `/onboarding` | ✅ |
| Login | `/login` | ❌ |
| Register | `/register` | ❌ |
| Forgot Password | `/forgot-password` | ❌ |

---

## End-to-End Test Flow (Full User Journey)

Follow this sequence to verify every feature in one sitting:

```
1.  Register at /register with a fresh email + accept terms
2.  Verify email via inbox link
3.  Complete onboarding (answer all questions)
4.  Dashboard loads → action card shows today's task ✅
5.  Note the channel shown on Today's Focus Panel
6.  Copy the template from the action card
7.  Mark Complete → "All caught up!" shown on card
8.  Today's Focus Panel → "All done today!" ✅
9.  Action History → completed action appears at top ✅
10. Expand completed row → log results (reach: 100, sales: 1) → Save ✅
11. Log a sale via Sales Tracker (channel: Instagram) ✅
12. Navigate to Milestones → "First Step Forward" and "First Dollar" now unlocked ✅
13. Navigate to My Content → generating banner (wait for all 6 pieces) ✅
14. Copy any content piece from the modal ✅
15. Milestones → "Content Creator" unlocked ✅
16. Navigate to Campaigns → pick an event → generate campaign plan ✅
17. Navigate to Outreach → add a contact → generate AI pitch ✅
18. Milestones → "Outreach Explorer" unlocked ✅
19. Navigate to Performance → shows locked (need 20 results) → progress bar shown ✅
20. Log 9 more sales (total 10) → Growth Engine milestone + upgrade banner ✅
21. Navigate to Settings → upgrade button visible ✅
22. Open Ask Stormo → ask "What is my niche?" → AI names your store ✅
23. Enable push notifications from the Settings page ✅
24. Dismiss the weekly summary card (if visible) ✅
25. All features verified ✅
```

---

## Common Error States & What They Mean

| Error / State | Cause | What to do |
|---|---|---|
| "Generation paused — Failed query" | Duplicate action for today in DB | Click **Try Again** — shows "All caught up" if already done |
| "Could not load performance data" | API timeout or no results yet | Refresh the page; check results have been logged |
| Onboarding required prompt on Content page | Onboarding not completed | Complete onboarding at `/onboarding` |
| Weekly content still generating after 4 minutes | AI generation stalled | Refresh the page — triggers a new generation attempt |
| Streak shows 0 despite recent activity | Missed a calendar day | Streaks reset if no action is completed on a given day |
| Upgrade button greyed/missing | Fewer than 10 sales logged | Log sales via Sales Tracker or Milestones page |
| Notification permission denied | Browser blocked popups | Go to browser site settings → allow notifications for this site |

---

*Stormo.io Feature Guide — Generated 2026-06-29*
