# Stormo — Master Implementation Plan
**Source Documents:** Claude API Integration | Engagement & Moving Forward | Phase 3 AI Learning System
**Prepared for:** Muhammad Ismaeel | Stormo.io | June 2026
**Purpose:** Comprehensive engineering roadmap. Detailed enough for an AI agent to build each feature without ambiguity.

---

## What the Client Wants (Plain Language Summary)

Read this first. Every technical decision below serves one of these five goals.

1. **Onboarding must feel intelligent.** When a merchant types their store URL, Stormo analyzes it with Claude and already knows what they sell before asking a single question. When they type a free-text answer, Claude reads it and skips follow-up questions they already answered. A merchant who writes "women 25–45, urban, mid-income, love fashion" answers one question and skips four. A merchant who writes "people who like stuff" gets four follow-ups.

2. **One action per day, no pressure.** Every morning at 8am, one clear action is ready. Stormo delivers it and gets out of the way. No popup forcing the merchant to log results immediately. Results get logged later from Action History when the merchant is ready.

3. **Sales counter drives everything.** On the main dashboard, a prominent counter shows "4 of 10 Sales" with a progress bar. 10 sales = Growth plan unlocked. This goal must be impossible to miss. It is the product's core motivational engine.

4. **Smart emails at the right moments.** Triggered by what the merchant actually does, not a calendar. Welcome when they finish onboarding. Nudge after 3 days of no login. Celebrate the first sale. Warn when the trial ends. Nothing random.

5. **Growth is earned and manually upgraded.** At 10 sales, a congratulations screen appears and an upgrade button becomes visible. Stormo never charges automatically. The merchant clicks upgrade and pays through Stripe themselves. Experienced sellers who already have sales can contact support to unlock Growth early — this option must be visible in the product.

---

## Priority Levels Used in This Plan

| Level | Meaning |
|-------|---------|
| LAUNCH BLOCKER | Must be complete before any merchant can use the product |
| PRE-LAUNCH | Must be complete before scaling or public marketing |
| VERSION 2 | Build after 50+ active merchants are using the product |

---

## Existing Codebase — What Already Exists

Before building anything, understand the current state so nothing gets broken.

**Authentication:** `auth.ts` — NextAuth v5 with JWT strategy. Credentials + Google OAuth. Custom `users` table in PostgreSQL via Drizzle ORM.

**Database:** `lib/db/schema.ts` — Drizzle schema. Tables: `users`, `store_profiles`, `actions`, `action_compressed_summaries`, `weekly_content`, `outreach_contacts`, `milestones`, `ask_stormo_messages`.

**Onboarding:** `app/(dashboard)/onboarding/page.tsx` — Chat-style UI. 27 static questions in `ONBOARDING_QUESTIONS` array. State saved to `localStorage` key `stormo_onboarding_state`. On completion calls `POST /api/onboarding/complete`.

**Dashboard:** `app/(dashboard)/layout.tsx` — Sidebar layout. `app/(dashboard)/dashboard/page.tsx` — main dashboard page with `DailyActionCard` and `ActionHistoryList`.

**Action generation:** `lib/ai/action-generator.ts` — Claude API call that generates daily actions.

**Email:** `lib/email/sender.ts` — Nodemailer with a generic SMTP transporter. Config via env vars `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. `lib/email/send-templates.ts` wraps `sendEmail()` and loads HTML from `lib/email/templates/`. Already has `sendWelcomeEmail`, `sendVerificationEmail`, `sendPasswordResetEmail`, `sendSubscriptionActiveEmail`, `sendPaymentFailedEmail`, `sendSubscriptionCanceledEmail`, `sendMilestoneEmail`.

**Existing API routes:**
- `POST /api/onboarding/complete` — saves onboarding answers, marks user complete, generates first action
- `GET /api/actions/today` — returns today's action
- `POST /api/actions/generate` — generates a new action
- `PATCH /api/actions/[id]/complete` — marks action complete with outcome signal
- `PATCH /api/actions/[id]/postpone` — postpones action to tomorrow
- `GET /api/actions/history` — returns paginated action history

**Do NOT modify** the core action generation logic, the existing onboarding question text, the chat UI layout, or the NextAuth session structure unless explicitly specified in this plan.

---

---

# PHASE 1 — Smart Onboarding (Claude API Integration)
**Priority: LAUNCH BLOCKER**
**Estimated time: 10–12 days**
**Must be complete before any merchant uses the product.**

---

## 1.1 Environment Setup

**What this step does:** Ensures the Claude API key is available and verified. Without this, nothing in Phase 1 works.

### Step-by-step

1. Add `ANTHROPIC_API_KEY=sk-ant-xxxxx` to your Vercel environment variables (Production, Preview, and Development).
2. Add it to your local `.env.local` file for development.
3. Create a shared helper at `lib/ai/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

4. This file is imported by all Phase 1 API routes. If the key is missing, the app throws at startup rather than failing silently during an onboarding session.

### Testing 1.1
- Start the dev server. If `ANTHROPIC_API_KEY` is not set, the server should throw an error on boot.
- If set correctly, the server starts normally.

---

## 1.2 Store URL Analysis — Backend

**What this step does:** Creates the API endpoint that receives a store URL, fetches its homepage HTML, and asks Claude to analyze the store.

### New file: `app/api/onboarding/analyze-store-url/route.ts`

**Request shape:**
```json
POST /api/onboarding/analyze-store-url
{ "url": "https://example-store.com" }
```

**Response shape (success):**
```json
{
  "success": true,
  "analysis": {
    "productCategories": ["handmade leather goods", "wallets", "belts"],
    "positioning": "boutique",
    "priceTier": "$75-150",
    "storeStage": "early products",
    "uniqueValueProps": ["handmade", "genuine leather", "small batch"],
    "targetAudienceSignals": {
      "ageRange": "25-45",
      "gender": "mostly male",
      "lifestyle": "professional, quality-focused"
    },
    "summary": "A small-batch handmade leather goods store targeting professional men aged 25-45 who value quality craftsmanship over fast fashion."
  }
}
```

**Response shape (error — unreachable URL):**
```json
{
  "success": false,
  "error": "URL_UNREACHABLE",
  "message": "The store URL could not be reached. Please check the URL and try again."
}
```

**Response shape (error — invalid URL):**
```json
{
  "success": false,
  "error": "INVALID_URL",
  "message": "Please enter a valid store URL (e.g. https://mystore.com)."
}
```

### Implementation steps inside the route:

**Step 1 — Validate URL format.** Use a regex or the URL constructor. If invalid, return INVALID_URL immediately without fetching.

**Step 2 — Fetch homepage HTML.** Use `fetch(url, { signal: AbortSignal.timeout(5000) })`. This gives a 5-second timeout. If it times out or fails, return URL_UNREACHABLE.

**Step 3 — Extract readable text from HTML.** Install `cheerio` (`npm install cheerio`). Remove script tags, style tags, nav, footer. Extract text from body. Limit to 3000 characters to keep Claude tokens low.

**Step 4 — Call Claude with the analysis prompt.** Use `claude-sonnet-4-6` model. Max tokens: 500. Prompt:

```
You are analyzing a merchant's online store homepage to help build their marketing profile.

Here is the homepage text content:
<homepage>
[INSERT EXTRACTED TEXT HERE]
</homepage>

Extract the following information and return ONLY valid JSON matching this exact structure:
{
  "productCategories": ["string array of what they sell"],
  "positioning": "one of: luxury, boutique, mid-market, budget, mass-market",
  "priceTier": "one of: sub-$25, $25-75, $75-150, $150+",
  "storeStage": "one of: new and empty, early products, established catalog",
  "uniqueValueProps": ["string array: handmade, organic, vintage, sustainable, etc"],
  "targetAudienceSignals": {
    "ageRange": "estimated age range or null",
    "gender": "mostly female / mostly male / both / null",
    "lifestyle": "brief description or null"
  },
  "summary": "One sentence describing what this store sells and who it targets."
}

If you cannot determine a field from the homepage, use null. Do not guess beyond what is visible.
Return ONLY the JSON object. No explanation, no markdown.
```

**Step 5 — Parse the JSON response.** Wrap in try-catch. If parsing fails, return as if URL_UNREACHABLE (fall back gracefully).

**Step 6 — Return the analysis.** Return `{ success: true, analysis: parsedJSON }`.

### Dependencies
- `cheerio` package must be installed: `npm install cheerio`
- `lib/ai/claude.ts` must exist (from step 1.1)

### Important constraints
- URL fetch timeout: 5 seconds hard limit
- Claude API timeout: 15 seconds hard limit
- Never let a failure here crash onboarding — always return a usable response (even if that response says to fall back)
- Do NOT require authentication for this endpoint — it is called before the user is in the session state (optional: you can protect it with session auth if preferred, but it is not required)

---

## 1.3 Store URL Analysis — Frontend

**What this step does:** After the merchant submits their store URL (`t1_q1_url`), the frontend calls the analyze-store-url API, shows a "Analyzing your store..." message, then shows a confirmation of what was found before advancing to the next question.

**File to modify:** `app/(dashboard)/onboarding/page.tsx`

### Changes needed:

**Step 1 — Add state for store analysis.** Add to the component state:
```typescript
const [storeAnalysis, setStoreAnalysis] = useState<any>(null);
const [isAnalyzingStore, setIsAnalyzingStore] = useState(false);
```

**Step 2 — Modify `handleTextSubmit` for URL question.** When the current question is `t1_q1_url`, instead of immediately calling `handleNextQuestion`, call the analyze-store-url API first:

```typescript
if (currentQuestion.id === 't1_q1_url') {
  setIsAnalyzingStore(true);
  // Show "Analyzing your store..." in the chat as an assistant message
  setMessages(prev => [...prev, { role: 'user', content: inputText.trim() }]);
  setMessages(prev => [...prev, { role: 'assistant', content: 'Analyzing your store...' }]);
  
  try {
    const res = await fetch('/api/onboarding/analyze-store-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: inputText.trim() }),
    });
    const data = await res.json();
    
    if (data.success && data.analysis) {
      setStoreAnalysis(data.analysis);
      // Replace the "Analyzing..." message with the result
      const confirmText = `Got it. I can see you're selling ${data.analysis.summary} I'll use this to personalize your remaining questions.`;
      // Update the last assistant message
    } else {
      // URL failed — proceed anyway, show all questions as fallback
      setStoreAnalysis(null);
    }
  } catch {
    setStoreAnalysis(null);
  } finally {
    setIsAnalyzingStore(false);
    // Now advance to the next question
    handleNextQuestion(inputText.trim(), inputText.trim());
  }
  return;
}
```

**Step 3 — Pass storeAnalysis to answers.** Store the analysis in `answers` state under a key like `storeAnalysisResult` so it gets sent to `/api/onboarding/complete` and is available for the action generator.

**Step 4 — Show loading state.** While `isAnalyzingStore` is true, disable the input and show a spinner.

**Step 5 — Skip/retry option.** If the analysis fails, show a message: "I couldn't read your store URL, but that's okay — let's continue." and advance the flow normally.

### What NOT to change
- Do not change the `ONBOARDING_QUESTIONS` array structure
- Do not change the chat message rendering
- Do not change the `handleNextQuestion` logic for other questions

---

## 1.4 Answer Parsing — Backend

**What this step does:** Creates the API endpoint that receives a free-text answer from any onboarding question, asks Claude what data points the answer contains, and returns the list of fields that are still missing.

### New file: `app/api/onboarding/parse-answer/route.ts`

**Request shape:**
```json
POST /api/onboarding/parse-answer
{
  "answer": "women aged 25 to 45, urban areas, mid-upper income, love fashion and quality craftsmanship",
  "topicId": "topic2",
  "existingAnswers": { "storePlatform": "Shopify", "productType": "handmade bags" }
}
```

**Response shape (success — fields extracted):**
```json
{
  "success": true,
  "confidence": 0.92,
  "extracted": {
    "gender": "mostly female",
    "ageRange": "25-45",
    "incomeLevel": "mid-upper",
    "interests": ["fashion", "quality craftsmanship"],
    "location": "urban"
  },
  "missingFields": ["purchaseMotivation"],
  "skipFollowUps": ["t2_q2_age", "t2_q3_gender"]
}
```

**Response shape (low confidence or failure — show all follow-ups):**
```json
{
  "success": true,
  "confidence": 0.45,
  "extracted": {},
  "missingFields": ["gender", "ageRange", "incomeLevel", "interests", "location", "purchaseMotivation"],
  "skipFollowUps": []
}
```

### Topic-to-fields mapping (build this as a constant in the route file):

```typescript
const TOPIC_FIELDS = {
  topic1: {
    fields: ['productCategory', 'foundingStory', 'geographicReach', 'fulfillmentModel'],
    skipIfExtracted: ['t1_q3_desc']
  },
  topic2: {
    fields: ['gender', 'ageRange', 'incomeLevel', 'interests', 'location', 'purchaseMotivation'],
    skipIfExtracted: ['t2_q2_age', 't2_q3_gender']
  },
  topic3: {
    fields: ['storeAge', 'salesCount', 'marketingAttempted', 'resultsOfAttempts'],
    skipIfExtracted: ['t3_q1_sales', 't3_q2_ads']
  },
  topic4: {
    fields: ['weeklyHours', 'onCamera', 'socialMediaComfort', 'contentFormats'],
    skipIfExtracted: ['t4_q1_time', 't4_q5_on_camera']
  },
  topic5: {
    fields: ['nineDayTarget', 'sideProjectOrMainIncome', 'successDefinition'],
    skipIfExtracted: ['t5_q2_goal_type']
  }
};
```

### Claude prompt for answer parsing:

```
You are extracting structured data from a merchant's onboarding answer.

Topic: [TOPIC_NAME]
The merchant answered: "[ANSWER_TEXT]"

Extract any of these fields you can confidently identify from the answer:
[LIST OF FIELDS FOR THIS TOPIC]

Return ONLY valid JSON in this exact structure:
{
  "confidence": 0.0 to 1.0 (how confident you are in the extraction overall),
  "extracted": {
    "fieldName": "extracted value or null if not mentioned"
  },
  "missingFields": ["list of field names NOT mentioned in the answer"]
}

Rules:
- Only extract what is clearly stated. Do not guess or infer beyond the text.
- If confidence is below 0.70, set all fields to null and list everything as missing.
- Return ONLY the JSON object.
```

### Confidence threshold rule:
If `confidence < 0.70`, return `{ skipFollowUps: [] }` so ALL follow-up questions are shown. This prevents the system from skipping questions based on uncertain data.

### Graceful degradation:
If the Claude API call fails for any reason (timeout, error, network), return `{ success: true, skipFollowUps: [], missingFields: ALL_FIELDS }`. The frontend falls back to showing all follow-up questions. **Never return an error status that breaks the onboarding flow.**

---

## 1.5 Answer Parsing — Frontend

**What this step does:** After the merchant answers a free-text question, the frontend calls parse-answer, then skips any follow-up questions that were already answered.

**File to modify:** `app/(dashboard)/onboarding/page.tsx`

### Changes needed:

**Step 1 — Add state for skippable questions:**
```typescript
const [skippedQuestionIds, setSkippedQuestionIds] = useState<string[]>([]);
```

**Step 2 — Add `parseAnswerIfNeeded` helper function:**

This runs after any free-text answer is submitted. It calls the API and updates `skippedQuestionIds`.

```typescript
const parseAnswerIfNeeded = async (questionId: string, answer: string) => {
  // Only run for free-text questions that have a topicId mapping
  const topicMap: Record<string, string> = {
    't1_q3_desc': 'topic1',
    't2_q1_target': 'topic2',
    't3_q3_marketing': 'topic3',
    // Add other free-text question IDs here
  };
  
  const topicId = topicMap[questionId];
  if (!topicId) return; // Not a parseable question
  
  try {
    const res = await fetch('/api/onboarding/parse-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer, topicId, existingAnswers: answers }),
    });
    const data = await res.json();
    if (data.success && data.skipFollowUps?.length > 0) {
      setSkippedQuestionIds(prev => [...new Set([...prev, ...data.skipFollowUps])]);
    }
  } catch {
    // Fail silently — skippedQuestionIds stays empty, all follow-ups shown
  }
};
```

**Step 3 — Modify `handleNextQuestion` to skip questions:**

When advancing to the next question, check if the next question's ID is in `skippedQuestionIds`. If it is, skip it and go to the one after:

```typescript
const findNextUnskippedIndex = (startIndex: number): number => {
  let idx = startIndex;
  while (idx < ONBOARDING_QUESTIONS.length && skippedQuestionIds.includes(ONBOARDING_QUESTIONS[idx].id)) {
    idx++;
  }
  return idx;
};
```

Use `findNextUnskippedIndex(currentQuestionIndex + 1)` instead of `currentQuestionIndex + 1` when advancing.

**Step 4 — Show subtle skip notification.** When 1 or more questions are skipped, add a brief assistant message: "Great detail — I'll skip a few questions I already have the answers to."

**Step 5 — Call `parseAnswerIfNeeded` from `handleTextSubmit`.** After getting the answer and before calling `handleNextQuestion`, call the parser asynchronously:

```typescript
// In handleTextSubmit:
parseAnswerIfNeeded(currentQuestion.id, inputText.trim()); // fire-and-forget, don't await
handleNextQuestion(inputText.trim(), inputText.trim());
```

Note: Fire-and-forget means skipping happens slightly asynchronously. If the API call takes longer than the next question appears, the skip effect kicks in for the question after. This is acceptable behavior and better than blocking the flow.

### What NOT to change
- The `ONBOARDING_QUESTIONS` array — questions are still defined, they are just conditionally skipped
- The flow logic for choice questions, multi-choice, or confirmation steps
- The `handleFinish` function

---

## Testing Phase 1

### Test 1.1 — URL Analysis happy path
- Input: a real Shopify store URL
- Expected: JSON with productCategories, positioning, priceTier fields populated
- Check: response arrives in under 8 seconds

### Test 1.2 — URL Analysis unreachable URL
- Input: `https://this-domain-definitely-does-not-exist-12345.com`
- Expected: `{ success: false, error: "URL_UNREACHABLE" }`
- Check: onboarding continues normally without crashing

### Test 1.3 — URL Analysis invalid format
- Input: `not a url`
- Expected: `{ success: false, error: "INVALID_URL" }`

### Test 1.4 — Answer parsing with complete detail
- Input topic2, answer: "women 25-45, urban areas, mid-upper income, love fashion and quality"
- Expected: `skipFollowUps` includes `t2_q2_age` and `t2_q3_gender`
- Check: those questions are skipped in the flow

### Test 1.5 — Answer parsing with vague answer
- Input topic2, answer: "people who like my stuff"
- Expected: `skipFollowUps: []`, all follow-ups appear
- Check: age, gender questions still show

### Test 1.6 — Answer parsing when Claude API is down
- Simulate by setting `ANTHROPIC_API_KEY` to an invalid value temporarily
- Expected: onboarding completes normally, all questions show
- Check: no error thrown, no crash

### Test 1.7 — Full onboarding flow end-to-end
- Go through full onboarding with a detailed merchant profile
- Count how many questions appeared vs the total 27
- Expected: a detailed merchant skips at least 2–4 questions

---

---

# PHASE 2 — Daily Engagement Core
**Priority: LAUNCH BLOCKER**
**Estimated time: 12–15 days**
**Must be complete before any merchant uses the product.**

---

## 2.1 Results Logging on Action History

**What this step does:** Merchants can log results (reach, engagement, followers, sales, notes) for any action at any time from Action History. This replaces or supplements the current outcome-signal dropdown.

**What the client wants:** No forced popup on completion. The "Mark Complete" button just marks it done. Detailed results are logged later from the Action History list, when the merchant is ready.

### 2.1.1 Database changes

**File to modify:** `lib/db/schema.ts`

Add the following columns to the existing `actions` table (or create a separate `action_results` table — separate table is preferred for cleanliness):

```typescript
export const actionResults = pgTable('action_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  actionId: uuid('action_id').references(() => actions.id, { onDelete: 'cascade' }).unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  reach: integer('reach'),
  engagement: integer('engagement'),
  followersGained: integer('followers_gained'),
  salesAttributed: integer('sales_attributed').default(0),
  notes: text('notes'),
  loggedAt: timestamp('logged_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

Run migration after schema change: `npx drizzle-kit push` (or `generate` + `migrate` depending on your workflow).

### 2.1.2 New API endpoint

**File:** `app/api/actions/[id]/results/route.ts`

**POST — Log or update results for an action:**
```json
POST /api/actions/[id]/results
{
  "reach": 450,
  "engagement": 32,
  "followersGained": 5,
  "salesAttributed": 1,
  "notes": "Got two DMs from potential buyers"
}
```
Response: `{ "success": true, "results": { ...saved data } }`

**GET — Get existing results for an action:**
```json
GET /api/actions/[id]/results
```
Response: `{ "results": { ...data } }` or `{ "results": null }` if none logged yet.

Both endpoints require authentication. Verify `session.user.id` matches the action's `userId`.

### 2.1.3 Frontend — Action History row expansion

**File to modify:** `components/dashboard/ActionHistoryList.tsx`

**Change:** Each row in the history table should be expandable. Clicking a row opens an inline panel below it (not a modal) showing:
- Current logged results (if any)
- A form to log or update results
- Fields: Reach (number input), Engagement (number input), Followers Gained (number input), Sales Attributed (number input), Notes (textarea)
- A "Save Results" button
- Timestamp of last update if results exist

Add state:
```typescript
const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
const [resultsForm, setResultsForm] = useState<Record<string, any>>({});
const [isSavingResults, setIsSavingResults] = useState(false);
```

**When a row is clicked:** toggle `expandedRowId`. Fetch existing results via `GET /api/actions/[id]/results` and pre-fill the form.

**When "Save Results" is clicked:** call `POST /api/actions/[id]/results` with the form data. Show success/error inline.

### Testing 2.1
- Open Action History, click a completed action row
- Form should expand inline
- Fill in reach=100, engagement=10, notes="test"
- Click Save — data should persist
- Reload page, click same row — form should pre-fill with saved data
- Verify in DB that `action_results` table has the record

---

## 2.2 Sales Tracking Interface

**What this step does:** Adds a sales counter to the main dashboard. Merchants tap a button to log each sale. Progress bar shows how close they are to 10 sales (Growth unlock).

**What the client wants:** This counter must be impossible to miss. It should be one of the most prominent elements on the dashboard.

### 2.2.1 Database changes

The `users` table already has `totalSales: integer('total_sales').default(0)`. No new columns needed. We will also create a `sales` table to keep a log with dates and attribution:

**Add to `lib/db/schema.ts`:**
```typescript
export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  actionId: uuid('action_id').references(() => actions.id, { onDelete: 'set null' }),
  channel: varchar('channel', { length: 100 }),
  notes: text('notes'),
  loggedAt: timestamp('logged_at').defaultNow(),
});
```

### 2.2.2 New API endpoints

**File:** `app/api/sales/route.ts`

**POST — Log a new sale:**
```json
POST /api/sales
{
  "actionId": "uuid-optional",
  "channel": "instagram",
  "notes": "First customer from my reel"
}
```
This should:
1. Insert into `sales` table
2. Increment `users.totalSales` by 1
3. Check if `totalSales` now equals 10 — if yes, trigger the Growth unlock flow (send email, set a flag)
4. Return: `{ "success": true, "totalSales": 5, "growthUnlocked": false }`

**GET — Get sales count and log:**
```json
GET /api/sales
```
Returns: `{ "totalSales": 4, "sales": [ ...list of logged sales with dates ] }`

### 2.2.3 Frontend — Sales Counter Widget

**Create new file:** `components/dashboard/SalesCounter.tsx`

This is a client component. On mount it fetches `GET /api/sales`.

**Visual design:**
- Card with an orange accent
- Large number: "4" 
- Subtitle: "of 10 Sales to Growth"
- Progress bar: filled to 40% (4/10)
- A prominent "Log a Sale" button (orange, full width)
- Below the button: a small log showing the 3 most recent sales with dates

**When "Log a Sale" is clicked:**
- A small inline form appears (not a modal): Channel dropdown (Instagram, TikTok, Email, Pinterest, Reddit, Other) + Notes textarea (optional) + "Save Sale" button
- On save: POST to `/api/sales`, update the counter immediately, close the form
- If `totalSales` hits 10: show the Growth unlock celebration (see Phase 2.4)

**Add this widget to:** `app/(dashboard)/dashboard/page.tsx` — place it prominently near the top of the page, above or next to the daily action.

### Testing 2.2
- Open dashboard — sales counter should show current total
- Click "Log a Sale" — form appears
- Submit a sale — counter increments immediately without page reload
- Log 10 sales total — Growth unlock celebration should appear (see 2.4)
- Check DB: `users.totalSales` incremented, `sales` table has record

---

## 2.3 Progress Tracker Widget

**What this step does:** Shows the merchant their journey stats in one place. Keeps them motivated by making progress visible.

### 2.3.1 New API endpoint

**File:** `app/api/progress/route.ts`

```json
GET /api/progress
```

Returns:
```json
{
  "totalActionsCompleted": 14,
  "currentStreak": 3,
  "totalSales": 4,
  "daysAsMember": 12,
  "mostUsedChannel": "instagram"
}
```

**How to calculate each field:**
- `totalActionsCompleted`: COUNT from `actions` WHERE `userId = ?` AND `status = 'completed'`
- `currentStreak`: Count consecutive days (counting back from today) where at least one action has `status = 'completed'`. Stop counting when you hit a day with no completed action.
- `totalSales`: Read from `users.totalSales`
- `daysAsMember`: `Math.floor((Date.now() - user.createdAt) / 86400000)`
- `mostUsedChannel`: GROUP BY `channel` from completed actions, ORDER BY COUNT DESC, LIMIT 1

### 2.3.2 Frontend — Progress Tracker Component

**Create new file:** `components/dashboard/ProgressTracker.tsx`

Client component. Fetches `GET /api/progress` on mount.

**Visual design — 5 stat cards in a row (or 2+3 on mobile):**

| Stat | Icon | Value |
|------|------|-------|
| Actions Completed | CheckCircle | 14 |
| Day Streak | Flame | 3 days |
| Sales Logged | ShoppingBag | 4 / 10 |
| Member Since | Calendar | 12 days |
| Top Channel | TrendingUp | Instagram |

**Add to:** `app/(dashboard)/dashboard/page.tsx` — place it below the daily action card and above the action history.

### Testing 2.3
- New account: all stats should show 0 or "1 day"
- Complete an action: actions completed increments
- Complete actions 3 days in a row: streak shows 3
- Skip a day: streak resets to 0 on that day

---

## 2.4 Growth Plan Unlock at 10 Sales

**What this step does:** When the merchant logs their 10th sale, a congratulations screen appears on the dashboard. The Growth upgrade button becomes permanently visible. No automatic charges.

### 2.4.1 Database change

Add to `users` table in `lib/db/schema.ts`:
```typescript
growthUnlocked: boolean('growth_unlocked').default(false),
```

Run migration.

### 2.4.2 Growth unlock trigger logic

**In `app/api/sales/route.ts`** (from step 2.2.2), after incrementing `totalSales`:

```typescript
if (newTotalSales >= 10 && !user.growthUnlocked) {
  // Mark growth as unlocked
  await db.update(users)
    .set({ growthUnlocked: true, updatedAt: new Date() })
    .where(eq(users.id, userId));
  
  // Send congratulations email
  await sendGrowthUnlockEmail(user.email, user.name);
  
  // Return flag so frontend can show celebration
  return NextResponse.json({ success: true, totalSales: newTotalSales, growthUnlocked: true });
}
```

### 2.4.3 Frontend — Growth Unlock Card

**In `components/dashboard/SalesCounter.tsx`:**

When the API returns `growthUnlocked: true` (either from a fresh log or from `GET /api/sales` on page load):
- Replace the progress bar section with a "You Did It!" celebration card
- Show: orange confetti effect, "You've logged 10 sales! The Growth plan is now available." message
- Show an "Upgrade to Growth — $39/month" button that links to `/dashboard/settings?upgrade=true`
- Show below the button: "Already an experienced seller? Contact support to unlock Growth early." (link to `mailto:info@stormo.io?subject=Early Growth Unlock Request`)

**Permanent visibility:** Once `growthUnlocked` is true for a user, this upgrade prompt should always show at the bottom of the sales counter — even after they've dismissed the celebration once.

### 2.4.4 Email — Growth Unlock

**Add to `lib/email/send-templates.ts`:**

```typescript
export async function sendGrowthUnlockEmail(email: string, name: string) {
  // Send via Zoho SMTP (same pattern as existing sendWelcomeEmail)
  // Subject: "You've reached 10 sales. The Growth plan is now unlocked for you."
  // Body: Congratulations message, list of what Growth includes, link to upgrade in settings
}
```

Growth plan features to list in email:
- Paid advertising guidance (Meta Ads, Google Ads basics)
- Advanced influencer outreach strategies and templates
- Deeper AI insights with competitive analysis
- Priority support response time
- Seasonal campaign planning tools in advance
- Advanced results analytics

### Testing 2.4
- Start with a test account with 9 logged sales
- Log the 10th sale — confetti animation should appear on dashboard
- "Upgrade to Growth" button should appear and be visible on all future visits
- Check DB: `users.growthUnlocked = true`
- Check email: growth unlock email received at test address
- Verify no automatic subscription change happened

---

## 2.5 Daily Action Scheduling (Cron)

**What this step does:** Every day at 8am in the merchant's local timezone, a new daily action is automatically generated and saved to the database. When the merchant opens the dashboard, the action is already there.

**Current behavior:** Actions are generated on-demand when the merchant opens the dashboard (if none exist for today). This is fine for now but needs to become proactive.

### 2.5.1 Database change

Add to `users` table in `lib/db/schema.ts`:
```typescript
timezone: varchar('timezone', { length: 100 }).default('UTC'),
lastLoginAt: timestamp('last_login_at'),
```

Also store the timezone during onboarding. In `app/(dashboard)/onboarding/page.tsx`, when the page loads, detect and send the user's timezone:
```typescript
// On mount, after session loads:
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Send this to a PATCH /api/users/timezone endpoint
```

### 2.5.2 New API endpoint for timezone

**File:** `app/api/users/timezone/route.ts`

```json
PATCH /api/users/timezone
{ "timezone": "America/New_York" }
```
Updates `users.timezone` for the authenticated user.

### 2.5.3 Vercel Cron configuration

**File:** `vercel.json` (create if it doesn't exist)

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-actions",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour. The cron route itself checks which merchants are in the 8am window for their timezone.

### 2.5.4 Cron route

**File:** `app/api/cron/daily-actions/route.ts`

```typescript
export async function GET(request: Request) {
  // Verify this is a legitimate Vercel cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get current UTC hour
  const utcHour = new Date().getUTCHours();
  
  // Find all users whose local time is currently 8am
  // Logic: for each timezone, find which UTC offset corresponds to 8am
  // Get all users, check if (utcHour + tzOffset) % 24 === 8
  
  const eligibleUsers = await getUsersWhoseLocalTimeIs8am(utcHour);
  
  for (const user of eligibleUsers) {
    try {
      // Check if they already have a pending action for today
      const todayAction = await getTodaysAction(user.id);
      if (!todayAction) {
        await generateDailyAction(user.id);
      }
    } catch (err) {
      console.error(`Failed to generate action for user ${user.id}:`, err);
      // Continue with next user — don't let one failure stop the batch
    }
  }
  
  return Response.json({ success: true });
}
```

Add `CRON_SECRET` to Vercel environment variables (any random string).

### 2.5.5 Action rotation logic

**In `lib/ai/action-generator.ts`** — add to the Claude prompt context:

When generating an action, query the last 7 days of the merchant's actions. Extract which channels were used. Build a "avoid these channels today" list. Include it in the Claude system prompt:

```
Recent channel history (do not repeat the same channel as the last action):
- Yesterday: instagram (post_content)
- 2 days ago: email (list_building)
- 3 days ago: reddit (community_outreach)

Today's focus should be on a different channel. Preferred today: [calculate based on weekly rotation schedule]
```

Weekly rotation preference to add:
```typescript
const WEEKLY_CHANNEL_PREFERENCE: Record<number, string> = {
  1: 'instagram', // Monday
  2: 'reddit',    // Tuesday
  3: 'email',     // Wednesday
  4: 'seo',       // Thursday
  5: 'influencer',// Friday
  6: 'optimize',  // Saturday
  0: 'planning',  // Sunday
};
const todayPreference = WEEKLY_CHANNEL_PREFERENCE[new Date().getDay()];
```

### Testing 2.5
- Set a test user's timezone to UTC
- Check that at 8:00 UTC, a new action is generated automatically
- Set another test user to `America/New_York` (UTC-5) — action should generate at 13:00 UTC
- Confirm no duplicate actions generated for same user on same day
- Check action rotation: if yesterday was instagram, today should not be instagram

---

## Testing Phase 2 (Full)

### Test 2.A — Results logging flow
1. Complete an action
2. Go to Action History
3. Click the completed action row
4. Fill in results and save
5. Reload page — results should still show in the row

### Test 2.B — Sales counter flow
1. Log 5 sales one at a time
2. Counter should update after each one
3. Progress bar should show 50% at 5/10
4. On 10th sale, growth unlock card should appear

### Test 2.C — Progress tracker accuracy
1. Complete 3 actions on 3 consecutive days
2. Progress tracker should show streak = 3
3. Don't complete an action one day
4. Next day, streak should show 1 (today) or 0 (if not completed today)

### Test 2.D — Growth unlock email
1. Log 10th sale
2. Check inbox at test email address
3. Email should arrive within 1 minute
4. Email should list Growth features

### Test 2.E — Cron job manual test
1. Call `GET /api/cron/daily-actions` directly with the CRON_SECRET header
2. Users without a today action should get one generated
3. Users with an existing today action should not get a duplicate

---

---

# PHASE 3 — Communications and Billing
**Priority: LAUNCH BLOCKER**
**Estimated time: 10–12 days**

---

## 3.1 Triggered Email Sequences

**What this step does:** Sets up all automatic emails triggered by merchant behavior. All emails are sent via **Nodemailer** using the existing `sendEmail()` function in `lib/email/sender.ts`. You do not need to install any new library — Nodemailer is already installed and configured.

### How the email system already works

The project has a layered email setup:

```
lib/email/sender.ts          ← Nodemailer transporter (do not modify)
lib/email/templates/         ← HTML template files (welcome.html, etc.)
lib/email/send-templates.ts  ← Functions that load templates and call sendEmail()
lib/email/triggers.ts        ← NEW: one function per event trigger (you will create this)
```

The `sendEmail()` function in `sender.ts` reads from these environment variables:
```
SMTP_HOST=smtp.zoho.com          (or any SMTP host)
SMTP_PORT=587
SMTP_USER=info@stormo.io
SMTP_PASS=your-password
SMTP_FROM=info@stormo.io
```

These must be set in Vercel. If any are missing, the sender logs a warning and skips the send without crashing.

### 3.1.1 Email trigger architecture

**Create new file: `lib/email/triggers.ts`**

This file imports from `lib/email/send-templates.ts` (which already exists) and adds the new trigger functions for engagement emails. Each function is called from the relevant API route when the triggering event occurs.

```typescript
// lib/email/triggers.ts
// Extends the existing send-templates.ts with engagement-specific triggers.
// All sending goes through the existing sendEmail() in sender.ts via Nodemailer.

import { sendEmail } from './sender';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Called from: app/api/onboarding/complete/route.ts
// When: after onboardingCompleted = true is set in DB
export async function triggerOnboardingComplete(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Your plan is ready. Here is your first action.',
    html: `<p>Hi ${name}, your personalized acquisition plan is ready. <a href="${baseUrl}/dashboard">Open your dashboard</a> to see your first daily action.</p>`,
  });
}

// Called from: app/api/actions/generate/route.ts
// When: first action ever generated for this user (check action count = 1)
export async function triggerFirstActionAssigned(email: string, name: string, actionTitle: string) {
  return sendEmail({
    to: email,
    subject: 'Your first action is ready.',
    html: `<p>Hi ${name}, your first Stormo action is: <strong>${actionTitle}</strong>. <a href="${baseUrl}/dashboard">View it on your dashboard.</a></p>`,
  });
}

// Called from: app/api/actions/[id]/complete/route.ts
// When: first action completed (check completed count = 1)
export async function triggerFirstActionCompleted(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Great start. Here is what to expect this week.',
    html: `<p>Hi ${name}, you completed your first action. Every action you take teaches Stormo what works for your store. Keep going. <a href="${baseUrl}/dashboard">See today's action.</a></p>`,
  });
}

// Called from: app/api/sales/route.ts
// When: totalSales just became 1 (first sale logged)
export async function triggerFirstSaleLogged(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Your first sale. Here is how to build on this.',
    html: `<p>Hi ${name}, you logged your first sale! That is proof your store works. You need 9 more to unlock the Growth plan. <a href="${baseUrl}/dashboard">Keep taking action.</a></p>`,
  });
}

// Called from: app/api/sales/route.ts
// When: totalSales just became 5
export async function triggerFiveSalesLogged(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Halfway to Growth. Here is what unlocks at 10 sales.',
    html: `<p>Hi ${name}, 5 sales logged — halfway to unlocking the Growth plan. At 10 sales you get paid advertising guidance, advanced influencer strategies, and deeper AI insights. <a href="${baseUrl}/dashboard">Keep going.</a></p>`,
  });
}

// Called from: app/api/sales/route.ts
// When: totalSales just became 10
export async function triggerGrowthUnlocked(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'You have reached 10 sales. The Growth plan is now unlocked.',
    html: `<p>Hi ${name}, you did it. 10 sales logged. The Growth plan is now available for you to upgrade. <a href="${baseUrl}/dashboard/settings">Upgrade to Growth — $39/month.</a></p>`,
  });
}

// Called from: app/api/cron/trial-reminders/route.ts
// When: trialEndsAt is 3 days from now
export async function triggerTrialEnding(email: string, name: string, daysLeft: number) {
  return sendEmail({
    to: email,
    subject: `Your $9 trial ends in ${daysLeft} days. Continue for $29/month.`,
    html: `<p>Hi ${name}, your Stormo trial ends in ${daysLeft} days. After that you will be billed $29/month to continue. <a href="${baseUrl}/dashboard/settings">Manage your subscription.</a></p>`,
  });
}

// Called from: app/api/cron/trial-reminders/route.ts
// When: 30 days after account created
export async function triggerMonthlyMilestone(email: string, name: string, daysAsMember: number) {
  return sendEmail({
    to: email,
    subject: 'Your monthly progress summary.',
    html: `<p>Hi ${name}, you have been a Stormo member for ${daysAsMember} days. <a href="${baseUrl}/dashboard">See your progress.</a></p>`,
  });
}

// Called from: app/api/cron/daily-actions/route.ts (inactive detection pass)
// When: no login for 3 days
export async function triggerInactiveDay3(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Your daily actions are waiting. Here is what is next.',
    html: `<p>Hi ${name}, your Stormo actions are ready. It only takes a few minutes to stay on track. <a href="${baseUrl}/dashboard">See your action.</a></p>`,
  });
}

// Called from: app/api/cron/daily-actions/route.ts (inactive detection pass)
// When: no login for 7 days
export async function triggerInactiveDay7(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'We noticed you have not been back. Here is a quick win action.',
    html: `<p>Hi ${name}, it has been a week. Here is an easy action to get back on track. <a href="${baseUrl}/dashboard">Open Stormo.</a></p>`,
  });
}

// Called from: app/api/cron/daily-actions/route.ts (inactive detection pass)
// When: no login for 14 days
export async function triggerInactiveDay14(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Final check-in. Are you still building your store?',
    html: `<p>Hi ${name}, this is our last check-in. Your plan and all your data are still here whenever you are ready. <a href="${baseUrl}/dashboard">Come back to Stormo.</a></p>`,
  });
}

// Called from: app/api/billing/cancel/route.ts
// When: merchant cancels, 7 days after cancellation
export async function triggerCancellationReEngagement(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Is there anything Stormo could improve?',
    html: `<p>Hi ${name}, we noticed you cancelled. We would love to know what we could have done better. Reply to this email with any feedback.</p>`,
  });
}
```

### 3.1.2 Where each trigger is called

| Trigger function | File to modify | Condition to check before calling |
|---------|----------------|--------------|
| `triggerOnboardingComplete` | `app/api/onboarding/complete/route.ts` | After `onboardingCompleted = true` is set |
| `triggerFirstActionAssigned` | `app/api/actions/generate/route.ts` | Query action count first — only call if this is count = 1 |
| `triggerFirstActionCompleted` | `app/api/actions/[id]/complete/route.ts` | Query completed count — only call if this is first completed action |
| `triggerFirstSaleLogged` | `app/api/sales/route.ts` | Only call if `totalSales` was 0 before this sale |
| `triggerFiveSalesLogged` | `app/api/sales/route.ts` | Only call if `totalSales` just became 5 |
| `triggerGrowthUnlocked` | `app/api/sales/route.ts` | Only call if `totalSales` just became 10 |
| `triggerTrialEnding` | `app/api/cron/trial-reminders/route.ts` | Only if not already sent (use flag in DB) |
| `triggerInactiveDay3/7/14` | `app/api/cron/daily-actions/route.ts` | Check `inactiveEmailStage` field in DB |
| `triggerCancellationReEngagement` | Scheduled 7 days after cancel via cron | Only send once per cancellation |

### 3.1.3 Inactive user detection (cron-based)

**Add to the daily cron job** (`app/api/cron/daily-actions/route.ts`) after the action generation pass:

```typescript
// After generating actions, run inactive detection:
const inactiveUsers = await db.select().from(users)
  .where(and(
    lt(users.lastLoginAt, new Date(Date.now() - 3 * 86400000)), // not logged in for 3+ days
    lt(users.inactiveEmailStage, 14) // hasn't received all inactive emails yet
  ));

for (const user of inactiveUsers) {
  const daysSinceLogin = Math.floor((Date.now() - user.lastLoginAt!.getTime()) / 86400000);
  
  if (daysSinceLogin >= 14 && user.inactiveEmailStage < 14) {
    await triggerInactiveDay14(user.email, user.name || 'there');
    await db.update(users).set({ inactiveEmailStage: 14 }).where(eq(users.id, user.id));
  } else if (daysSinceLogin >= 7 && user.inactiveEmailStage < 7) {
    await triggerInactiveDay7(user.email, user.name || 'there');
    await db.update(users).set({ inactiveEmailStage: 7 }).where(eq(users.id, user.id));
  } else if (daysSinceLogin >= 3 && user.inactiveEmailStage < 3) {
    await triggerInactiveDay3(user.email, user.name || 'there');
    await db.update(users).set({ inactiveEmailStage: 3 }).where(eq(users.id, user.id));
  }
}
```

**Add to `users` table in `lib/db/schema.ts`:**
```typescript
lastLoginAt: timestamp('last_login_at'),
inactiveEmailStage: integer('inactive_email_stage').default(0), // 0=none, 3=day3 sent, 7=day7 sent, 14=day14 sent
```

**Reset `inactiveEmailStage` to 0** whenever the user logs in (in the `jwt` callback in `auth.ts` or a separate login API). This ensures re-engagement emails start fresh if they come back and go inactive again.

### 3.1.4 Trial conversion emails (cron-based)

**Add to `vercel.json`:**
```json
{
  "path": "/api/cron/trial-reminders",
  "schedule": "0 9 * * *"
}
```

**File:** `app/api/cron/trial-reminders/route.ts`

Runs daily at 9am UTC. Finds all users with a `trialEndsAt` date and sends emails at the right moments:

```typescript
// Find users whose trial ends in exactly 15 days → mid-trial check-in
// Find users whose trial ends in exactly 3 days → "trial ending soon" email
// Find users whose trial ends in exactly 1 day → "trial ends tomorrow" email
// Find users who joined exactly 30 days ago → monthly milestone email
// Use a flag per email type to avoid sending the same email twice:

trialEmail15Sent: boolean('trial_email_15_sent').default(false),
trialEmail3Sent: boolean('trial_email_3_sent').default(false),
trialEmail1Sent: boolean('trial_email_1_sent').default(false),
```

Add these boolean columns to the `users` table in `lib/db/schema.ts`.

### Testing 3.1
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `.env.local` to your Zoho SMTP credentials
- Complete onboarding with a test account — `triggerOnboardingComplete` should fire and email arrives
- Complete the first action — `triggerFirstActionCompleted` fires, email arrives
- Log a sale — `triggerFirstSaleLogged` fires, email arrives
- Manually set `users.lastLoginAt` to 4 days ago in DB — run the daily cron — `triggerInactiveDay3` should fire
- Set `users.trialEndsAt` to 3 days from now — run trial-reminders cron — `triggerTrialEnding` fires

---

## 3.2 Stripe Plan Switching

**What this step does:** When a merchant clicks "Upgrade to Growth," Stripe handles the billing change and Growth features activate immediately. Merchants can also downgrade or cancel from settings.

### 3.2.1 Stripe webhook handler

**File:** `app/api/webhooks/stripe/route.ts` (create if doesn't exist)

Handle these Stripe events:
- `customer.subscription.updated` → update `users.subscriptionTier`, `users.subscriptionStatus`
- `customer.subscription.deleted` → set `subscriptionStatus = 'cancelled'`
- `invoice.payment_failed` → send payment failure email, start grace period
- `invoice.payment_succeeded` → confirm subscription is active

**Important:** Verify the webhook signature using `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`. Never process unverified webhooks.

### 3.2.2 Upgrade flow

**File:** `app/api/billing/upgrade/route.ts`

```json
POST /api/billing/upgrade
{ "targetTier": "growth" }
```

This:
1. Creates or retrieves Stripe customer for this user
2. Creates a new Stripe subscription for the Growth plan price
3. Returns a Stripe checkout session URL
4. Frontend redirects to Stripe checkout
5. After success, Stripe webhook fires → update user tier in DB

### 3.2.3 Downgrade flow

**File:** `app/api/billing/downgrade/route.ts`

```json
POST /api/billing/downgrade
```

This:
1. Updates the Stripe subscription to the Starter plan at next renewal period
2. Returns `{ "success": true, "effectiveDate": "2026-07-15" }`
3. User retains Growth access until `effectiveDate`
4. On the effective date, the Stripe webhook fires → update user tier

### 3.2.4 Cancellation flow

**File:** `app/api/billing/cancel/route.ts`

```json
POST /api/billing/cancel
```

This:
1. Schedules cancellation at end of current billing period via Stripe (`cancel_at_period_end: true`)
2. Returns `{ "success": true, "accessUntil": "2026-07-15" }`
3. User retains access until `accessUntil`
4. When period ends, Stripe webhook fires → set `subscriptionStatus = 'cancelled'`

**On cancellation:**
- Send cancellation confirmation email immediately
- Schedule a re-engagement email for 7 days later (use the cron job to check for cancelled users)
- Data retained 60 days before deletion

### 3.2.5 Settings page

**File:** `app/(dashboard)/settings/page.tsx` (create or modify)

Show:
- Current plan (Starter / Growth)
- Trial end date (if on trial)
- "Upgrade to Growth" button (if on Starter and `growthUnlocked = true`)
- "Downgrade to Starter" button (if on Growth)
- "Cancel Subscription" button
- "Already an experienced seller? Contact support to unlock Growth early." (link to email)

### Testing 3.2
- Test upgrade: click upgrade, complete Stripe checkout with test card `4242 4242 4242 4242` → user tier should become 'growth' in DB
- Test downgrade: downgrade from Growth → user retains access until period end, then tier changes
- Test cancellation: cancel → user retains access until period end → subscription status = 'cancelled'
- Test failed payment: use Stripe test card for declined payment → payment failure email sent
- Verify: NO plan changes happen without the merchant explicitly initiating them

---

## Testing Phase 3 (Full)

### Test 3.A — Email delivery
- Use a real email address for testing (not a fake one)
- Trigger each email by performing the action that causes it
- Verify email arrives, subject line is correct, content is readable

### Test 3.B — Stripe upgrade
- Use Stripe test mode
- Go through full upgrade flow
- Verify webhook fires and updates DB
- Verify Growth features appear on dashboard

### Test 3.C — Cancellation
- Cancel subscription
- Verify access continues until period end
- Verify no more charges
- Verify data still visible in dashboard

---

---

# PHASE 4 — Pre-Launch Engagement Features
**Priority: PRE-LAUNCH**
**Estimated time: 8–10 days**
**Build after Phase 2 and 3 are stable.**

---

## 4.1 In-App Banners

**What this step does:** Context-aware banners appear at the top of the dashboard based on the merchant's current state. They are dismissible but reappear if the condition is still true on the next visit.

### 4.1.1 Banner types and conditions

| Banner | Condition | Text |
|--------|-----------|------|
| First action complete | `completedCount === 1` | "You completed your first action! Great start. Here's what to do next." |
| First sale | `totalSales === 1` | "Your first sale is logged! Keep this momentum going." |
| Trial ending | `trialEndsAt - now < 3 days` | "Your $9 trial ends in X days. Continue for $29/month." |
| Growth available | `growthUnlocked && tier === 'starter'` | "You've reached 10 sales! Upgrade to Growth to unlock advanced features." |
| Log results reminder | Has action completed >48hrs ago with no results | "You have an action from 2 days ago — log your results to help your AI improve." |
| 8 sales achieved | `totalSales === 8` | "You're 2 sales away from unlocking Growth! Keep going." |

### 4.1.2 Implementation

**Create:** `components/dashboard/DashboardBanner.tsx`

- Fetches progress data from `GET /api/progress` (already built in 2.3)
- Evaluates which banner(s) to show based on the conditions above
- Shows max 1 banner at a time (prioritized by importance)
- Dismissible via an X button
- Dismissal stored in `localStorage` with a key and expiry (1 day)

**Add to:** `app/(dashboard)/dashboard/page.tsx` — above the daily action card.

### Testing 4.1
- Create test account with 0 completed actions → no banner
- Complete first action → first-action banner appears
- Log first sale → first-sale banner appears
- Dismiss banner → banner disappears → comes back next day (after localStorage expiry)

---

## 4.2 PWA Push Notifications

**What this step does:** Merchants who install Stormo as a PWA and grant notification permission receive push notifications for high-value events.

### 4.2.1 PWA setup

**File:** `public/manifest.json` — ensure this exists with proper app name, icons, and `display: "standalone"`.

**File:** `public/sw.js` — service worker that handles push event listening.

### 4.2.2 Notification permission request

**File:** `components/dashboard/NotificationPermissionBanner.tsx`

On the first dashboard visit after onboarding:
- Show: "Get notified when your daily action is ready each morning."
- "Enable Notifications" button (calls `Notification.requestPermission()`)
- "Maybe Later" dismisses for 7 days
- Only show if the browser supports push notifications
- On permission granted: subscribe to push, send subscription to `POST /api/notifications/subscribe`

### 4.2.3 Push notification triggers (max 2/day)

Add to `lib/notifications/push.ts`:

```typescript
export async function sendPushNotification(userId: string, title: string, body: string, url: string) {}
```

Triggers:
- Daily action ready (from the cron job)
- Approaching a sales milestone (8 sales: "You're 2 away from Growth!")
- Not logged in for 3 days (from the inactive detection cron)

### Testing 4.2
- Install app as PWA on phone
- Grant notification permission
- Trigger a notification via cron
- Verify notification appears on device

---

## 4.3 Weekly Summary

**What this step does:** Every Monday at 9am, each merchant receives a summary email and sees a summary card on the dashboard.

### 4.3.1 Cron job

**Add to `vercel.json`:**
```json
{
  "path": "/api/cron/weekly-summary",
  "schedule": "0 9 * * 1"
}
```

Runs every Monday at 9am UTC.

### 4.3.2 Weekly summary content

The summary email/card includes:
- Actions completed last week (count)
- Any results logged (highlights)
- Preview of this week (what channel focus is coming)
- Encouraging message based on streak and sales progress
- Reminder: "X sales logged, Y to go until Growth"

### 4.3.3 Dashboard summary card

**Create:** `components/dashboard/WeeklySummaryCard.tsx`

Shows on the dashboard Monday through Wednesday (auto-hides Thursday). Uses the same data as the email. Dismissible.

### Testing 4.3
- Run the weekly-summary cron manually
- Check inbox for weekly summary email
- Check dashboard Monday morning for summary card

---

## 4.4 AI Insight Alerts

**What this step does:** Once per week, Claude generates a personalized insight for each merchant based on their profile. It appears as a card on the dashboard and optionally triggers a push notification.

### 4.4.1 Insight generation

**Add to the weekly cron or create a separate cron:** `app/api/cron/insights/route.ts` (runs weekly, e.g. Wednesday)

For each active merchant:
1. Query their store profile and recent action history
2. Call Claude with a prompt asking for one insight (not a daily action — a strategic observation)
3. Store the insight in a new `insights` table

**New table:**
```typescript
export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  insightType: varchar('insight_type', { length: 100 }), // 'audience_segment', 'seasonal', 'channel_tip', etc.
  isRead: boolean('is_read').default(false),
  generatedAt: timestamp('generated_at').defaultNow(),
});
```

### 4.4.2 Insight card on dashboard

**Create:** `components/dashboard/InsightCard.tsx`

Fetches the latest unread insight. Shows a card with a lightbulb icon and the insight text. "Mark as Read" button dismisses it.

### Testing 4.4
- Run insights cron manually
- Dashboard should show an insight card for the test merchant
- Mark as read — card disappears
- Run cron again next week — new insight appears

---

## 4.5 Re-engagement Sequences

These are handled by the inactive user detection already described in 3.1.3. Confirm the full flow:

- Day 3 no login: email + push (if enabled)
- Day 7 no login: email + push
- Day 14 no login: final email
- Day 21+: no contact. Account stays active.
- Merchants are NEVER deleted or downgraded for inactivity.

---

---

# PHASE 5 — AI Learning System
**Priority: VERSION 2**
**START DATE: Only after Phase 2 is stable with 50+ active merchants actively logging results.**

This is not a launch requirement. Do not start this until the product has real merchant data.

---

## 5.1 Extended Data Collection Schema

**What this step does:** Expands the results logging into proper aggregation-ready tables.

### 5.1.1 Database tables

**Extend `action_results` table** (from Phase 2.1) or ensure it captures:
```typescript
// Add platform and action_type columns for aggregation:
platform: varchar('platform', { length: 100 }),       // 'instagram', 'tiktok', 'email', etc.
actionType: varchar('action_type', { length: 100 }),   // 'video', 'carousel', 'email_blast', etc.
clicksToStore: integer('clicks_to_store').default(0),
emailListAdditions: integer('email_list_additions').default(0),
```

**New table:**
```typescript
export const strategyPerformance = pgTable('strategy_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 100 }),
  actionType: varchar('action_type', { length: 100 }),
  avgEngagementRate: varchar('avg_engagement_rate', { length: 20 }),
  avgConversionRate: varchar('avg_conversion_rate', { length: 20 }),
  totalAttributedSales: integer('total_attributed_sales').default(0),
  actionCount: integer('action_count').default(0),
  lastUpdated: timestamp('last_updated').defaultNow(),
});
```

---

## 5.2 Nightly Aggregation Job

**File:** `app/api/cron/aggregate-performance/route.ts`

Runs nightly. For each user who has 20+ completed actions:
1. Query all `action_results` from the past 90 days
2. Group by `platform` and `action_type`
3. Calculate `avgEngagementRate = SUM(engagement) / SUM(reach)`
4. Calculate `avgConversionRate = SUM(sales_attributed) / SUM(reach)`
5. Upsert into `strategy_performance` table

**Only use this data in Claude prompts when:**
- User has `action_count >= 20` in `strategy_performance`
- The specific platform has been tried at least 3 times
- Data is from past 60 days (check `lastUpdated`)

---

## 5.3 Performance-Informed Action Generation

**File to modify:** `lib/ai/action-generator.ts`

Before calling Claude to generate a daily action:
1. Query `strategy_performance` for this user
2. Find top 2 platforms by `avgConversionRate`
3. Find any platform with very low performance to deprioritize
4. Build a performance summary string

**Without performance data (current behavior):**
```
Generate a daily acquisition action for:
- Store: [productType]
- Target customer: [targetCustomer]
- Capacity: [weeklyTimeAvailable]
- Goal: 10 sales
```

**With performance data (Phase 5 behavior):**
```
Generate a daily acquisition action for:
- Store: [productType]
- Target customer: [targetCustomer]
- Capacity: [weeklyTimeAvailable]
- Goal: 10 sales

Performance history (past 60 days, 45 actions logged):
- Instagram: 14% engagement rate, 2% conversion to sales — PRIORITIZE
- Email: 4% click-through, 3% conversion to sales — PRIORITIZE
- TikTok: 6% engagement rate, 0.5% conversion to sales — AVOID

Focus on Instagram or email today. Do not suggest TikTok.
```

---

## 5.4 Merchant Performance Dashboard

**Create:** `app/(dashboard)/dashboard/performance/page.tsx`

Shows each merchant their own data. Sections:
1. **Platform breakdown** — bar chart or stat cards: Instagram 14%, TikTok 6%, Email 4% CTR
2. **Action type comparison** — Videos vs. Carousels vs. Text posts
3. **Top 5 actions** — Your best performing actions by conversion rate
4. **Conversion funnel** — Reach → Engagement → Clicks → Sales
5. **30-day trend** — Is performance improving? (compare this month vs. last month)

Only show this page if the user has at least 20 completed actions with results logged. Otherwise show: "Complete more actions and log your results to unlock your performance dashboard."

---

## Testing Phase 5

### Test 5.1 — Aggregation job
- Create test data: 25 completed actions for one user across Instagram (15), Email (5), TikTok (5)
- Run aggregation cron
- Check `strategy_performance` table — should have 3 rows for that user

### Test 5.2 — Performance-informed prompt
- Ensure test user has `strategy_performance` data
- Generate a new action
- Check the Claude prompt sent (log it temporarily) — performance data should be included
- Verify the generated action is for Instagram or Email, not TikTok

### Test 5.3 — Performance dashboard
- Log results for 20+ actions
- Navigate to `/dashboard/performance`
- All stats should display correctly based on the logged results

---

---

# Summary: What to Build in Order

The table below is the definitive build order. Complete each item fully (including its tests) before moving to the next.

| # | Phase | Section | Feature | Priority |
|---|-------|---------|---------|---------|
| 1 | 1 | 1.1 | Environment setup (Anthropic API key, claude.ts) | LAUNCH BLOCKER |
| 2 | 1 | 1.2 | URL analysis backend (analyze-store-url route) | LAUNCH BLOCKER |
| 3 | 1 | 1.3 | URL analysis frontend (onboarding page loader + confirmation) | LAUNCH BLOCKER |
| 4 | 1 | 1.4 | Answer parsing backend (parse-answer route) | LAUNCH BLOCKER |
| 5 | 1 | 1.5 | Answer parsing frontend (skip logic in onboarding) | LAUNCH BLOCKER |
| 6 | 2 | 2.1 | Results logging (action_results table + API + expandable rows) | LAUNCH BLOCKER |
| 7 | 2 | 2.2 | Sales tracking (sales table + API + SalesCounter component) | LAUNCH BLOCKER |
| 8 | 2 | 2.3 | Progress tracker (API + ProgressTracker component) | LAUNCH BLOCKER |
| 9 | 2 | 2.4 | Growth unlock (growthUnlocked flag + card + email) | LAUNCH BLOCKER |
| 10 | 2 | 2.5 | Daily action scheduling (cron + timezone detection + rotation) | LAUNCH BLOCKER |
| 11 | 3 | 3.1 | Email sequences (all triggered emails + inactive detection cron) | LAUNCH BLOCKER |
| 12 | 3 | 3.2 | Stripe plan switching (upgrade, downgrade, cancel, webhooks) | LAUNCH BLOCKER |
| 13 | 4 | 4.1 | In-app banners (DashboardBanner component) | PRE-LAUNCH |
| 14 | 4 | 4.2 | PWA push notifications (service worker + permission banner) | PRE-LAUNCH |
| 15 | 4 | 4.3 | Weekly summary email + dashboard card | PRE-LAUNCH |
| 16 | 4 | 4.4 | AI insight alerts (insights table + InsightCard + cron) | PRE-LAUNCH |
| 17 | 4 | 4.5 | Re-engagement sequences (confirm full inactive email flow) | PRE-LAUNCH |
| 18 | 5 | 5.1 | Extended schema (strategy_performance table) | VERSION 2 |
| 19 | 5 | 5.2 | Nightly aggregation cron | VERSION 2 |
| 20 | 5 | 5.3 | Performance-informed action generation prompts | VERSION 2 |
| 21 | 5 | 5.4 | Merchant performance dashboard page | VERSION 2 |

---

# Global Rules (Apply to All Phases)

1. **Graceful degradation always.** If the Claude API, Stripe, or Zoho Mail is down, the product must continue working. Never let a third-party failure crash the user experience.
2. **No automatic billing changes.** Growth plan activates only when the merchant clicks upgrade and pays. Never change a subscription tier from code without Stripe webhook confirmation.
3. **No automatic account deletion.** Inactive merchants stay in the system with all data intact indefinitely.
4. **Self-reported sales only (V1).** No platform integrations. Sales are logged manually by the merchant.
5. **Max 2 push notifications per day per merchant.** Always check count before sending.
6. **Environment variables required:** `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — all email sending goes through Nodemailer via these vars. For Zoho Mail: `SMTP_HOST=smtp.zoho.com`, `SMTP_PORT=587`.
7. **Do not modify the core action generator prompt structure** until Phase 5 explicitly requires it.
8. **Always run Drizzle migrations** after any schema change. Test with `npx drizzle-kit push` in development before deploying.
