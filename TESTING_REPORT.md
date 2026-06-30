# Stormo — Comprehensive Testing Report

**Date:** 2026-06-28  
**Test runner:** Vitest 4.1.9  
**Test files:** 15 (in `__tests__/`)  

---

## Summary

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ 0 errors |
| Unit / integration tests | ✅ **104 / 104 passed** |
| ESLint total problems | ❌ **282 problems — 196 errors, 86 warnings** |

---

## Test Results — All Passing (104/104)

### `lib/email/layout.ts` — 17 tests ✅
| Test | Status |
|---|---|
| brandedEmail: wraps in HTML shell with logo, footer | ✅ |
| brandedEmail: empty content still produces valid shell | ✅ |
| brandedEmail: XSS content passed through (caller's responsibility) | ✅ |
| brandedEmail: uses env URL for logo src | ✅ |
| ctaButton: correct label and href | ✅ |
| ctaButton: special chars in label | ✅ |
| ctaButton: empty label | ✅ |
| h1: wraps in styled h1 | ✅ |
| p: wraps in styled p | ✅ |
| ul: all 3 items rendered | ✅ |
| ul: single item | ✅ |
| ul: empty array → empty ul | ✅ |
| highlightBox: orange default | ✅ |
| highlightBox: green variant | ✅ |
| highlightBox: amber variant | ✅ |
| statGrid: all stat cells rendered | ✅ |
| statGrid: empty stats → empty table row | ✅ |

### `lib/ai/model.ts` — 6 tests ✅
| Test | Status |
|---|---|
| Returns ChatAnthropic when provider=anthropic + key set | ✅ |
| Throws when ANTHROPIC_API_KEY is empty | ✅ |
| Throws on unsupported provider | ✅ |
| Returns OpenAIEmbeddings when key is valid | ✅ |
| Falls back to MockEmbeddings when key is placeholder | ✅ |
| MockEmbeddings returns 1536-dim vector | ✅ |
| MockEmbeddings.embedDocuments returns array-of-arrays | ✅ |

### `lib/ai/action-generator` JSON parsing — 9 tests ✅
| Test | Status |
|---|---|
| Parses clean JSON | ✅ |
| Parses JSON wrapped in \`\`\`json fences | ✅ |
| Parses JSON wrapped in plain \`\`\` fences | ✅ |
| Parses JSON with whitespace | ✅ |
| Throws SyntaxError on invalid JSON | ✅ |
| Throws on empty string | ✅ |
| Throws on partial JSON | ✅ |
| All 5 required fields present | ✅ |
| Extra fields preserved | ✅ |

### `lib/db/coverage-map` merge logic — 7 tests ✅
| Test | Status |
|---|---|
| Adds new channel when none exists | ✅ |
| Increments count on repeat use | ✅ |
| Does not affect other channels | ✅ |
| Empty signal stored correctly | ✅ |
| Null signal handled | ✅ |
| lastUsed matches today's date | ✅ |
| Multiple channels built independently | ✅ |

### `lib/milestones/check-milestones.ts` — 13 tests ✅
| Test | Status |
|---|---|
| action_completed → first_action | ✅ |
| sale_reported → first_sale | ✅ |
| login → first_login | ✅ |
| outreach_added → first_outreach_added | ✅ |
| content_viewed → first_content_viewed | ✅ |
| Unknown event → undefined | ✅ |
| Empty string → undefined | ✅ |
| Case-sensitive mismatch → undefined | ✅ |
| Awards ten_sales at totalSales=10 | ✅ |
| Awards ten_sales at totalSales>10 | ✅ |
| Does not award at totalSales=9 | ✅ |
| Does not award on wrong event | ✅ |
| Handles null totalSales gracefully | ✅ |

### `api/actions/complete` — 5 tests ✅
| Test | Status |
|---|---|
| 401 when unauthenticated | ✅ |
| 200 on valid complete | ✅ |
| Accepts null outcomeSignal | ✅ |
| Accepts string outcomeSignal | ✅ |
| Malformed JSON body does not crash | ✅ |

### `api/actions/today` — 4 tests ✅
| Test | Status |
|---|---|
| 401 when unauthenticated | ✅ |
| Returns scheduled action for today | ✅ |
| Returns completed action when today is done | ✅ |
| Returns null when no action exists | ✅ |

### `api/actions/postpone` — 4 tests ✅
| Test | Status |
|---|---|
| 401 when unauthenticated | ✅ |
| Moves to tomorrow with status=postponed | ✅ |
| 404 when action not found | ✅ |
| scheduledFor is exactly tomorrow | ✅ |

### `api/actions/skip` — 3 tests ✅
| Test | Status |
|---|---|
| 401 when unauthenticated | ✅ |
| Sets status to skipped | ✅ |
| 404 when action not found | ✅ |

### `api/actions/history` — 7 tests ✅
| Test | Status |
|---|---|
| 401 when unauthenticated | ✅ |
| Empty array when user has no actions | ✅ |
| Returns paginated actions | ✅ |
| Page 2 uses correct offset | ✅ |
| Status filter applies | ✅ |
| Channel filter applies | ✅ |
| Invalid page number defaults gracefully | ✅ |

### `api/auth/register` — 5 tests ✅
| Test | Status |
|---|---|
| 400 when email missing | ✅ |
| 400 when password missing | ✅ |
| 400/409 when email already exists | ✅ |
| 201 on successful registration (with terms:true) | ✅ |
| 400 when terms not accepted | ✅ |

### `api/billing` — 3 tests ✅
| Test | Status |
|---|---|
| /upgrade: 401 when unauthenticated | ✅ |
| /cancel: 401 when unauthenticated | ✅ |
| /downgrade: 401 when unauthenticated | ✅ |

### `api/notifications/subscribe` — 3 tests ✅
| Test | Status |
|---|---|
| POST: 401 when unauthenticated | ✅ |
| POST: 400 when subscription data missing | ✅ |
| DELETE: 401 when unauthenticated | ✅ |
| GET: 200 { subscribed:false } for unauthenticated (by design) | ✅ |

### `components/ActionHistoryList` resultsToForm — 6 tests ✅
### `components/DailyActionCard` channel config — 9 tests ✅

---

## ESLint Issues — 282 Problems

### 🔴 CRITICAL — Fix Immediately

#### 1. "Cannot create components during render" (5 instances)
Components defined inside another component's render function — React will remount them on every render, resetting all their state and causing flicker.

| File | Line |
|---|---|
| `app/(dashboard)/layout.tsx` | 85, 145 |
| `app/(dashboard)/dashboard/page.tsx` | 328 |
| `app/(public)/blog/[slug]/page.tsx` | 186, 192 |

**Fix:** Move the inner component definition outside the parent component or to its own file.

```tsx
// ❌ Bug — CtaBanner is recreated every render
export default function BlogPostPage() {
  const CtaBanner = () => <div>...</div>  // line 186
  return <CtaBanner />
}

// ✅ Fix — define outside
function CtaBanner() { return <div>...</div> }
export default function BlogPostPage() {
  return <CtaBanner />
}
```

---

#### 2. "Cannot access variable before it is declared" (2 instances)
`useEffect` callbacks reference functions that are declared later in the file. Works by JS hoisting in some cases but causes lint errors and can break with strict mode.

| File | Line |
|---|---|
| `components/dashboard/NotificationPermissionBanner.tsx` | 47 |
| `components/dashboard/PushNotificationSettings.tsx` | 31 |

**Fix:** Move function declarations above the `useEffect` that calls them.

---

#### 3. "Cannot call impure function during render" (3 instances)
Side-effect-producing function calls directly in render body.

| File | Line |
|---|---|
| `app/(dashboard)/dashboard/page.tsx` | 67 |
| `components/dashboard/PushNotificationSettings.tsx` | 125, 126 |

**Fix:** Move impure calls into a `useEffect` or event handler.

---

### 🟡 MODERATE — Fix Before Production

#### 4. "Calling setState synchronously within an effect" (~15 instances)
`useEffect` bodies calling `setState` directly instead of in a callback. Can trigger cascading re-renders.

Affected files (most instances):
- `app/(auth)/reset-password/page.tsx` (line 22)
- `app/(auth)/verify-email/page.tsx` (line 24)
- `app/(admin)/admin/coupons/page.tsx` (line 41)
- `app/(dashboard)/onboarding/page.tsx`
- `components/dashboard/AskStormo.tsx`
- `components/dashboard/DailyActionCard.tsx`
- Multiple auth pages

**Fix:** Wrap state update in a conditional or move to async callback:
```tsx
// ❌
useEffect(() => { setError('Invalid token'); }, [token]);

// ✅
useEffect(() => {
  if (!token) setError('Invalid token');
}, [token]);
// (Moving the setState inside a conditional satisfies the rule)
```

---

#### 5. `react/no-unescaped-entities` — Unescaped apostrophes (~8 instances)

| File | Note |
|---|---|
| `app/(auth)/login/page.tsx` | Line 189 |
| `app/(auth)/verify-email-required/page.tsx` | Line 76 |
| `app/(dashboard)/layout.tsx` | Line 859 |
| `app/(public)/faq/FAQClient.tsx` | Lines 62, 72 |
| `app/(dashboard)/onboarding/page.tsx` | Line 323, 455 |

**Fix:** Replace `'` → `&apos;` or use `{"'"}` in JSX.

---

#### 6. Missing `exhaustive-deps` dependencies (~12 instances)
`useEffect` missing dependencies. Can cause stale closures where effects use outdated state/props.

Common in: `ActionHistoryList.tsx`, `DailyActionCard.tsx`, `AskStormo.tsx`, `NotificationPermissionBanner.tsx`

**Fix per case:** Either add the dependency or wrap the function in `useCallback`.

---

### 🟢 LOW — Code Quality

#### 7. `@typescript-eslint/no-explicit-any` — 192 instances
Using `any` type instead of proper TypeScript types. Not breaking but reduces type safety.

**Most affected files:**
- `lib/db/queries.ts`
- `lib/db/schema.ts`
- `lib/email/triggers.ts`
- `lib/notifications/push.ts`
- `lib/stripe/client.ts`
- All API route catch blocks (`catch (error: any)`)

**Fix:** Replace `any` with proper types or `unknown` with type narrowing in catch blocks.

---

#### 8. `@next/next/no-img-element` — ~30 instances
Using `<img>` instead of Next.js `<Image />`. Causes slower LCP scores.

Main auth pages (`login`, `register`, `forgot-password`, `reset-password`, `verify-email`), navbar, admin login all use raw `<img>`.

**Fix:** Replace with `import Image from 'next/image'`.

---

#### 9. `@typescript-eslint/no-unused-vars` — ~20 instances

| File | Unused variable |
|---|---|
| `app/(auth)/login/page.tsx` | `Zap` |
| `app/(auth)/register/page.tsx` | `Zap` |
| `app/(auth)/forgot-password/page.tsx` | `response`, `err` |
| `lib/db/schema.ts` | `sql` |
| `lib/milestones/check-milestones.ts` | `users` |
| `lib/notifications/push.ts` | `and` |
| `lib/email/send-templates.ts` | `name` |
| `app/(dashboard)/layout.tsx` | `MessageSquare` |
| `app/(dashboard)/dashboard/campaigns/page.tsx` | `Compass`, `InstagramIcon` |

---

#### 10. `@typescript-eslint/no-require-imports` — 5 instances (scratch files only)
`require()` used in `scratch/read_pdfs.js` and `scratch/test_onboarding.js`. These are dev scratch files — not in the main app. No fix needed in app code; add them to `.eslintignore`.

---

## Areas Not Yet Covered by Tests

The following features have no automated tests. Recommend adding in this priority order:

| Priority | Area | Suggested test type |
|---|---|---|
| 🔴 High | Stripe webhooks (`/api/stripe/webhook`) | Integration — mock Stripe events |
| 🔴 High | Onboarding flow (AI chain + DB inserts) | Integration |
| 🔴 High | Auth flow (login, session, JWT verify-email) | Integration + E2E |
| 🟡 Medium | Cron jobs (daily-actions, weekly-summary) | Integration — mock DB + email |
| 🟡 Medium | Ask Stormo AI chain | Unit — mock LangChain |
| 🟡 Medium | Sales tracking (`/api/sales`) | Integration |
| 🟡 Medium | Outreach contacts CRUD | Integration |
| 🟡 Medium | Admin auth (login, middleware) | Integration |
| 🟡 Medium | Push notification send (`lib/notifications/push.ts`) | Unit — mock web-push |
| 🟢 Low | Homepage components (static UI) | E2E snapshot |
| 🟢 Low | Blog pages (SSR + markdown) | E2E |
| 🟢 Low | Campaigns / Content generators | Integration |
| 🟢 Low | Performance / Insights aggregation | Unit |

---

## Key Bugs Discovered During Testing

### BUG-001 — Register route requires `terms: true` but frontend may not always send it
**Severity:** Medium  
**File:** `app/api/auth/register/route.ts`  
**Detail:** The Zod schema requires `terms: z.boolean().refine(v => v === true)`. If any frontend form fails to include `terms: true` in the POST body, users get a 400 with "You must accept the terms" — even if they checked the box. Verify the register form always sends `terms: true`.

---

### BUG-002 — Components created inside render (5 locations)
**Severity:** High — causes state loss + flicker  
**Detail:** See ESLint Critical issue #1 above.

---

### BUG-003 — `useEffect` referencing undeclared variables (2 locations)  
**Severity:** Medium — may silently break in React Strict Mode  
**Detail:** See ESLint Critical issue #2 above.

---

### DESIGN-NOTE-001 — Notifications GET returns 200 for unauthenticated users (intentional)
**Severity:** None — by design  
**File:** `app/api/notifications/subscribe/route.ts`  
**Detail:** GET returns `{ subscribed: false }` with 200 for unauthenticated users. This is correct — the endpoint doesn't expose private data and gracefully degrades. No fix needed.

---

## How to Run Tests

```bash
# Run all unit tests
npx vitest run

# Run with watch mode during development
npx vitest

# Run specific test file
npx vitest run __tests__/lib/email/layout.test.ts

# TypeScript check
npx tsc --noEmit

# ESLint check
npx eslint . --ext .ts,.tsx
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:types": "tsc --noEmit",
    "test:lint": "eslint . --ext .ts,.tsx"
  }
}
```
