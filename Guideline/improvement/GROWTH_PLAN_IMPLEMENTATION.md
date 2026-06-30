# Stormo — Growth Plan Feature Implementation
**Prepared for:** Muhammad Ismaeel | Stormo.io | June 2026
**Purpose:** Complete implementation plan for all Growth-plan-exclusive features. Each step is detailed enough for an AI agent to build without ambiguity. No existing functionality is disturbed — all steps are additive.

---

## Starter vs Growth — Complete Feature Comparison

| Feature | Starter $29/mo | Growth $39/mo |
|---|:---:|:---:|
| Daily Action Plan | ✅ | ✅ |
| Organic Actions (Social, Email, Content, Influencer) | ✅ | ✅ |
| Results Logging & Tracking | ✅ | ✅ |
| Sales Counter & Progress Tracking | ✅ | ✅ |
| AI Learning from Results | ✅ | ✅ |
| Email Communication Sequences | ✅ | ✅ |
| Push Notifications | ✅ | ✅ |
| Performance Analytics Dashboard | ✅ | ✅ |
| My Content (weekly AI content generation) | ✅ | ✅ |
| Campaigns — Seasonal Planner | ✅ | ✅ |
| Outreach — Influencer CRM | ✅ | ✅ |
| Milestones & Achievements | ✅ | ✅ |
| Ask Stormo AI Chatbot | ✅ | ✅ |
| Growth Unlock at 10 Sales → Upgrade Option | Upgrade prompt | — |
| **Paid Ads Guidance (daily actions include paid_ads type)** | ❌ | ✅ |
| **Meta Ads Strategy & Setup** | ❌ | ✅ |
| **Google Ads Strategy & Setup** | ❌ | ✅ |
| **TikTok Ads Strategy & Setup** | ❌ | ✅ |
| **Ad Budget Optimization** | ❌ | ✅ |
| **Audience Targeting Recommendations** | ❌ | ✅ |
| **Campaign Performance Analytics (Paid Ads section)** | ❌ | ✅ |
| **Advanced Insights & Competitive Analysis** | ❌ | ✅ |

---

## Current Codebase State — What Exists Before You Start

Read this section in full before writing a single line of code.

**Schema (`lib/db/schema.ts`):**
- `users.subscriptionTier` — varchar, values: `'free'` | `'starter'` | `'growth'`
- `users.growthUnlocked` — boolean, true when 10 sales reached
- `strategyPerformance` table — exists with `platform`, `actionType`, `avgConversionRate`, `actionCount`
- `insights` table — exists with `userId`, `content`, `insightType`, `isRead`
- `actionResults` table — exists with `platform`, `actionType`, `salesAttributed`, `reach`, `engagement`
- No `adSpend` or `adResults` table — these will be added in step 6.9

**Action generator (`lib/ai/action-generator.ts`):**
- `paid_ads` is a valid `action_type` value in the JSON schema
- The generator does NOT currently check `subscriptionTier` — it may generate paid_ads actions for Starter users
- The weekly channel preference map currently has no paid_ads entry
- This must be fixed in step 6.2

**Dashboard layout (`app/(dashboard)/layout.tsx`):**
- `navItems` array drives the sidebar navigation
- `user.subscriptionTier` is available via `session?.user`
- No "Paid Ads" nav item exists yet

**No `/dashboard/ads` page exists** — this is a new page being built from scratch.

**Do NOT modify:**
- `lib/db/schema.ts` columns that already exist
- `lib/ai/action-generator.ts` function signature — only add internal logic
- Any existing page's JSX or routing
- The `navItems` array structure — only append to it

---

## Build Order

Complete each step fully before moving to the next. Steps 6.1 and 6.2 must be done first as all later steps depend on them.

| Step | Feature | Files Created / Modified |
|---|---|---|
| 6.1 | Plan gating utility + lock screen component | NEW: `lib/auth/require-plan.ts`, `components/dashboard/GrowthLockScreen.tsx` |
| 6.2 | Tier-aware action generator | MODIFY: `lib/ai/action-generator.ts` |
| 6.3 | Paid Ads Dashboard page skeleton | NEW: `app/(dashboard)/dashboard/ads/page.tsx` |
| 6.4 | Meta Ads Strategy & Setup | NEW: `app/api/ads/generate/route.ts`, extends 6.3 |
| 6.5 | Google Ads Strategy & Setup | extends `app/api/ads/generate/route.ts`, extends 6.3 |
| 6.6 | TikTok Ads Strategy & Setup | extends `app/api/ads/generate/route.ts`, extends 6.3 |
| 6.7 | Ad Budget Optimization | NEW: `app/api/ads/budget/route.ts`, extends 6.3 |
| 6.8 | Audience Targeting Recommendations | NEW: `app/api/ads/audience/route.ts`, extends 6.3 |
| 6.9 | Campaign Performance Analytics (Paid Ads section) | MODIFY: `app/(dashboard)/dashboard/performance/page.tsx` |
| 6.10 | Advanced Insights for Growth tier | MODIFY: `app/api/cron/insights/route.ts` |
| 6.11 | Sidebar nav item — Paid Ads | MODIFY: `app/(dashboard)/layout.tsx` |

---

---

# STEP 6.1 — Plan Gating Utility & Lock Screen Component

**What this step does:** Creates two reusable building blocks that every Growth-only page will use. Without this, the ads page would be accessible to anyone.

---

## 6.1.1 Server-side plan check helper

**Create new file:** `lib/auth/require-plan.ts`

This is a server-side helper imported by any API route or server component that should be restricted to Growth users.

```typescript
// lib/auth/require-plan.ts
// Server-side utility. Import in API routes and server components.

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type PlanCheckResult =
  | { allowed: true;  tier: string }
  | { allowed: false; tier: string; reason: 'not_growth' | 'unauthenticated' };

/**
 * Call from any API route or server component that requires the Growth plan.
 * Returns { allowed: true } when the user is on the growth tier.
 * Returns { allowed: false } with a reason otherwise.
 *
 * Usage in an API route:
 *   const check = await requireGrowthPlan();
 *   if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 });
 */
export async function requireGrowthPlan(): Promise<PlanCheckResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { allowed: false, tier: 'unauthenticated', reason: 'unauthenticated' };
  }

  // Re-query the DB so the tier is always fresh (not stale from a JWT)
  const [user] = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const tier = user?.subscriptionTier ?? 'free';
  if (tier === 'growth') {
    return { allowed: true, tier };
  }
  return { allowed: false, tier, reason: 'not_growth' };
}

/**
 * Client-side helper: returns true if the session tier is growth.
 * Use this in client components that already have the session object.
 * Example: const isGrowth = isGrowthTier(session?.user?.subscriptionTier);
 */
export function isGrowthTier(tier?: string | null): boolean {
  return tier === 'growth';
}
```

**Important constraints:**
- Always re-query the DB — do not trust `session.user.subscriptionTier` alone because JWT tokens cache the old value when a user upgrades
- Return `PlanCheckResult` union type, never throw
- Import `auth` from `@/auth` (the existing NextAuth v5 auth object)

---

## 6.1.2 Growth lock screen component

**Create new file:** `components/dashboard/GrowthLockScreen.tsx`

This is a client component rendered inside Growth-only pages when the user is on the Starter tier. It replaces the page content with an upgrade prompt.

```typescript
// components/dashboard/GrowthLockScreen.tsx
'use client';

import Link from 'next/link';
import { Lock, Zap, TrendingUp, Target, BarChart2, ArrowRight } from 'lucide-react';

interface GrowthLockScreenProps {
  featureName: string;   // e.g. "Paid Ads"
  featureList: string[]; // bullet points of what this feature includes
}

export default function GrowthLockScreen({ featureName, featureList }: GrowthLockScreenProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Orange accent bar */}
        <div className="h-1 bg-primary w-full" />

        <div className="p-8 text-center space-y-6">
          {/* Lock icon */}
          <div className="mx-auto h-16 w-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-xl font-black text-dark">{featureName} is a Growth Feature</h2>
            <p className="text-sm text-subtle leading-relaxed">
              Upgrade to the Growth plan to unlock paid advertising guidance, advanced analytics, and competitive insights.
            </p>
          </div>

          {/* Feature list */}
          <ul className="text-left space-y-2.5">
            {featureList.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-dark">
                <div className="h-5 w-5 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="h-3 w-3 text-primary" />
                </div>
                {item}
              </li>
            ))}
          </ul>

          {/* CTA buttons */}
          <div className="space-y-3 pt-2">
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-center gap-2 w-full bg-primary text-white rounded-xl py-3 px-6 text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Upgrade to Growth — $39/month
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-subtle">
              Already an experienced seller?{' '}
              <a
                href="mailto:info@stormo.io?subject=Early Growth Unlock Request"
                className="text-primary font-semibold hover:underline"
              >
                Contact support to unlock Growth early.
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Usage pattern** (used in every Growth-only page):
```typescript
// At the top of a Growth-only page component:
if (subscriptionTier !== 'growth') {
  return (
    <GrowthLockScreen
      featureName="Paid Ads"
      featureList={[
        'Meta Ads strategy and setup guides',
        'Google Ads strategy for your niche',
        'TikTok Ads for product-based stores',
        'AI budget allocation recommendations',
        'Audience targeting by demographic and interest',
      ]}
    />
  );
}
```

### Testing 6.1
- Create test account on Starter tier → navigate to `/dashboard/ads` → lock screen shown
- Log in with Growth account → lock screen NOT shown, full content shown
- API route test: call `POST /api/ads/generate` as Starter user → `403 { "error": "not_growth" }`
- API route test: call same as Growth user → `200` response

---

---

# STEP 6.2 — Tier-Aware Action Generator

**What this step does:** Prevents the action generator from suggesting paid_ads actions to Starter users. Also adds `paid_ads` to the weekly channel rotation for Growth users.

**File to modify:** `lib/ai/action-generator.ts`

**Current state of the file:**
- `generateDailyAction(userId, scheduledForDate?)` — two parameters
- `WEEKLY_CHANNEL_PREFERENCE` — has entries for days 0–6, none include `paid_ads`
- The LLM prompt includes `"action_type": "community|content|outreach|seo|paid_ads"` as valid options with no tier restriction

---

## 6.2.1 Add subscriptionTier parameter

Change the function signature to accept an optional `subscriptionTier`:

```typescript
export async function generateDailyAction(
  userId: string,
  scheduledForDate?: string,
  subscriptionTier: string = 'starter'
)
```

The default is `'starter'` so all existing callers continue to work without changes.

---

## 6.2.2 Add Growth-only channel preference

Add a second rotation map for Growth users directly below the existing `WEEKLY_CHANNEL_PREFERENCE` constant:

```typescript
// Paid ads added on Tuesday for Growth — replaces the Reddit slot that day
const GROWTH_CHANNEL_PREFERENCE: Record<number, string> = {
  1: 'instagram',   // Monday
  2: 'paid_ads',    // Tuesday  ← Growth gets paid_ads here
  3: 'email',       // Wednesday
  4: 'seo',         // Thursday
  5: 'influencer',  // Friday
  6: 'optimize',    // Saturday
  0: 'planning',    // Sunday
};
```

---

## 6.2.3 Select the correct preference map

Replace the current single-line preference lookup:

```typescript
// OLD:
const todayPreference = WEEKLY_CHANNEL_PREFERENCE[new Date().getDay()];

// NEW:
const preferenceMap = subscriptionTier === 'growth'
  ? GROWTH_CHANNEL_PREFERENCE
  : WEEKLY_CHANNEL_PREFERENCE;
const todayPreference = preferenceMap[new Date().getDay()];
```

---

## 6.2.4 Restrict action_type in the LLM prompt based on tier

Find the JSON schema instruction block inside the `prompt` string:

```
"action_type": "community|content|outreach|seo|paid_ads"
```

Replace it with a dynamic line:

```typescript
const allowedActionTypes = subscriptionTier === 'growth'
  ? 'community|content|outreach|seo|paid_ads'
  : 'community|content|outreach|seo';

// Then use allowedActionTypes in the prompt string:
// "action_type": "${allowedActionTypes}"
```

Use a template literal for the prompt string so `allowedActionTypes` is interpolated correctly.

---

## 6.2.5 Update all callers of generateDailyAction

Search the codebase for every call to `generateDailyAction`. There are two known locations:

**Location 1 — `app/api/actions/generate/route.ts`:**
```typescript
// Import the user's subscription tier from the session or from DB
const session = await auth();
const [user] = await db.select({ subscriptionTier: users.subscriptionTier })
  .from(users)
  .where(eq(users.id, session.user.id))
  .limit(1);

// Pass it to the generator
await generateDailyAction(userId, undefined, user?.subscriptionTier ?? 'starter');
```

**Location 2 — `app/api/cron/daily-actions/route.ts`:**
```typescript
// The cron already fetches eligible users. Each user object has subscriptionTier.
// Pass it when calling generateDailyAction:
await generateDailyAction(user.id, todayStr, user.subscriptionTier ?? 'starter');
```

### Testing 6.2
- Call `POST /api/actions/generate` as Starter user five times → none should have `action_type: "paid_ads"`
- Call same as Growth user five times → should occasionally produce `action_type: "paid_ads"` (especially on Tuesdays)
- Add `console.log('[action-generator] tier:', subscriptionTier, 'preference:', todayPreference)` temporarily to verify the correct map is selected

---

---

# STEP 6.3 — Paid Ads Dashboard Page Skeleton

**What this step does:** Creates the shell of the Paid Ads page at `/dashboard/ads`. This is the container that all ad-related features (6.4–6.8) will live inside.

**Create new file:** `app/(dashboard)/dashboard/ads/page.tsx`

This is a **client component** (`'use client'`). It uses the `useSession` hook to check the user's tier client-side (the lock screen check is fast since session data is already in memory).

---

## 6.3.1 Page structure

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import GrowthLockScreen from '@/components/dashboard/GrowthLockScreen';
import { Zap, TrendingUp, Search, Target, DollarSign, Users } from 'lucide-react';

type AdPlatform = 'meta' | 'google' | 'tiktok';

export default function PaidAdsPage() {
  const { data: session } = useSession();
  const subscriptionTier = session?.user?.subscriptionTier ?? 'starter';
  const [activePlatform, setActivePlatform] = useState<AdPlatform>('meta');

  // Plan gate — show lock screen for non-Growth users
  if (subscriptionTier !== 'growth') {
    return (
      <GrowthLockScreen
        featureName="Paid Ads"
        featureList={[
          'Meta Ads (Facebook & Instagram) strategy and setup',
          'Google Ads strategy tailored to your product niche',
          'TikTok Ads for product-based stores',
          'AI ad budget optimization across all platforms',
          'Audience targeting recommendations by interest and demographic',
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-dark">Paid Ads</h1>
        <p className="text-sm text-subtle mt-1">
          AI-powered paid advertising strategies tailored to your store.
        </p>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[
          { key: 'meta',   label: 'Meta Ads',    Icon: Zap },
          { key: 'google', label: 'Google Ads',  Icon: Search },
          { key: 'tiktok', label: 'TikTok Ads',  Icon: TrendingUp },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActivePlatform(key as AdPlatform)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activePlatform === key
                ? 'text-primary border-primary'
                : 'text-subtle border-transparent hover:text-dark'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content — each platform is its own section */}
      {activePlatform === 'meta'   && <MetaAdsSection />}
      {activePlatform === 'google' && <GoogleAdsSection />}
      {activePlatform === 'tiktok' && <TikTokAdsSection />}

      {/* Budget optimizer — always visible regardless of tab */}
      <BudgetOptimizerSection />

      {/* Audience targeting — always visible */}
      <AudienceTargetingSection />
    </div>
  );
}
```

The sub-components `MetaAdsSection`, `GoogleAdsSection`, `TikTokAdsSection`, `BudgetOptimizerSection`, and `AudienceTargetingSection` are defined in the same file below the page component. Each is implemented in steps 6.4–6.8.

---

---

# STEP 6.4 — Meta Ads Strategy & Setup

**What this step does:** The Meta Ads tab generates a complete AI-powered Meta advertising strategy including campaign objective, audience configuration, ad format recommendation, ad copy, and a step-by-step Business Manager setup guide.

---

## 6.4.1 API endpoint

**Create new file:** `app/api/ads/generate/route.ts`

This endpoint handles all three platforms (Meta, Google, TikTok) using a `platform` field in the request body.

**Request shape:**
```json
POST /api/ads/generate
{
  "platform": "meta" | "google" | "tiktok",
  "monthlyBudget": 200
}
```

**Response shape (success):**
```json
{
  "success": true,
  "platform": "meta",
  "strategy": {
    "campaignObjective": "Conversions",
    "audience": {
      "ageRange": "25-44",
      "gender": "Female",
      "interests": ["handmade goods", "Etsy", "sustainable fashion"],
      "behaviors": ["engaged shoppers", "small business owners"],
      "lookalike": "Upload your customer email list to build a 2% lookalike audience"
    },
    "adFormat": "Single Image + Carousel",
    "dailyBudget": "$6.67/day",
    "bidStrategy": "Lowest cost (let Meta optimize)",
    "adCopy": {
      "headline": "Handmade with love. Ships in 3 days.",
      "primaryText": "Every piece is made to order — just for you. Free shipping on orders over $50.",
      "cta": "Shop Now"
    },
    "setupSteps": [
      "Go to business.facebook.com and create a Business Manager account",
      "Add your Facebook Page and Instagram account under Business Settings",
      "Create a Meta Pixel: Events Manager → Connect Data Sources → Web → Meta Pixel",
      "Install the Pixel on your store: copy the base code and paste it into your store theme's <head>",
      "In Ads Manager, click Create → Conversions campaign → set pixel event to 'Purchase'",
      "Set audience using the targeting above",
      "Upload 3-5 product images (1080x1080px) with your ad copy",
      "Set daily budget to $6.67/day, schedule start date, publish"
    ],
    "expectedResults": "At $200/month expect 2,000–5,000 impressions/day, $1.50–$3.00 cost per click, 1–3 sales per week in the first month"
  }
}
```

**Implementation inside the route:**

```typescript
import { NextResponse } from 'next/server';
import { requireGrowthPlan } from '@/lib/auth/require-plan';
import { db } from '@/lib/db';
import { storeProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { getModel } from '@/lib/ai/model';

export async function POST(request: Request) {
  // 1. Plan gate
  const check = await requireGrowthPlan();
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason }, { status: 403 });
  }

  // 2. Parse body
  let body: { platform: string; monthlyBudget?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { platform, monthlyBudget = 200 } = body;
  const validPlatforms = ['meta', 'google', 'tiktok'];
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  // 3. Fetch store profile
  const session = await auth();
  const [profile] = await db
    .select()
    .from(storeProfiles)
    .where(eq(storeProfiles.userId, session!.user.id))
    .limit(1);

  const storeContext = profile
    ? `Product: ${profile.productType ?? 'unknown'}\nTarget customer: ${profile.targetCustomer ?? 'unknown'}\nNiche: ${profile.nicheSummary ?? 'unknown'}\nPrice range: ${profile.priceRange ?? 'unknown'}`
    : 'Store profile not available';

  // 4. Build platform-specific prompt
  const platformPrompts: Record<string, string> = {
    meta: buildMetaPrompt(storeContext, monthlyBudget),
    google: buildGooglePrompt(storeContext, monthlyBudget),
    tiktok: buildTikTokPrompt(storeContext, monthlyBudget),
  };

  // 5. Call Claude
  const model = getModel();
  const response = await model.invoke(platformPrompts[platform]);
  const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  // 6. Parse JSON response
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const strategy = JSON.parse(cleaned);
    return NextResponse.json({ success: true, platform, strategy });
  } catch {
    return NextResponse.json({ error: 'AI returned invalid response. Please try again.' }, { status: 500 });
  }
}
```

---

## 6.4.2 Meta Ads Claude prompt function

Add this function in the same file as the route:

```typescript
function buildMetaPrompt(storeContext: string, monthlyBudget: number): string {
  return `You are a paid advertising strategist helping a small store owner run their first Meta (Facebook + Instagram) ad campaign.

Store context:
${storeContext}

Monthly budget: $${monthlyBudget}

Generate a complete Meta Ads strategy for this store. Return ONLY valid JSON matching this exact structure:
{
  "campaignObjective": "string — Conversions, Traffic, or Awareness",
  "audience": {
    "ageRange": "string",
    "gender": "string",
    "interests": ["array of 3-5 relevant Facebook interest categories"],
    "behaviors": ["array of 2-3 relevant buyer behaviors"],
    "lookalike": "string — instructions for building a lookalike audience from their customer list"
  },
  "adFormat": "string — e.g. Single Image, Carousel, Video",
  "dailyBudget": "string — calculated from monthly budget",
  "bidStrategy": "string — one sentence",
  "adCopy": {
    "headline": "string — under 40 characters",
    "primaryText": "string — 1-2 sentences, direct and benefit-focused",
    "cta": "string — Shop Now / Learn More / Get Offer"
  },
  "setupSteps": ["array of 6-8 numbered step-by-step instructions to set up the campaign in Ads Manager"],
  "expectedResults": "string — realistic performance expectations for the first 30 days at this budget"
}

Rules:
- Be specific to this store's product type and target customer
- Setup steps must be executable by a non-technical store owner
- Ad copy must be ready to use, not a template with placeholders
- Return ONLY the JSON object, no markdown, no explanation`;
}
```

---

## 6.4.3 MetaAdsSection component (inside ads/page.tsx)

```typescript
function MetaAdsSection() {
  const [strategy, setStrategy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [budget, setBudget] = useState(200);
  const [error, setError] = useState('');

  const generate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'meta', monthlyBudget: budget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setStrategy(data.strategy);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget input + generate button */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-black text-dark mb-1">Meta Ads Strategy</h2>
        <p className="text-sm text-subtle mb-4">
          AI generates your Meta (Facebook + Instagram) campaign strategy, ad copy, and step-by-step setup guide.
        </p>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-dark block mb-1.5">Monthly Ad Budget (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle text-sm">$</span>
              <input
                type="number"
                min={50}
                max={10000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <button
            onClick={generate}
            disabled={isLoading}
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : 'Generate My Strategy'}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      </div>

      {/* Strategy output — only shown after generation */}
      {strategy && <AdStrategyDisplay strategy={strategy} platform="Meta" />}
    </div>
  );
}
```

---

## 6.4.4 Reusable AdStrategyDisplay component

This is used by all three platform sections. Define it once in the same file:

```typescript
function AdStrategyDisplay({ strategy, platform }: { strategy: any; platform: string }) {
  const [copiedSection, setCopiedSection] = useState('');

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Campaign Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-black text-dark mb-4 uppercase tracking-wider">{platform} Campaign Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Objective',     value: strategy.campaignObjective },
            { label: 'Ad Format',     value: strategy.adFormat },
            { label: 'Daily Budget',  value: strategy.dailyBudget },
            { label: 'Bid Strategy',  value: strategy.bidStrategy },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <p className="text-xs text-subtle">{label}</p>
              <p className="text-sm font-semibold text-dark">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Audience */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-black text-dark mb-4 uppercase tracking-wider">Target Audience</h3>
        <div className="space-y-3 text-sm">
          <div><span className="text-subtle">Age:</span> <span className="font-semibold text-dark ml-2">{strategy.audience?.ageRange}</span></div>
          <div><span className="text-subtle">Gender:</span> <span className="font-semibold text-dark ml-2">{strategy.audience?.gender}</span></div>
          <div>
            <span className="text-subtle block mb-1.5">Interests:</span>
            <div className="flex flex-wrap gap-2">
              {strategy.audience?.interests?.map((i: string) => (
                <span key={i} className="px-2.5 py-1 bg-orange-50 text-primary text-xs font-semibold rounded-full border border-orange-100">{i}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-subtle block mb-1.5">Behaviors:</span>
            <div className="flex flex-wrap gap-2">
              {strategy.audience?.behaviors?.map((b: string) => (
                <span key={b} className="px-2.5 py-1 bg-gray-50 text-dark text-xs font-semibold rounded-full border border-gray-100">{b}</span>
              ))}
            </div>
          </div>
          {strategy.audience?.lookalike && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
              <strong>Lookalike Audience:</strong> {strategy.audience.lookalike}
            </div>
          )}
        </div>
      </div>

      {/* Ad Copy */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-dark uppercase tracking-wider">Ready-to-Use Ad Copy</h3>
          <button
            onClick={() => copyText(
              `Headline: ${strategy.adCopy?.headline}\n\n${strategy.adCopy?.primaryText}\n\nCTA: ${strategy.adCopy?.cta}`,
              'copy'
            )}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {copiedSection === 'copy' ? '✓ Copied!' : 'Copy All'}
          </button>
        </div>
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-black text-subtle uppercase tracking-wider">Headline</p>
            <p className="text-sm font-bold text-dark">{strategy.adCopy?.headline}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-black text-subtle uppercase tracking-wider">Primary Text</p>
            <p className="text-sm text-dark">{strategy.adCopy?.primaryText}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-black text-subtle uppercase tracking-wider">Call to Action</p>
            <p className="text-sm font-bold text-primary">{strategy.adCopy?.cta}</p>
          </div>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-black text-dark mb-4 uppercase tracking-wider">Step-by-Step Setup Guide</h3>
        <ol className="space-y-3">
          {strategy.setupSteps?.map((step: string, i: number) => (
            <li key={i} className="flex items-start gap-3 text-sm text-dark">
              <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Expected Results */}
      {strategy.expectedResults && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-1.5">Expected Results (First 30 Days)</p>
          <p className="text-sm text-emerald-800 leading-relaxed">{strategy.expectedResults}</p>
        </div>
      )}
    </div>
  );
}
```

### Testing 6.4
- Log in as Growth user, open `/dashboard/ads`
- Enter budget $200, click Generate My Strategy
- Strategy card appears with audience, ad copy, setup steps
- Copy All button → clipboard contains formatted ad copy
- Log in as Starter user → lock screen shown, not the strategy page

---

---

# STEP 6.5 — Google Ads Strategy & Setup

**What this step does:** Adds Google Ads strategy generation. Uses the same `POST /api/ads/generate` endpoint created in 6.4 — only the prompt function is different.

---

## 6.5.1 Add Google Ads prompt function to `app/api/ads/generate/route.ts`

```typescript
function buildGooglePrompt(storeContext: string, monthlyBudget: number): string {
  return `You are a paid advertising strategist helping a small store owner run Google Shopping and Search ads.

Store context:
${storeContext}

Monthly budget: $${monthlyBudget}

Generate a complete Google Ads strategy for this store. Return ONLY valid JSON matching this exact structure:
{
  "campaignObjective": "string — Shopping, Search, or Performance Max",
  "keywords": {
    "exact": ["array of 5-8 high-intent exact match keywords"],
    "phrase": ["array of 3-5 phrase match keywords"],
    "negative": ["array of 3-5 negative keywords to exclude irrelevant traffic"]
  },
  "adFormat": "string",
  "dailyBudget": "string — calculated from monthly budget",
  "bidStrategy": "string — Target ROAS or Maximize Conversions",
  "adCopy": {
    "headline1": "string — under 30 characters",
    "headline2": "string — under 30 characters",
    "headline3": "string — under 30 characters",
    "description1": "string — under 90 characters",
    "description2": "string — under 90 characters",
    "displayUrl": "string — e.g. yourstore.com/handmade-bags"
  },
  "setupSteps": ["array of 6-8 step-by-step instructions to set up in Google Ads"],
  "expectedResults": "string — realistic expectations for the first 30 days"
}

Rules:
- Keywords must be specific to the store's products, not generic
- Negative keywords must prevent wasted spend on unrelated searches
- Setup steps must be executable by a non-technical store owner
- For budgets under $200/month, recommend Smart Shopping or Performance Max
- Return ONLY the JSON object`;
}
```

---

## 6.5.2 GoogleAdsSection component (inside ads/page.tsx)

Identical structure to `MetaAdsSection` but uses `platform: 'google'`:

```typescript
function GoogleAdsSection() {
  const [strategy, setStrategy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [budget, setBudget] = useState(200);
  const [error, setError] = useState('');

  const generate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'google', monthlyBudget: budget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setStrategy(data.strategy);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-black text-dark mb-1">Google Ads Strategy</h2>
        <p className="text-sm text-subtle mb-4">
          AI generates your Google Shopping or Search campaign with keywords, ad copy, and setup guide.
        </p>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-dark block mb-1.5">Monthly Ad Budget (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle text-sm">$</span>
              <input
                type="number"
                min={50}
                max={10000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <button
            onClick={generate}
            disabled={isLoading}
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : 'Generate My Strategy'}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      </div>

      {strategy && <AdStrategyDisplay strategy={strategy} platform="Google" />}
    </div>
  );
}
```

**Note:** The `AdStrategyDisplay` component already renders `setupSteps`, `adCopy`, and `expectedResults`. For Google Ads the `adCopy` shape has headline1/headline2/headline3 instead of headline/primaryText — update `AdStrategyDisplay` to handle both shapes:

Inside `AdStrategyDisplay`, replace the Ad Copy section with:
```typescript
// Detect Google vs Meta copy shape
const isGoogle = 'headline1' in (strategy.adCopy ?? {});
const copyLines = isGoogle
  ? [
      { label: 'Headline 1', value: strategy.adCopy.headline1 },
      { label: 'Headline 2', value: strategy.adCopy.headline2 },
      { label: 'Headline 3', value: strategy.adCopy.headline3 },
      { label: 'Description 1', value: strategy.adCopy.description1 },
      { label: 'Description 2', value: strategy.adCopy.description2 },
      { label: 'Display URL', value: strategy.adCopy.displayUrl },
    ]
  : [
      { label: 'Headline', value: strategy.adCopy?.headline },
      { label: 'Primary Text', value: strategy.adCopy?.primaryText },
      { label: 'Call to Action', value: strategy.adCopy?.cta },
    ];
```

Render `copyLines` as a loop instead of three hardcoded divs.

Also add a "Keywords" section to `AdStrategyDisplay` that only renders when `strategy.keywords` exists:
```typescript
{strategy.keywords && (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <h3 className="text-sm font-black text-dark mb-4 uppercase tracking-wider">Keywords</h3>
    <div className="space-y-3">
      {[
        { label: 'Exact Match', items: strategy.keywords.exact, color: 'orange' },
        { label: 'Phrase Match', items: strategy.keywords.phrase, color: 'blue' },
        { label: 'Negative Keywords', items: strategy.keywords.negative, color: 'red' },
      ].map(({ label, items, color }) => (
        <div key={label}>
          <p className="text-xs text-subtle mb-1.5">{label}</p>
          <div className="flex flex-wrap gap-2">
            {items?.map((k: string) => (
              <span key={k} className={`px-2.5 py-1 text-xs font-semibold rounded-full border
                ${color === 'orange' ? 'bg-orange-50 text-primary border-orange-100' : ''}
                ${color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                ${color === 'red' ? 'bg-red-50 text-red-700 border-red-100 line-through' : ''}
              `}>{k}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

---

# STEP 6.6 — TikTok Ads Strategy & Setup

Same pattern as 6.5. Add prompt function and section component.

---

## 6.6.1 Add TikTok Ads prompt function to `app/api/ads/generate/route.ts`

```typescript
function buildTikTokPrompt(storeContext: string, monthlyBudget: number): string {
  return `You are a paid advertising strategist helping a small store owner run TikTok ad campaigns.

Store context:
${storeContext}

Monthly budget: $${monthlyBudget}

Generate a complete TikTok Ads strategy. Return ONLY valid JSON matching this exact structure:
{
  "campaignObjective": "string — Product Sales, Traffic, or Conversions",
  "audience": {
    "ageRange": "string",
    "gender": "string",
    "interests": ["array of 3-5 TikTok interest categories"],
    "behaviors": ["array of 2-3 behavioral targeting options on TikTok"]
  },
  "adFormat": "string — Spark Ads, In-Feed Ads, or TopView",
  "dailyBudget": "string",
  "videoCreativeGuidance": "string — 2-3 sentences on what kind of video to film for this product",
  "hooks": ["array of 3 video opening hooks (first 3 seconds) proven to stop scrollers"],
  "caption": "string — ready-to-use TikTok caption with 3-5 hashtags",
  "setupSteps": ["array of 6-8 step-by-step instructions to set up in TikTok Ads Manager"],
  "expectedResults": "string — realistic expectations for first 30 days"
}

Rules:
- TikTok hooks must be conversational and scroll-stopping, not corporate
- Video creative guidance must be specific to this product type
- For budgets under $150/month, recommend Spark Ads using existing organic content
- Return ONLY the JSON object`;
}
```

---

## 6.6.2 TikTokAdsSection component

Same structure as `GoogleAdsSection`. Key differences:
- `platform: 'tiktok'` in the fetch body
- `<AdStrategyDisplay>` will automatically render `videoCreativeGuidance`, `hooks`, and `caption` — update `AdStrategyDisplay` to handle these TikTok-specific fields:

```typescript
// Inside AdStrategyDisplay, add after the Audience section:
{strategy.videoCreativeGuidance && (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <h3 className="text-sm font-black text-dark mb-4 uppercase tracking-wider">Video Creative Guidance</h3>
    <p className="text-sm text-dark leading-relaxed">{strategy.videoCreativeGuidance}</p>
    {strategy.hooks && (
      <div className="mt-4 space-y-2">
        <p className="text-xs font-black text-subtle uppercase tracking-wider">Opening Hooks (first 3 seconds)</p>
        {strategy.hooks.map((hook: string, i: number) => (
          <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-dark">
            "{hook}"
          </div>
        ))}
      </div>
    )}
    {strategy.caption && (
      <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
        <p className="text-[10px] font-black text-subtle uppercase tracking-wider mb-1.5">Ready-to-Use Caption</p>
        <p className="text-sm text-dark">{strategy.caption}</p>
      </div>
    )}
  </div>
)}
```

---

---

# STEP 6.7 — Ad Budget Optimization

**What this step does:** Merchant enters their total monthly ad budget → AI allocates it across platforms and provides a prioritized spend plan.

---

## 6.7.1 API endpoint

**Create new file:** `app/api/ads/budget/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { requireGrowthPlan } from '@/lib/auth/require-plan';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storeProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getModel } from '@/lib/ai/model';

export async function POST(request: Request) {
  const check = await requireGrowthPlan();
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 });

  const { monthlyBudget } = await request.json();
  if (!monthlyBudget || monthlyBudget < 50) {
    return NextResponse.json({ error: 'Minimum budget is $50/month' }, { status: 400 });
  }

  const session = await auth();
  const [profile] = await db.select().from(storeProfiles).where(eq(storeProfiles.userId, session!.user.id)).limit(1);
  const storeContext = profile
    ? `Product: ${profile.productType}\nTarget: ${profile.targetCustomer}\nNiche: ${profile.nicheSummary}`
    : 'General store';

  const prompt = `You are an ad budget strategist. A store owner has $${monthlyBudget}/month to spend on paid ads.

Store context:
${storeContext}

Allocate their budget across Meta Ads, Google Ads, and TikTok Ads. Return ONLY valid JSON:
{
  "totalBudget": ${monthlyBudget},
  "allocation": [
    { "platform": "Meta Ads", "amount": number, "percentage": number, "rationale": "string — one sentence" },
    { "platform": "Google Ads", "amount": number, "percentage": number, "rationale": "string — one sentence" },
    { "platform": "TikTok Ads", "amount": number, "percentage": number, "rationale": "string — one sentence" }
  ],
  "strategy": "string — 2-3 sentence overall strategy recommendation",
  "warningIfBudgetLow": "string or null — if budget is under $150, warn about minimum viable spend on any single platform"
}

Rules:
- Amounts must sum exactly to ${monthlyBudget}
- For budgets under $150: allocate 100% to Meta Ads — it has the lowest minimum effective budget
- For $150-$300: Meta 70%, Google 30%, TikTok 0%
- For $300-$500: Meta 50%, Google 30%, TikTok 20%
- For $500+: distribute based on store's product type and target customer
- Return ONLY the JSON object`;

  const model = getModel();
  const response = await model.invoke(prompt);
  const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return NextResponse.json({ success: true, ...JSON.parse(cleaned) });
  } catch {
    return NextResponse.json({ error: 'AI returned invalid response' }, { status: 500 });
  }
}
```

---

## 6.7.2 BudgetOptimizerSection component (inside ads/page.tsx)

```typescript
function BudgetOptimizerSection() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [budget, setBudget] = useState(300);
  const [error, setError] = useState('');

  const optimize = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ads/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyBudget: budget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-black text-dark mb-1">Ad Budget Optimizer</h2>
      <p className="text-sm text-subtle mb-4">Enter your total monthly ad budget and get an AI-recommended split across all platforms.</p>
      <div className="flex items-end gap-4 mb-4">
        <div className="flex-1">
          <label className="text-xs font-semibold text-dark block mb-1.5">Total Monthly Budget (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle text-sm">$</span>
            <input
              type="number"
              min={50}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <button
          onClick={optimize}
          disabled={isLoading}
          className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {isLoading ? 'Calculating...' : 'Optimize Budget'}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {result && (
        <div className="space-y-4">
          {result.warningIfBudgetLow && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
              ⚠️ {result.warningIfBudgetLow}
            </div>
          )}
          <div className="space-y-3">
            {result.allocation?.map((item: any) => (
              <div key={item.platform} className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-dark">{item.platform}</span>
                    <span className="text-sm font-black text-primary">${item.amount}/mo</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-primary rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-subtle mt-1">{item.rationale}</p>
                </div>
              </div>
            ))}
          </div>
          {result.strategy && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-dark leading-relaxed">
              {result.strategy}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

---

# STEP 6.8 — Audience Targeting Recommendations

**What this step does:** Generates 3 distinct customer segments the merchant can use for targeting on any ad platform.

---

## 6.8.1 API endpoint

**Create new file:** `app/api/ads/audience/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { requireGrowthPlan } from '@/lib/auth/require-plan';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storeProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getModel } from '@/lib/ai/model';

export async function GET() {
  const check = await requireGrowthPlan();
  if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 });

  const session = await auth();
  const [profile] = await db.select().from(storeProfiles).where(eq(storeProfiles.userId, session!.user.id)).limit(1);

  const storeContext = profile
    ? `Product: ${profile.productType}\nTarget: ${profile.targetCustomer}\nNiche: ${profile.nicheSummary}\nPrice: ${profile.priceRange}`
    : 'General store';

  const prompt = `You are an audience strategist for a small store owner.

Store context:
${storeContext}

Generate 3 distinct audience segments for paid advertising. Return ONLY valid JSON:
{
  "segments": [
    {
      "name": "string — short descriptive name e.g. 'Gift Buyers'",
      "size": "string — estimated monthly reach e.g. '500K–1.5M'",
      "demographics": "string — age, gender, income",
      "interests": ["array of 4-6 targeting interests"],
      "behaviors": ["array of 2-3 behaviors"],
      "platform": "string — which platform this segment works best on",
      "adAngle": "string — one sentence on how to position the ad for this segment"
    }
  ]
}

Rules:
- Each segment must be meaningfully different (not just variations of the same audience)
- Segment 1: Core buyer — most likely to purchase
- Segment 2: Gift buyer — purchasing for others
- Segment 3: Lookalike — similar to existing buyers but untapped
- Return ONLY the JSON object`;

  const model = getModel();
  const response = await model.invoke(prompt);
  const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return NextResponse.json({ success: true, ...JSON.parse(cleaned) });
  } catch {
    return NextResponse.json({ error: 'AI returned invalid response' }, { status: 500 });
  }
}
```

---

## 6.8.2 AudienceTargetingSection component (inside ads/page.tsx)

```typescript
function AudienceTargetingSection() {
  const [segments, setSegments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ads/audience');
      const data = await res.json();
      if (data.segments) { setSegments(data.segments); setLoaded(true); }
    } catch {}
    finally { setIsLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-black text-dark mb-0.5">Audience Targeting Recommendations</h2>
          <p className="text-sm text-subtle">3 AI-defined audience segments tailored to your store.</p>
        </div>
        {!loaded && (
          <button
            onClick={load}
            disabled={isLoading}
            className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Loading...' : 'Generate Segments'}
          </button>
        )}
      </div>
      {loaded && (
        <div className="grid gap-4 md:grid-cols-3">
          {segments.map((seg: any, i: number) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-wider">{seg.name}</p>
                <p className="text-xs text-subtle mt-0.5">Est. reach: {seg.size}</p>
              </div>
              <p className="text-xs text-dark">{seg.demographics}</p>
              <div>
                <p className="text-[10px] text-subtle mb-1">Interests</p>
                <div className="flex flex-wrap gap-1">
                  {seg.interests?.map((i: string) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-[10px] font-semibold rounded-full text-dark">{i}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-orange-100 rounded-lg p-2.5">
                <p className="text-[10px] font-black text-primary uppercase mb-0.5">Best Platform</p>
                <p className="text-xs font-semibold text-dark">{seg.platform}</p>
              </div>
              <p className="text-xs text-subtle italic">"{seg.adAngle}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Testing 6.7 + 6.8
- Budget optimizer: enter $100 → should allocate 100% to Meta with low-budget warning
- Budget optimizer: enter $400 → Meta 70%, Google 30%, TikTok 0%
- Budget optimizer: enter $600 → three-way split
- Audience segments: click Generate → 3 distinct segment cards appear with demographics and interests

---

---

# STEP 6.9 — Campaign Performance Analytics (Paid Ads Section)

**What this step does:** Extends the existing Performance Dashboard with a "Paid Ads" section visible only to Growth users. Shows aggregated paid_ads action results vs organic action results.

**File to modify:** `app/(dashboard)/dashboard/performance/page.tsx`

---

## 6.9.1 Fetch paid_ads performance data

In the existing performance page's data fetch, add a separate query for `actionType = 'paid_ads'`:

```typescript
// Add to the existing data fetch (wherever you call GET /api/performance or read from DB):
// Separate the results by actionType to get paid vs organic split

// Query: actionResults WHERE actionType = 'paid_ads'
// vs actionResults WHERE actionType != 'paid_ads'
```

Add this to `app/api/performance/route.ts` (or wherever the performance API lives):

```typescript
// Paid ads vs organic split
const paidResults = await db
  .select({
    reach:           sum(actionResults.reach),
    engagement:      sum(actionResults.engagement),
    salesAttributed: sum(actionResults.salesAttributed),
    clicksToStore:   sum(actionResults.clicksToStore),
    count:           sql<number>`count(*)`,
  })
  .from(actionResults)
  .where(and(
    eq(actionResults.userId, userId),
    eq(actionResults.actionType, 'paid_ads')
  ));

const organicResults = await db
  .select({
    reach:           sum(actionResults.reach),
    engagement:      sum(actionResults.engagement),
    salesAttributed: sum(actionResults.salesAttributed),
    clicksToStore:   sum(actionResults.clicksToStore),
    count:           sql<number>`count(*)`,
  })
  .from(actionResults)
  .where(and(
    eq(actionResults.userId, userId),
    sql`${actionResults.actionType} != 'paid_ads'`
  ));
```

Return both `paidResults` and `organicResults` in the API response.

---

## 6.9.2 Paid Ads section in the performance page

In `app/(dashboard)/dashboard/performance/page.tsx`, after the existing funnel/trend sections, add a Growth-gated section:

```typescript
{subscriptionTier === 'growth' && (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="h-1 bg-primary w-full" />
    <div className="px-6 py-4 border-b border-gray-100">
      <p className="text-xs font-black text-dark uppercase tracking-wider">Paid Ads vs Organic — Performance Split</p>
    </div>
    <div className="p-6">
      {paidActionsCount === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-subtle">No paid ad results logged yet.</p>
          <p className="text-xs text-subtle mt-1">
            Complete paid ads actions and log results to see how they compare to your organic efforts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Paid Ads column */}
          <div className="space-y-3">
            <p className="text-xs font-black text-primary uppercase tracking-wider">Paid Ads</p>
            {[
              { label: 'Total Reach', value: paidData.reach ?? 0 },
              { label: 'Engagement', value: paidData.engagement ?? 0 },
              { label: 'Sales Attributed', value: paidData.salesAttributed ?? 0 },
              { label: 'Clicks to Store', value: paidData.clicksToStore ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-subtle">{label}</span>
                <span className="font-bold text-dark">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
          {/* Organic column */}
          <div className="space-y-3">
            <p className="text-xs font-black text-subtle uppercase tracking-wider">Organic</p>
            {[
              { label: 'Total Reach', value: organicData.reach ?? 0 },
              { label: 'Engagement', value: organicData.engagement ?? 0 },
              { label: 'Sales Attributed', value: organicData.salesAttributed ?? 0 },
              { label: 'Clicks to Store', value: organicData.clicksToStore ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-subtle">{label}</span>
                <span className="font-bold text-dark">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}
```

**How to get `subscriptionTier` in the performance page:**
```typescript
// At the top of the performance page component:
const { data: session } = useSession();
const subscriptionTier = session?.user?.subscriptionTier ?? 'starter';
```

### Testing 6.9
- Log results for a `paid_ads` action (first generate one as a Growth user)
- Open Performance → Paid Ads section shows the logged results
- As Starter user → paid ads section not rendered, no empty space
- As Growth user with 0 paid ads logged → "No paid ad results yet" message shown

---

---

# STEP 6.10 — Advanced Insights for Growth Tier

**What this step does:** Modifies the weekly insights cron to generate deeper competitive/market-positioning insights for Growth users, vs basic tactical tips for Starter users.

**File to modify:** `app/api/cron/insights/route.ts`

---

## 6.10.1 Add tier to the insights generation loop

The cron currently iterates over all active users and generates an insight for each. Modify it to:

1. Select the user's `subscriptionTier` when fetching users
2. Pass the tier to the insight generation function
3. Use a different prompt based on tier

```typescript
// In the insights cron, when fetching users:
const activeUsers = await db
  .select({
    id: users.id,
    subscriptionTier: users.subscriptionTier,
    // ... other fields already selected
  })
  .from(users)
  .where(/* existing conditions */);

// When calling the insight generator for each user:
for (const user of activeUsers) {
  await generateInsightForUser(user.id, user.subscriptionTier ?? 'starter');
}
```

---

## 6.10.2 Add tier-differentiated prompts to insight generator

Inside the cron (or in a helper function it calls), replace the single prompt with a tiered prompt:

```typescript
function buildInsightPrompt(storeContext: string, recentHistory: string, tier: string): string {
  const tierInstructions = tier === 'growth'
    ? `You are generating a GROWTH-tier insight: deeper, strategic, competitive intelligence.
Focus on ONE of these advanced insight types:
- Competitive gap: an underserved niche positioning angle competitors are missing
- Paid ads creative trend: what ad formats/angles are working in this category right now
- Market expansion: an adjacent customer segment the merchant has not targeted
- Pricing insight: how the merchant could reposition pricing vs competitors for better conversion
- Platform-specific algorithm insight: what's currently rewarded on a specific platform for this niche
This merchant is investing in paid ads and wants strategic intelligence, not basic tips.`
    : `You are generating a STARTER-tier insight: practical, actionable, organic-focused.
Focus on ONE of these insight types:
- Content trend: a specific trending topic or hashtag to use this week
- Community opportunity: a Reddit or Facebook group to engage in
- Seasonal: an upcoming event in the next 14 days relevant to their niche
- Quick win: a low-effort action that typically produces engagement for this product type`;

  return `${tierInstructions}

Store context:
${storeContext}

Recent action history:
${recentHistory}

Generate one insight. Return ONLY valid JSON:
{
  "content": "string — the insight itself, 2-4 sentences, specific and actionable",
  "insightType": "string — one of: competitor_gap | paid_ads_trend | market_expansion | pricing_insight | platform_algorithm | content_trend | community_opportunity | seasonal | quick_win",
  "headline": "string — under 60 characters, the insight title shown in the dashboard card"
}

Return ONLY the JSON object.`;
}
```

---

## 6.10.3 Add `headline` column to insights table

The current `insights` table has `content` and `insightType` but no `headline`. Add it:

**File to modify:** `lib/db/schema.ts`

Add to the `insights` table definition:
```typescript
headline: varchar('headline', { length: 255 }),
```

Run `npx drizzle-kit push` after this change.

**Update `InsightCard.tsx`** to display the headline as the card title if present:
```typescript
// In the InsightCard component, add a headline line:
{insight.headline && (
  <p className="text-sm font-black text-dark mb-1">{insight.headline}</p>
)}
<p className="text-sm text-dark leading-relaxed">{insight.content}</p>
```

### Testing 6.10
- Run insights cron manually as a Starter user → insight generated is a content tip or seasonal event
- Run cron as Growth user → insight is competitive gap or paid ads trend type
- Check `insights` table — `insightType` column matches expected values
- InsightCard on dashboard shows headline + content

---

---

# STEP 6.11 — Sidebar Navigation — Paid Ads

**What this step does:** Adds the "Paid Ads" nav item to the sidebar. Growth users see it as a regular nav item. Starter users see it with a lock badge and are taken to `/dashboard/ads` (which shows the lock screen).

**File to modify:** `app/(dashboard)/layout.tsx`

---

## 6.11.1 Add the import

Add `TrendingUp` to the existing lucide-react import if not already there:
```typescript
import { ..., TrendingUp } from 'lucide-react';
```

---

## 6.11.2 Add Paid Ads to navItems array

In the `navItems` array, add after the `'Performance'` item:
```typescript
{ label: 'Paid Ads', href: '/dashboard/ads', icon: TrendingUp, growthOnly: true },
```

Add `growthOnly?: boolean` to the navItems type (or just use `as any` — the array is defined inline so TypeScript will infer it).

---

## 6.11.3 Update NavLinks to show lock badge on Growth-only items

The `NavLinks` component renders nav links. Update it to show a badge for locked items:

```typescript
const NavLinks = ({ onClick }: { onClick?: () => void }) => (
  <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
    {navItems.map((item) => {
      const isActive = pathname === item.href;
      const Icon = item.icon;
      const isGrowthLocked = item.growthOnly && subscriptionTier !== 'growth';

      return (
        <Link
          key={item.href}
          id={item.tourId}
          href={item.href}
          onClick={onClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            isActive
              ? 'bg-[#2E2E2E] text-white border-l-3 border-primary pl-3.5'
              : 'text-muted hover:text-white hover:bg-[#252525]'
          }`}
        >
          <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted'}`} />
          <span className="flex-1">{item.label}</span>
          {isGrowthLocked && (
            <span className="text-[9px] font-black text-primary bg-orange-tint px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Growth
            </span>
          )}
        </Link>
      );
    })}
  </nav>
);
```

Both the desktop and mobile `NavLinks` calls use the same component, so this change applies to both automatically.

### Testing 6.11
- Log in as Starter → sidebar shows "Paid Ads" with orange "Growth" badge
- Click "Paid Ads" on Starter → navigates to `/dashboard/ads` → lock screen shown
- Log in as Growth → sidebar shows "Paid Ads" without badge
- Click "Paid Ads" on Growth → full ads page loads

---

---

# Global Rules for Phase 6

1. **Never block Starter users from navigating to Growth-only pages** — show the lock screen, not a redirect. Users seeing the lock screen may be motivated to upgrade.
2. **All API routes must call `requireGrowthPlan()` as the first line** — before any DB read or Claude call.
3. **The action generator defaults to `'starter'`** — all existing callers that don't pass the tier continue to work without paid_ads actions.
4. **No schema migration is needed** for steps 6.1–6.8 and 6.11 — all use existing tables. Only step 6.10.3 requires adding a `headline` column to `insights`. Run `npx drizzle-kit push` for that one change only.
5. **No new npm packages needed** — all steps use existing `@langchain/anthropic`, `drizzle-orm`, `next-auth`, and React.
6. **All new API routes are under `/api/ads/`** — clean, isolated namespace that does not conflict with anything existing.
7. **The `AdStrategyDisplay` component and all `*Section` components live in `app/(dashboard)/dashboard/ads/page.tsx`** as named functions, not separate files. This avoids creating unnecessary files and keeps the full ads page in one place.

---

# Testing Phase 6 — End to End

Run this sequence to verify the entire Growth feature set:

```
1. Create Growth test account (set subscriptionTier = 'growth' in DB or go through Stripe upgrade)
2. Open /dashboard/ads → full page loads (NOT lock screen) ✅
3. Meta tab → enter budget $300 → Generate My Strategy → strategy with audience, ad copy, setup steps ✅
4. Google tab → Generate → keywords (exact/phrase/negative) visible, ad copy has 3 headlines ✅
5. TikTok tab → Generate → video hooks and caption visible ✅
6. Budget optimizer → $100 → 100% Meta + low budget warning ✅
7. Budget optimizer → $500 → three-way split with rationale ✅
8. Audience targeting → Generate Segments → 3 segment cards appear ✅
9. Sidebar → "Paid Ads" visible without lock badge ✅

10. Switch account to subscriptionTier = 'starter'
11. Open /dashboard/ads → lock screen with upgrade CTA shown ✅
12. Sidebar → "Paid Ads" shows orange "Growth" badge ✅
13. POST /api/ads/generate as Starter → 403 response ✅
14. GET /api/ads/audience as Starter → 403 response ✅
15. POST /api/ads/budget as Starter → 403 response ✅

16. Generate 5 daily actions as Starter → none have action_type = "paid_ads" ✅
17. Generate 5 daily actions as Growth → at least some have action_type = "paid_ads" ✅

18. Run insights cron as Growth user → insight has type "competitor_gap" or "paid_ads_trend" ✅
19. Dashboard InsightCard shows headline + content ✅

20. Log results for a paid_ads action as Growth user ✅
21. Open Performance → Paid Ads section shows results ✅
22. Switch to Starter → Paid Ads section not visible in Performance ✅
```

---

*Stormo Growth Plan Implementation — Phase 6 | June 2026 | Hardball Ventures LLC*
