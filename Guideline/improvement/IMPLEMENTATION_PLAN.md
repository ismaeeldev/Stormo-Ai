# Stormo — Master Implementation Plan
**Source Documents:** Claude API Integration | Engagement & Moving Forward | Phase 3 AI Learning System
**Prepared for:** Muhammad Ismaeel | Stormo.io | June 2026

---

## What the Client Wants (Plain Language)

The client wants Stormo to be a product that feels genuinely intelligent from the very first question, keeps merchants coming back every day, and has a clear reward system that pushes them toward their first 10 sales. Here is what that means in simple terms:

**Onboarding should feel smart, not robotic.**
Right now the onboarding asks every question to every merchant. The client wants it to read the merchant's store URL first so it already knows what they sell. Then, when the merchant types a free text answer, it should read what they wrote and skip any follow-up questions they already answered. A merchant who gives a detailed answer should fly through. A merchant who gives a thin answer gets gentle follow-ups.

**After onboarding, give merchants one clear action every day and get out of the way.**
No pressure, no instant "how did it go?" popup. The merchant does the action in their own time, then comes back and logs their results whenever they are ready. Actions rotate across channels so merchants are not doing the same thing every day.

**Show merchants their progress on the dashboard at all times.**
A visible sales counter (4 of 10 sales), a streak, total actions completed. The number 10 sales is the big goal because it unlocks the Growth plan. That goal should feel real and reachable every time they open the dashboard.

**Communicate by email for important moments, not random promotions.**
Welcome email when they finish onboarding. Nudge email if they go 3 days without logging in. Celebration email when they log a sale. Urgency email when their trial is almost up. All automatic, all triggered by what they actually do.

**Growth is earned, not sold.**
When the merchant logs their 10th sale, they see a congratulations message and an option to upgrade. They click it themselves, pay through Stripe, and Growth turns on immediately. Stormo never charges them automatically. Experienced sellers who already have sales can contact support to get Growth unlocked early — that option must be visible on the dashboard.

**Later (not now): AI learns what works for each merchant.**
After 50+ merchants are actively logging results, Stormo will start using that data to generate smarter actions — prioritizing Instagram if Instagram is working, avoiding TikTok if it is not. This is Phase 3 and is not needed for launch.

---

## Priority Levels

- **LAUNCH BLOCKER** — Must be done before first merchant-facing release
- **PRE-LAUNCH** — Should be done before scaling, can follow shortly after launch
- **VERSION 2** — Planned but not urgent

---

## Phase 1 — Smart Onboarding (Claude API Integration)
**Priority: LAUNCH BLOCKER**

### 1A. Store URL Analysis

**What it does:** When the merchant enters their store URL in Topic 1, the system fetches the homepage, sends the text to Claude, and gets back a structured profile of the store.

**What Claude extracts:**
- What they sell (product categories)
- Positioning (luxury / budget / boutique / mass market)
- Price tier (sub-$25 / $25–75 / $75–150 / $150+)
- Store stage (new and empty / early products / established)
- Unique value props (handmade, organic, vintage, sustainable)
- Target audience signals (age, gender, lifestyle)

**New API endpoint:** `POST /api/onboarding/analyze-store-url`
- Accept store URL
- Validate URL format
- Fetch homepage HTML (5 second timeout)
- Extract readable text using cheerio
- Send to Claude with analysis prompt (15 second timeout)
- Return structured JSON with the fields above
- On failure: return error, let merchant retry or skip

**Frontend changes:**
- After URL is entered, show a small loading indicator "Analyzing your store..."
- Display a brief confirmation showing what Claude found (e.g. "Handmade leather goods, boutique positioning")
- Store the analysis result and pass it as context to all remaining onboarding questions

**Error handling:**
- URL unreachable: "The store URL could not be reached. Please check the URL and try again."
- Timeout: allow retry or skip
- If skipped: proceed with onboarding, show all follow-up questions as fallback
- Never crash the onboarding flow

---

### 1B. Answer Parsing (Conditional Follow-up Questions)

**What it does:** After the merchant types a free text answer to any question, Claude reads it and extracts all the data points it contains. Only the follow-up questions for data points that are still MISSING are shown.

**Example:** Merchant types "women aged 25 to 45, urban, mid-upper income, love fashion and quality." Claude extracts: gender=female, ageRange=25-45, location=urban, incomeLevel=mid-upper, interests=fashion. Result: zero follow-up questions shown.

**New API endpoint:** `POST /api/onboarding/parse-answer`
- Accept: the free text answer + the topic it belongs to
- Send to Claude with a topic-specific prompt
- Return: JSON object with all extracted fields + list of missing fields
- Confidence score below 70%: return all fields as missing (show all follow-ups as fallback)
- On Claude failure: return all fields as missing (graceful degradation)

**Data points to extract per topic:**
- Topic 1: storeURL, productCategory, foundingStory, geographicReach, fulfillmentModel
- Topic 2: gender, ageRange, incomeLevel, interests, location, purchaseMotivation
- Topic 3: storeAge, salesCount, marketingAttempted, resultsOfAttempts
- Topic 4: weeklyHours, onCamera, socialMediaComfort, contentFormats
- Topic 5: nineDayTarget, sideProjectOrMainIncome, successDefinition

**Frontend changes:**
- After merchant submits a free text answer: call parse-answer API, show loading
- Render ONLY the follow-up questions for missing fields
- If all fields provided: skip all follow-ups, show the topic confirmation immediately
- Fall back to showing all follow-up questions if the API fails or confidence is low

**Environment:**
- `ANTHROPIC_API_KEY` must be set in Vercel environment variables
- Verify at startup — throw error immediately if missing

**Cost estimate:** ~6–7 Claude API calls per onboarding at $3/million tokens = negligible

---

## Phase 2 — Daily Engagement System
**Priority: LAUNCH BLOCKER (core items) / PRE-LAUNCH (communication items)**

### 2A. Daily Action Delivery (Day 2 Onward)
**Priority: LAUNCH BLOCKER**

**What it does:** Every morning at 8am in the merchant's local timezone, Stormo generates and delivers a new daily action. Actions are not random — they are chosen based on the merchant's profile, what channels they used recently, their capacity, and seasonal relevance.

**Action rotation rule:** Never the same channel two days in a row. Balanced weekly schedule:
| Day | Channel Focus |
|-----|--------------|
| Monday | Social media (Instagram / Pinterest) |
| Tuesday | Community outreach (Facebook groups / Reddit) |
| Wednesday | Email and list building |
| Thursday | Content and SEO |
| Friday | Influencer outreach |
| Saturday | Review and optimize |
| Sunday | Planning |

**Technical requirements:**
- Cron job / scheduled function runs at 8am per merchant timezone
- Query merchant's action history before generating — check what channel was used last, what has been done recently
- Pass history context to Claude prompt to ensure variety
- Store generated action in database ready for dashboard

---

### 2B. Results Logging on Dashboard
**Priority: LAUNCH BLOCKER**

**What it does:** Each action card on the dashboard has a results section that is empty until the merchant fills it in. There is no deadline, no popup forcing immediate input.

**Results fields:**
- Reach (how many people saw it)
- Engagement (likes, comments, clicks)
- Followers gained
- Sales attributed (optional)
- Free text notes

**Rules:**
- Results can be logged at any time — same day, next week, whenever
- No forced "how did it go?" modal on action completion
- The current "Mark Complete" flow should ask for outcome signal inline or skip it — the full results are logged from Action History separately
- Timestamp showing when results were last updated

**Current code note:** `DailyActionCard.tsx` currently shows a modal asking "How did it go?" on Mark Complete. Per client spec, this should eventually become a minimal inline capture. For now keep it but add the proper results logging to Action History rows (detailed results, not just the outcome signal dropdown).

---

### 2C. Sales Tracking Interface
**Priority: LAUNCH BLOCKER**

**What it does:** Merchants self-report sales. No integration with Shopify or other platforms in Version 1.

**Dashboard requirements:**
- Prominent sales counter — cannot be missed: "4 of 10 Sales"
- Visual progress bar toward 10 sales, with "Unlock Growth" label at the end
- Simple button or input to log a new sale
- Optional: attribute sale to a specific action or channel
- Running log of all sales with dates

**Placement:** Sales counter should be one of the most prominent elements on the main dashboard (above the fold).

---

### 2D. Progress Tracker
**Priority: LAUNCH BLOCKER**

**What it does:** Shows merchants where they are in their journey to keep them motivated.

**Must show:**
- Total actions completed to date
- Current streak (consecutive days with an action completed)
- Total sales logged (with progress bar toward 10)
- Days as a Stormo member
- Most used channel

---

### 2E. Growth Plan Unlock at 10 Sales
**Priority: LAUNCH BLOCKER**

**What it does:** When merchant logs their 10th sale, the Growth plan option becomes available. It is NEVER activated automatically.

**Sequence on 10th sale:**
1. Congratulations message appears on dashboard
2. Growth unlock card shows what new features are available
3. Email sent: "You have reached 10 sales. The Growth plan is now unlocked for you."
4. Push notification sent (if enabled)
5. Upgrade button becomes prominent on dashboard and account settings

**CRITICAL:** No automatic charges. Merchant initiates upgrade themselves through Stripe.

**Early unlock for experienced sellers:**
- Add a visible line in the Growth unlock section: "Already an experienced seller? Contact support to unlock Growth early."
- Also mention in onboarding when merchant indicates they already have sales
- Also mention in FAQ on website

---

### 2F. Plan Switching (Stripe)
**Priority: LAUNCH BLOCKER**

**Upgrade (Starter → Growth, $39/month):**
- Merchant initiates from account settings or the unlock card
- Stripe handles prorated billing
- Growth features activate immediately on successful payment
- Confirmation email sent
- Dashboard updates to show Growth status

**Downgrade (Growth → Starter):**
- Merchant initiates from account settings only (no automatic downgrade)
- Retains Growth access until end of current billing period
- Charged $29/month on next billing date
- All data, history, and sales records retained
- Confirmation email sent

**Trial to paid ($9 trial → $29/month Starter):**
- Trial lasts 30 days
- Auto-billed $29/month at end unless cancelled
- Email sequence: Day 1 welcome, Day 15 mid-trial check-in, Day 27 trial ending reminder, Day 29 final reminder, Day 30 billing confirmation

**Cancellation:**
- Straightforward from account settings — no dark patterns
- Retains access until end of billing period
- Data retained 60 days then deleted per Privacy Policy
- One cancellation confirmation email
- One re-engagement email 7 days after cancellation ("Is there anything we can improve?")
- No further contact unless they return
- Backend must handle all Stripe webhooks: upgrades, downgrades, cancellations, failed payments
- Failed payment: grace period email sequence before access is suspended

---

### 2G. Email Communication Sequence
**Priority: LAUNCH BLOCKER**

All emails sent from info@stormo.io via Zoho Mail. All triggered by merchant activity.

| Trigger | Email Subject | Timing |
|---------|--------------|--------|
| Onboarding complete | "Your plan is ready. Here is your first action." | Immediately |
| Day 1 action assigned | "Summary of your first action" + dashboard link | Same day |
| No login for 3 days | "Your daily actions are waiting." | Day 3 |
| First action completed | "Great start. Here is what to expect this week." | Same day |
| 7 days inactive | "A quick win action is waiting for you." | Day 7 |
| First sale logged | "Your first sale! Here is how to build on this." | Same day |
| 5 sales logged | "Halfway to Growth. Here is what unlocks at 10 sales." | Same day |
| 10 sales reached | "You have unlocked the Growth plan." | Same day |
| 14 days inactive | "Are you still building your store?" | Day 14 |
| 30 days as member | "Your monthly progress summary." | Day 30 |
| Trial ending in 3 days | "Your $9 trial ends soon. Continue for $29/month." | Day 27 |

---

### 2H. In-App Messaging and Banners
**Priority: PRE-LAUNCH**

Context-aware banners inside the dashboard:
- Celebrate milestones (first completed action, first sale, 10 sales)
- Surface new AI insights since last login
- Prompt results logging for actions completed more than 48 hours ago
- Show trial days remaining
- Announce Growth features when merchant reaches 8+ sales

---

### 2I. Push Notifications (PWA)
**Priority: PRE-LAUNCH**

Only available for merchants who installed Stormo as a PWA with notifications enabled.

**Approved triggers only:**
- New daily action ready each morning
- New AI insight or audience segment identified
- Approaching a sales milestone
- Seasonal opportunity coming up in their niche (within 7 days)
- Merchant has not logged in for 3 days

**Rule:** Maximum 2 push notifications per day.

---

### 2J. Weekly Summary
**Priority: PRE-LAUNCH**

Every Monday morning:
- Email with: actions completed last week, results highlights, preview of this week, encouraging message, sales progress toward 10
- Dashboard card showing the same summary

---

### 2K. AI Insight Alerts
**Priority: PRE-LAUNCH**

Beyond the daily action, generate at least one insight per merchant per week. Show as a card on the dashboard. Examples:
- A new audience segment not yet targeted
- A trending hashtag in their niche
- A seasonal event coming up relevant to their products
- A competitor gap or positioning opportunity
- A content format performing well in their category

Trigger a push notification or email when a new insight is generated.

---

### 2L. Inactive Merchant Re-engagement
**Priority: PRE-LAUNCH**

- Day 7 without login: email + push "Your actions are waiting. Here is a quick win."
- Day 14 without login: email "Final check-in. Are you still building your store?"
- Day 21+: no further automated contact. Data stays intact. Merchant can return at any time.
- Inactive merchants are NEVER deleted or downgraded automatically.

---

## Phase 3 — AI Learning System
**Priority: VERSION 2 — Start AFTER Phase 2 is stable with 50+ active merchants**

### 3A. Data Collection

**What it does:** When merchants log results, that data is stored and used to improve future action recommendations.

**New database tables needed:**
- `ActionResult`: stores raw results per action (platform, action_type, reach, engagement, attributed_sales, clicks, email_additions)
- `StrategyPerformance`: aggregated metrics per merchant per platform (avg_engagement_rate, avg_conversion_rate, total_attributed_sales, action_count)

---

### 3B. Nightly Aggregation Job

Runs every night. Reads all ActionResults from the past 90 days. Groups by merchant + platform + action type. Calculates average engagement rate and conversion rate. Updates StrategyPerformance table.

**Only use performance data in Claude prompts when:**
- Merchant has 20+ actions logged
- That action type has been tried 3+ times
- Data is from the past 60 days

---

### 3C. Performance-Informed Action Generation

**Without Phase 3 (current):**
"Generate an action for handmade leather seller, women 25–45 customers, 5 hrs/week, goal: 10 sales."

**With Phase 3:**
"Generate an action for handmade leather seller, women 25–45 customers, 5 hrs/week, goal: 10 sales. Performance: Instagram 14% engagement, 2% conversion. TikTok 6% engagement, 1% conversion. Email 4% click-through, 3% conversion. Prioritize Instagram and email. Deprioritize TikTok."

---

### 3D. Merchant Performance Dashboard

New section showing merchants their own data:
- Platform performance breakdown (Instagram 14%, TikTok 6%, Email 4% CTR)
- Action type comparison (videos vs carousels)
- Top 5 best performing actions
- Conversion funnel (Reach → Engagement → Sales)
- 30-day trend (is performance improving?)

---

## Implementation Order (Recommended)

### Immediate (Launch Blockers — in order)

1. **Answer Parsing** (1B) — Highest impact, contained change to onboarding page + 1 new API route
2. **URL Analysis** (1A) — Adds new dependency (cheerio), new API route, frontend loader
3. **Results Logging** (2B) — Add detailed results input to Action History rows
4. **Sales Counter + Progress Bar** (2C, 2D) — New dashboard widget, new DB queries
5. **Growth Unlock Trigger** (2E) — Logic in sale-logging API + UI unlock card
6. **Daily Action Scheduling** (2A) — Cron job, timezone-aware generation
7. **Email Sequences** (2G) — All triggered emails via Zoho Mail
8. **Stripe Plan Switching** (2F) — Upgrade / downgrade / cancellation flows + webhook handling

### Shortly After Launch (Pre-Launch)

9. **In-App Banners** (2H)
10. **Push Notifications / PWA** (2I)
11. **Weekly Summary** (2J)
12. **AI Insight Alerts** (2K)
13. **Re-engagement Sequences** (2L)

### After 50+ Active Merchants (Version 2)

14. **ActionResult DB table + results UI** (3A)
15. **Nightly aggregation job** (3B)
16. **Performance-informed Claude prompts** (3C)
17. **Merchant performance dashboard** (3D)

---

## Files That Will Be Touched

| Feature | Files |
|---------|-------|
| URL Analysis | `app/api/onboarding/analyze-store-url/route.ts` (new), `app/(dashboard)/onboarding/page.tsx` |
| Answer Parsing | `app/api/onboarding/parse-answer/route.ts` (new), `app/(dashboard)/onboarding/page.tsx` |
| Results Logging | `components/dashboard/ActionHistoryList.tsx`, new API route for saving results |
| Sales Counter | New dashboard widget component, `app/api/sales/` routes (new) |
| Growth Unlock | `app/(dashboard)/dashboard/page.tsx`, account settings page |
| Email Sequences | New email service file `lib/email/`, trigger points in various API routes |
| Stripe Webhooks | `app/api/webhooks/stripe/route.ts` (new or existing) |
| Daily Scheduling | `lib/cron/daily-action.ts` (new), Vercel Cron configuration |
| Phase 3 DB | `lib/db/schema.ts` (add ActionResult, StrategyPerformance tables) |

---

## Notes and Constraints

- All billing is handled through Stripe. No manual plan changes in code.
- Sales in Version 1 are fully self-reported. No platform integrations.
- Growth plan is NEVER activated automatically. Always merchant-initiated.
- Inactive merchants are NEVER deleted or downgraded automatically.
- Onboarding must never crash even if Claude API is down — always fall back to showing all questions.
- Claude API key stored in Vercel as `ANTHROPIC_API_KEY`. Verify on startup.
- URL fetch timeout: 5 seconds. Claude API timeout: 15 seconds.
- Max 2 push notifications per day per merchant.
- Phase 3 does not begin until Phase 2 is stable with 50+ active merchants logging results.
