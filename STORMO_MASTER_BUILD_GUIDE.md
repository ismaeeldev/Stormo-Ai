# STORMO.IO — Master AI Build Prompt Guide
**For Absolute Beginners | Sequence-Safe | Self-Verifying**

> **Before you start:**
> 1. Create your project folder (e.g. `stormo-app`)
> 2. Place `THEME.md` (provided separately) in the root of the project folder
> 3. Place `Stormo_SRS_v1_0.docx` in the root of the project folder
> 4. Open your AI IDE (Cursor, Windsurf, or similar) pointing at that folder
> 5. Follow every prompt IN ORDER. Do not skip. Do not jump ahead.
> 6. After every prompt, run the **Test** before moving to the next prompt.

---

## HOW TO USE THIS GUIDE

- Every prompt is labeled: `Section X.Y` — copy it EXACTLY into your AI IDE
- Every prompt ends with: **✅ TEST** — run this test manually before moving on
- **Expected Answer** — what you should see to confirm it worked
- If the test fails, tell your AI: *"The test failed. [describe what happened]. Fix it before we continue."*
- References to `THEME.md` and `SRS` mean the files you placed in your root folder

---

---

# ⚙️ PRE-SECTION: ACCOUNTS & EXTERNAL SERVICES SETUP

> Complete ALL of these before writing a single line of code. This takes 1–2 hours but prevents all setup failures later.

---

### ACC-1 — Neon PostgreSQL (Database)

**What it is:** Your cloud database. Free tier is enough to start.

**Steps:**
1. Go to **https://neon.tech** → Sign up (free)
2. Create a new project → name it `stormo-app`
3. Select region closest to you
4. After creation, go to **Dashboard → Connection Details**
5. Copy the connection string that looks like:
   `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
6. Save this — it becomes your `DATABASE_URL` environment variable
7. In the Neon dashboard, go to **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
8. You should see "Success" — this enables AI vector search

**✅ Test ACC-1:** You can paste `DATABASE_URL` into a text file. The SQL command ran without error.

---

### ACC-2 — Upstash Redis (Background Jobs)

**What it is:** A free cloud Redis database for running background jobs (weekly content generation).

**Steps:**
1. Go to **https://upstash.com** → Sign up (free)
2. Create a new Redis database → name it `stormo-redis` → select your region → free tier
3. After creation, click on your database → go to **REST API** tab
4. Copy:
   - `UPSTASH_REDIS_REST_URL` (looks like `https://xxx.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (long string starting with `AX...`)
5. Save both values

**✅ Test ACC-2:** Both values copied and saved somewhere safe.

---

### ACC-3 — Anthropic API Key (AI)

**What it is:** The key that lets your app talk to Claude AI.

**Steps:**
1. Go to **https://console.anthropic.com** → Sign up / Log in
2. Go to **API Keys** → Create new key → name it `stormo-dev`
3. Copy the key (starts with `sk-ant-...`) — you can only see it ONCE
4. Save it as `ANTHROPIC_API_KEY`

**✅ Test ACC-3:** Key saved safely. Do not paste it in any public file or share it.

---

### ACC-4 — Stripe Account (Payments)

**What it is:** Handles all subscription payments. Start in TEST mode.

**Steps:**
1. Go to **https://stripe.com** → Sign up
2. You start in **Test Mode** (toggle top-right) — stay here for development
3. Go to **Developers → API Keys**, copy:
   - `STRIPE_SECRET_KEY` (starts with `sk_test_...`)
   - `STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_...`)
4. Create Products:
   - Go to **Products → Add Product** → Name: "Stormo Starter Intro" → Price: $9.00 → Recurring → Monthly → One-time coupon: Not needed (Stripe handles intro via trial or coupon — see Section S below for detailed Stripe guide)
   - Create second price under same product: $29.00/month → call it "Starter Recurring"
   - Create new product: "Stormo Growth" → $39.00/month
5. Copy each **Price ID** (format: `price_xxx...`) — save as:
   - `STRIPE_PRICE_STARTER_INTRO`
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_GROWTH`
6. Webhook secret — set up AFTER deployment (see Section 3.3)

**✅ Test ACC-4:** 3 Price IDs saved. Both API keys saved.

---

### ACC-5 — Google OAuth (Sign In with Google)

**What it is:** Lets users log in with their Google account.

**Steps:**
1. Go to **https://console.cloud.google.com**
2. Create new project → name it `stormo-io`
3. Go to **APIs & Services → OAuth consent screen** → External → fill in app name "Stormo" + your email
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Authorized redirect URIs: add `http://localhost:3000/api/auth/callback/google` (for development)
7. After creating: copy **Client ID** → `GOOGLE_CLIENT_ID` and **Client Secret** → `GOOGLE_CLIENT_SECRET`

**✅ Test ACC-5:** Both Google keys saved.

---

### ACC-6 — Email SMTP (Nodemailer)

**What it is:** Used to send emails from your app. Gmail works for free.

**Steps (Gmail):**
1. Use a Gmail account (create new one: `hello@stormo.io` or similar)
2. Go to Google Account → **Security → 2-Step Verification** → enable it
3. Then go to **Security → App Passwords** → create one → name it "Stormo"
4. Copy the 16-character password
5. Save:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your@gmail.com`
   - `SMTP_PASS=your-16-char-app-password`
   - `FROM_EMAIL=your@gmail.com`

**✅ Test ACC-6:** SMTP values saved.

---

---

# 🏗️ SECTION 0 — PROJECT INITIALIZATION & PACKAGES

> Run ALL of these prompts before any coding starts. This sets up the foundation.

---

### Prompt 0.1 — Initialize Next.js Project

**Paste this into your AI IDE:**

```
I am building a SaaS app called Stormo.io. The full SRS is in Stormo_SRS_v1_0.docx and the theme guide is in THEME.md in the root folder.

Initialize a new Next.js 14 project with the following exact setup:
- Framework: Next.js 14 with App Router
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- Package manager: npm
- Project name: stormo-app

Run: npx create-next-app@latest stormo-app --typescript --tailwind --app --eslint --src-dir=false

After creation, open the stormo-app folder as the working directory.
```

**✅ TEST 0.1:** Run `npm run dev` in terminal. You see "Ready - started server on http://localhost:3000". Open browser at localhost:3000 and see the default Next.js page.

---

### Prompt 0.2 — Install All Required Packages

**Paste this into your AI IDE:**

```
We are setting up Stormo.io (see THEME.md and SRS in root). Install ALL required npm packages in one go. Run this exact command:

npm install \
  @auth/core \
  next-auth@beta \
  @langchain/anthropic \
  @langchain/openai \
  @langchain/core \
  langchain \
  @langchain/langgraph \
  drizzle-orm \
  drizzle-kit \
  @neondatabase/serverless \
  pg \
  @types/pg \
  bcryptjs \
  @types/bcryptjs \
  stripe \
  @stripe/stripe-js \
  bullmq \
  @upstash/redis \
  nodemailer \
  @types/nodemailer \
  lucide-react \
  canvas-confetti \
  @types/canvas-confetti \
  node-fetch \
  @types/node-fetch \
  zod \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs \
  @radix-ui/react-toast \
  clsx \
  tailwind-merge \
  class-variance-authority \
  react-markdown

After install confirm all packages installed successfully with no critical errors.
```

**✅ TEST 0.2:** `node_modules` folder exists. `package.json` contains all the packages listed above. No error in terminal.

---

### Prompt 0.3 — Configure Tailwind with Stormo Theme

**Paste this into your AI IDE:**

```
Configure Tailwind CSS for Stormo.io using the exact colors and theme from THEME.md in the root folder.

Update tailwind.config.ts to:
1. Add the Stormo brand colors as custom Tailwind color tokens (primary: #E8621A, dark: #1A1A1A, light-bg: #F5F5F5, muted: #AAAAAA, subtle: #666666, orange-tint: #FDF0E8, destructive: #DC2626)
2. Set font family to Inter as default sans font
3. Add content paths for app/**, components/**, lib/**

Update app/globals.css to:
1. Import Google Fonts Inter (weights 400,500,600,700,800)
2. Set html { scroll-behavior: smooth; }
3. Set body { font-family: 'Inter', sans-serif; color: #1A1A1A; }
4. Add CSS variables for all Stormo theme colors as defined in THEME.md
```

**✅ TEST 0.3:** Add `<h1 className="text-primary text-4xl font-bold">Stormo</h1>` to `app/page.tsx`. Run `npm run dev`. You see "Stormo" in orange (`#E8621A`) on the page.

---

### Prompt 0.4 — Create Environment Variables File

**Paste this into your AI IDE:**

```
Create a .env.local file in the root of the project with all required environment variable placeholders for Stormo.io based on SRS Section 19.1.

The file should have every variable from the SRS listed with placeholder values like YOUR_VALUE_HERE, plus these pre-filled values:
- AI_PROVIDER=anthropic
- AI_MODEL=claude-sonnet-4-20250514
- NEXTAUTH_URL=http://localhost:3000

Also create a .env.example file with the same structure (safe to commit).
Also add .env.local to .gitignore (make sure it's there).

List every environment variable name clearly so I can fill them in.
```

**✅ TEST 0.4:** Open `.env.local` — all variable names are there. Open `.gitignore` — `.env.local` is listed. The `.env.example` file exists.

---

### Prompt 0.5 — Create Project Folder Structure

**Paste this into your AI IDE:**

```
Create the complete Stormo.io folder structure as defined in SRS Section 3.4. Create these folders and placeholder index files:

Folders to create (with empty .gitkeep or placeholder files):
- app/(public)/  
- app/(auth)/
- app/(dashboard)/
- app/api/
- lib/ai/
- lib/db/
- lib/jobs/
- lib/email/
- components/ui/
- components/dashboard/
- components/homepage/
- config/

Also create a config/constants.ts file with:
- APP_NAME = "Stormo.io"
- APP_URL = process.env.NEXTAUTH_URL
- SIMILARITY_THRESHOLD = 0.85
- COMPRESSION_BATCH_SIZE = 30
- MAX_CHAT_HISTORY = 20
```

**✅ TEST 0.5:** All folders exist when you look at the file tree in your IDE. `config/constants.ts` exists and exports the constants.

---

---

# 🗄️ SECTION 1 — DATABASE SETUP

---

### Prompt 1.1 — Configure Drizzle ORM + Neon Connection

**Paste this into your AI IDE:**

```
Set up Drizzle ORM with Neon PostgreSQL for Stormo.io. See SRS Section 3.2 and Section 4 for database requirements.

1. Create lib/db/index.ts:
   - Import neon from @neondatabase/serverless
   - Import drizzle from drizzle-orm/neon-http
   - Export a db instance using process.env.DATABASE_URL
   - Export the db type

2. Create drizzle.config.ts in project root:
   - schema: "./lib/db/schema.ts"
   - out: "./drizzle"
   - dialect: "postgresql"
   - dbCredentials: { url: process.env.DATABASE_URL! }

3. Add to package.json scripts:
   - "db:generate": "drizzle-kit generate"
   - "db:migrate": "drizzle-kit migrate"
   - "db:push": "drizzle-kit push"
   - "db:studio": "drizzle-kit studio"
```

**✅ TEST 1.1:** `lib/db/index.ts` and `drizzle.config.ts` exist. No TypeScript errors when you run `npx tsc --noEmit`.

---

### Prompt 1.2 — Create Full Database Schema

**Paste this into your AI IDE:**

```
Create the complete Drizzle ORM schema in lib/db/schema.ts for Stormo.io. Reference SRS Section 4 for EVERY table and column exactly.

Create ALL 10 tables with exact column types, constraints, defaults, and relations:
1. users — SRS Section 4.1 (all columns including stripe fields, subscription fields, onboarding fields)
2. store_profiles — SRS Section 4.2 (including coverage_map as jsonb)
3. actions — SRS Section 4.3 (include embedding as customType for vector(1536))
4. action_compressed_summaries — SRS Section 4.4
5. weekly_content — SRS Section 4.5
6. ask_stormo_messages — SRS Section 4.6
7. outreach_contacts — SRS Section 4.7
8. milestones — SRS Section 4.8
9. blog_posts — SRS Section 4.9
10. subscriptions — SRS Section 4.10

For the vector column in actions table, use:
import { customType } from 'drizzle-orm/pg-core';
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) { return `vector(${config?.dimensions ?? 1536})`; },
  toDriver(value) { return JSON.stringify(value); },
  fromDriver(value) { return JSON.parse(value as string); },
});

Export all table schemas. Export a DatabaseSchema type.
```

**✅ TEST 1.2:** Run `npx tsc --noEmit`. Zero TypeScript errors. `lib/db/schema.ts` exports all 10 tables.

---

### Prompt 1.3 — Run Database Migration

**Paste this into your AI IDE:**

```
Now push the Stormo.io database schema to Neon. 

1. Make sure DATABASE_URL in .env.local is filled with the real Neon connection string
2. Run: npm run db:push
3. If there are any errors, fix them before continuing
4. After successful push, run: npm run db:studio
5. Confirm all 10 tables appear in Drizzle Studio UI

Also run this SQL in Neon's SQL Editor to create the vector index for performance:
CREATE INDEX IF NOT EXISTS actions_embedding_idx ON actions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**✅ TEST 1.3:** Open Neon dashboard → Tables section. You can see all 10 tables: users, store_profiles, actions, action_compressed_summaries, weekly_content, ask_stormo_messages, outreach_contacts, milestones, blog_posts, subscriptions.

---

### Prompt 1.4 — Create DB Query Helper Functions

**Paste this into your AI IDE:**

```
Create reusable database query helper functions in lib/db/queries.ts for Stormo.io.

Create typed query functions for the most-used operations:
1. getUserById(id: string) — returns full user row
2. getUserByEmail(email: string) — returns user or null
3. getStoreProfile(userId: string) — returns store_profiles row
4. createStoreProfile(userId: string, data: Partial<StoreProfile>) — inserts or updates
5. getTodaysAction(userId: string) — returns action for today's date or null
6. getRecentActions(userId: string, limit: number) — returns last N actions newest first
7. getCompressedSummaries(userId: string) — returns all summaries for user
8. getWeeklyContent(userId: string, weekStart: Date) — returns this week's content
9. getOutreachContacts(userId: string) — returns all contacts for user
10. getMilestones(userId: string) — returns all achieved milestones
11. updateUserSubscription(userId: string, data) — updates subscription fields
12. updateCoverageMap(userId: string, channel: string, signal: string) — merges coverage_map JSON

All functions must use the db instance from lib/db/index.ts and the schemas from lib/db/schema.ts.
```

**✅ TEST 1.4:** `lib/db/queries.ts` exists. Run `npx tsc --noEmit` — zero errors. All 12 functions are exported.

---

---

# 🤖 SECTION 2 — AI FOUNDATION (LANGCHAIN)

> This section creates the AI backbone. EVERYTHING in the app uses these files.

---

### Prompt 2.1 — Create LangChain Model Factory

**Paste this into your AI IDE:**

```
Create the LangChain model factory for Stormo.io. This is the MOST IMPORTANT AI file — every single AI call in the app uses this. Reference SRS Section 3.3 and 15.1.

Create lib/ai/model.ts:
1. Import ChatAnthropic from @langchain/anthropic
2. Import ChatOpenAI from @langchain/openai
3. Export a getModel() function that:
   - Reads AI_PROVIDER from process.env (default: "anthropic")
   - Reads AI_MODEL from process.env (default: "claude-sonnet-4-20250514")
   - Returns new ChatAnthropic({ model, apiKey: process.env.ANTHROPIC_API_KEY }) if provider is anthropic
   - Returns new ChatOpenAI({ model, apiKey: process.env.OPENAI_API_KEY }) if provider is openai
4. Export a getEmbeddingModel() function for generating vector embeddings (use OpenAIEmbeddings from @langchain/openai with text-embedding-3-small by default)
5. Add TypeScript JSDoc comments

CRITICAL RULE: No other file in the entire project is ever allowed to import ChatAnthropic or ChatOpenAI directly. They must always call getModel() from this file.
```

**✅ TEST 2.1:** `lib/ai/model.ts` exists. Add `ANTHROPIC_API_KEY` to `.env.local` with your real key. Run `npx tsc --noEmit` — zero errors.

---

### Prompt 2.2 — Create Repetition Prevention Context Assembler

**Paste this into your AI IDE:**

```
Create the repetition prevention context assembler for Stormo.io. This is critical — it ensures AI actions are NEVER repetitive. Reference SRS Section 16 in detail.

Create lib/ai/context-assembler.ts with a function: assembleActionContext(userId: string)

This function must:
1. Fetch store profile from DB (store_profiles table) — ~300 tokens
2. Fetch coverage_map from store_profiles — ~200 tokens  
3. Fetch ALL compressed summaries from action_compressed_summaries table — ~400 tokens
4. Fetch last 20 actions from actions table (verbatim, newest first) — ~800 tokens
5. Run pgvector similarity search: find the 10 actions with highest cosine similarity to a "generic marketing action" seed embedding — these are the near-duplicate candidates — ~300 tokens
6. Return an object: { storeProfile, coverageMap, compressedSummaries, recentActions, nearDuplicateCandidates }
7. Also return a formatted string systemContext ready to inject into Claude prompt

The pgvector query should use Drizzle's sql template tag:
sql`SELECT id, title, channel FROM actions WHERE user_id = ${userId} ORDER BY embedding <=> ${embedding}::vector LIMIT 10`

Total context returned must stay under 2,000 tokens. Log a warning if it exceeds this.
```

**✅ TEST 2.2:** `lib/ai/context-assembler.ts` exists. Run `npx tsc --noEmit` — zero errors. The function is exported.

---

### Prompt 2.3 — Create Action Compression BullMQ Job

**Paste this into your AI IDE:**

```
Create the BullMQ background job that compresses every 30 actions into a short summary. Reference SRS Sections 9.4 and 16.4.

1. Create lib/jobs/queues.ts:
   - Import Queue from bullmq
   - Import Redis from @upstash/redis
   - Create and export: actionCompressionQueue, weeklyContentQueue
   - Connect to Upstash Redis using UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

2. Create lib/jobs/workers/action-compression.worker.ts:
   - Import Worker from bullmq
   - Job name: "compress-actions"
   - Job data: { userId: string, batchStart: number, batchEnd: number }
   - Worker logic:
     a. Fetch actions batchStart to batchEnd for userId from DB
     b. Call getModel() from lib/ai/model.ts
     c. Prompt Claude: "Compress these {count} marketing actions into a 80-100 token narrative summary. Focus on: channels used, outcomes signaled, patterns observed. Be specific, not generic. Actions: {actions}"
     d. Save result to action_compressed_summaries table
   - Export the worker

3. Create lib/jobs/trigger-compression.ts:
   - Function: triggerCompressionIfNeeded(userId: string)
   - Count total actions for user
   - If count is divisible by 30 (and > 0): add job to actionCompressionQueue
   - Export the function
```

**✅ TEST 2.3:** All three files exist. Run `npx tsc --noEmit` — zero errors.

---

---

# 🔐 SECTION 3 — AUTHENTICATION

---

### Prompt 3.1 — Configure NextAuth.js

**Paste this into your AI IDE:**

```
Set up NextAuth.js v5 for Stormo.io. Reference SRS Section 6.

1. Create auth.ts in project root:
   - Configure NextAuth with:
     - Credentials provider (email + password, bcrypt comparison)
     - Google OAuth provider (using GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
     - Session strategy: JWT
     - JWT maxAge: 30 days
   - Extend session and JWT types to include: userId, subscriptionTier, onboardingCompleted
   - In jwt callback: fetch user from DB, add subscription data to token
   - In session callback: pass userId, subscriptionTier, onboardingCompleted to session.user

2. Create app/api/auth/[...nextauth]/route.ts:
   - Export { GET, POST } from auth.ts handlers

3. Create middleware.ts in project root:
   - Protect all /dashboard/* routes: require valid session → redirect to /login
   - Check subscriptionTier on /dashboard/* routes: if not starter or growth → redirect to /pricing  
   - Public routes (/, /login, /register, /blog/*, /api/stripe/webhook) must NOT be protected

4. Update .env.local: add NEXTAUTH_SECRET=any-random-32-character-string-here
```

**✅ TEST 3.1:** Run `npm run dev`. Visit `http://localhost:3000/dashboard`. You should be redirected to `/login` (not see any dashboard content). No TypeScript errors.

---

### Prompt 3.2 — Build Register Page

**Paste this into your AI IDE:**

```
Build the /register page for Stormo.io. Reference SRS Section 6.1 and THEME.md for exact styling.

1. Create app/(auth)/register/page.tsx:
   - Clean centered card layout (white card, shadow, border-radius 12px)
   - Stormo.io orange logo/text at top
   - Form fields: Email, Password (min 8 chars), Name (optional), Terms checkbox
   - Validation: zod schema — email format, password min 8, terms required
   - Submit handler (POST /api/auth/register):
     a. Check if email exists → error "Email already registered"
     b. Hash password with bcryptjs (cost 12)
     c. Insert into users table
     d. Send welcome email via sendEmail() (we'll implement email in Section 8)
     e. Redirect to /pricing (user must subscribe before dashboard)
   - Google OAuth button (calls signIn('google'))
   - Link to /login

2. Create app/api/auth/register/route.ts — the POST handler for registration

3. Style everything using THEME.md color tokens and Tailwind classes
```

**✅ TEST 3.2:** Visit `http://localhost:3000/register`. You see the form. Fill in a test email + password + check terms → Submit. User row appears in Neon database users table. You are redirected to `/pricing`.

---

### Prompt 3.3 — Build Login Page

**Paste this into your AI IDE:**

```
Build the /login page for Stormo.io. Reference SRS Section 6.2 and THEME.md.

1. Create app/(auth)/login/page.tsx:
   - Same clean card layout as register page (consistent look)
   - Fields: Email, Password
   - Google OAuth button
   - "Forgot password?" link → /forgot-password
   - Submit handler: calls signIn('credentials', { email, password })
   - On success: check session.user.subscriptionTier
     - If starter or growth: redirect to /dashboard
     - If free/no tier: redirect to /pricing
   - Error states: "Invalid credentials" message shown in red
   - Link to /register

2. The page must match THEME.md styling exactly: orange brand elements, Inter font, button styles from THEME.md
```

**✅ TEST 3.3:** Visit `/login`. Enter wrong password — see "Invalid credentials" error. Enter correct credentials from test in 3.2 — you are redirected to `/pricing` (because no subscription yet). Google button is visible.

---

### Prompt 3.4 — Build Forgot Password + Reset Flow

**Paste this into your AI IDE:**

```
Build the complete password reset flow for Stormo.io. Reference SRS Section 6.4.

1. Create app/(auth)/forgot-password/page.tsx:
   - Single email field + submit button
   - POST /api/auth/forgot-password
   - If email exists: generate JWT token (userId + exp: 1 hour), send reset email (placeholder for now — just console.log the link)
   - Show success message: "If this email exists, a reset link was sent"
   - Do NOT reveal whether email exists (security)

2. Create app/api/auth/forgot-password/route.ts — the handler

3. Create app/(auth)/reset-password/page.tsx:
   - Reads ?token= from URL params
   - Verify JWT token (check expiry, extract userId)
   - Form: New Password + Confirm Password
   - On submit: update users.password_hash in DB
   - Redirect to /login on success

4. Create app/api/auth/reset-password/route.ts — the handler

Use the jsonwebtoken package for JWT — install it: npm install jsonwebtoken @types/jsonwebtoken
Add JWT_SECRET to .env.local
```

**✅ TEST 3.4:** Visit `/forgot-password`. Enter test email → submit → see success message. Check terminal console for the reset link. Visit that link → see password form → enter new password → redirected to login. Login with new password works.

---

---

# 💳 SECTION 4 — STRIPE BILLING

> See the separate **STRIPE SETUP GUIDE** at the bottom of this document for account-level Stripe configuration. Complete that guide before these prompts.

---

### Prompt 4.1 — Stripe Client + Checkout Session

**Paste this into your AI IDE:**

```
Implement Stripe payment integration for Stormo.io. Reference SRS Section 7.

1. Create lib/stripe/client.ts:
   - Import Stripe from 'stripe'
   - Export: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

2. Create app/api/stripe/create-checkout/route.ts (POST):
   - Get userId from session (require auth)
   - If user has no stripe_customer_id: create Stripe customer, save to users table
   - Create Stripe Checkout Session:
     - mode: 'subscription'
     - line_items: [{ price: STRIPE_PRICE_STARTER_INTRO, quantity: 1 }]
     - success_url: /dashboard?checkout=success
     - cancel_url: /pricing
     - customer: user's stripe_customer_id
   - Return: { url: session.url }

3. Create app/(public)/pricing/page.tsx (basic):
   - Show "Start for $9" button
   - On click: POST /api/stripe/create-checkout → redirect to returned URL
   - Style using THEME.md (see SRS Section 5.7 for full pricing section design — full homepage built later in Section 6)
```

**✅ TEST 4.1:** Register a new test user → visit `/pricing` → click "Start for $9" → you are redirected to Stripe's checkout page (Stripe-hosted, shows $9 price).

---

### Prompt 4.2 — Stripe Webhook Handler

**Paste this into your AI IDE:**

```
Build the Stripe webhook handler for Stormo.io. Reference SRS Section 7.3.

Create app/api/stripe/webhook/route.ts:
1. Read raw body (important for signature verification): use req.text() not req.json()
2. Verify webhook signature: stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
3. Handle these events:
   - customer.subscription.created: 
     * Update users: subscription_tier='starter', subscription_status='active'
     * Insert into subscriptions table
   - customer.subscription.updated:
     * Sync status to users and subscriptions tables
   - customer.subscription.deleted:
     * Update users: subscription_status='canceled', subscription_tier='free'
     * Update subscriptions table status
   - invoice.payment_succeeded:
     * Log success (console.log for now — email added in Section 8)
   - invoice.payment_failed:
     * Update users: subscription_status='past_due'
     * Console.log "SEND PAYMENT FAILED EMAIL" (email added later)
4. Return 200 for all handled events

Add STRIPE_WEBHOOK_SECRET to .env.local (get from Stripe CLI or dashboard)
```

**✅ TEST 4.2:** Install Stripe CLI (`npm install -g stripe`). Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Complete a test checkout with card `4242 4242 4242 4242`. In terminal you see webhook events received. In Neon DB, user's subscription_status = 'active', subscription_tier = 'starter'.

---

### Prompt 4.3 — Subscription Management Page (Settings Preview)

**Paste this into your AI IDE:**

```
Build the subscription management section for Stormo.io settings. Reference SRS Section 7.4 and 12.7.

1. Create app/(dashboard)/dashboard/settings/page.tsx (basic version):
   - Show current plan: starter or growth badge
   - Show next billing date (from subscriptions table)
   - Cancel subscription button:
     * POST /api/stripe/cancel-subscription
     * Sets cancel_at_period_end = true in Stripe
     * Shows confirmation: "Your subscription ends on [date]. You keep access until then."
   - Growth Upgrade button (only show when users.total_sales >= 10):
     * POST /api/stripe/upgrade-to-growth
     * Calls stripe.subscriptions.update() to change price to STRIPE_PRICE_GROWTH
     * Updates subscription_tier in DB to 'growth'

2. Create app/api/stripe/cancel-subscription/route.ts
3. Create app/api/stripe/upgrade-to-growth/route.ts

Style with THEME.md. Use Destructive button style for cancel.
```

**✅ TEST 4.3:** After subscribing in test mode, visit `/dashboard/settings`. You see your current plan. Click Cancel — Stripe sets `cancel_at_period_end: true` (verify in Stripe dashboard). Growth button is NOT visible (0 sales).

---

---

# 🏠 SECTION 5 — DASHBOARD SHELL

---

### Prompt 5.1 — Dashboard Layout + Sidebar

**Paste this into your AI IDE:**

```
Build the Stormo.io dashboard layout with sidebar. Reference SRS Section 12.1 and 12.2, and THEME.md for all styling.

Create app/(dashboard)/layout.tsx:
1. Fixed sidebar (desktop, 240px wide):
   - Background: #1A1A1A (dark)
   - Top: Stormo.io logo in orange #E8621A
   - Navigation links (use Lucide React icons):
     * Today's Action → /dashboard (Zap icon)
     * My Content → /dashboard/content (FileText icon)
     * Outreach → /dashboard/outreach (Users icon)
     * Campaigns → /dashboard/campaigns (Calendar icon)
     * Milestones → /dashboard/milestones (Trophy icon)
     * Settings → /dashboard/settings (Settings icon)
   - Active nav item: left orange border 3px + white text
   - Inactive: #AAAAAA text, hover white
   - Bottom: user avatar + name + subscription badge (Starter/Growth)
2. Mobile: hamburger button top-left, drawer sidebar slides in
3. Main content area: bg #F5F5F5, padding 24px
4. Ask Stormo floating button placeholder (orange circle, bottom-right, z-50) — full implementation in Section 7

All routing protected by middleware.ts already set up in Section 3.
```

**✅ TEST 5.1:** Login and visit `/dashboard`. You see the dark sidebar with all 6 nav links. Clicking each link changes the URL correctly. On mobile (resize browser to 375px), you see the hamburger menu. The orange floating button placeholder is visible bottom-right.

---

### Prompt 5.2 — Dashboard Home Page Skeleton

**Paste this into your AI IDE:**

```
Build the Stormo.io /dashboard home page skeleton. Reference SRS Section 12.3.

Create app/(dashboard)/dashboard/page.tsx:
1. Quick stats row (3 stat cards):
   - Actions Completed (count from actions table where status='completed')
   - Content Pieces Generated (count from weekly_content table)
   - Outreach Contacts (count from outreach_contacts table)
   - Each card: white bg, border-radius 12px, shadow, orange accent number

2. Streak counter: "X-day streak! Keep it up." — calculate consecutive days with completed actions

3. Progress indicator: "Action X of 30 this month" — count actions this calendar month

4. Today's Action placeholder card: large white card with message "Your action for today is loading..." with orange spinner
   - This card gets replaced with real content in Section 6

All stats fetched via server component using getUserById + DB queries from lib/db/queries.ts
Style using THEME.md — white cards, orange accents, Inter font
```

**✅ TEST 5.2:** Visit `/dashboard` after login. You see 3 stat cards (all zeros for now), streak text, progress text, and the action placeholder card. Page does not crash. No 404 errors.

---

### Prompt 5.3 — Remaining Dashboard Placeholder Pages

**Paste this into your AI IDE:**

```
Create placeholder pages for all dashboard routes so navigation doesn't 404. Reference SRS Section 12.2.

Create these pages with a simple heading and "Coming soon" placeholder layout:
- app/(dashboard)/dashboard/content/page.tsx → "My Content" heading
- app/(dashboard)/dashboard/outreach/page.tsx → "Outreach CRM" heading  
- app/(dashboard)/dashboard/campaigns/page.tsx → "Campaign Planner" heading
- app/(dashboard)/dashboard/milestones/page.tsx → "Milestones" heading

Each page should:
- Have correct page title
- Use the dashboard layout (already applied via layout.tsx)
- Show a white card with the section title and a brief description from SRS of what it will do
- Style consistently with THEME.md
```

**✅ TEST 5.3:** Click all 6 sidebar nav links. Each one loads a page without any 404 error. Each page shows the correct heading.

---

---

# 🤝 SECTION 6 — AI ONBOARDING FLOW

---

### Prompt 6.1 — Onboarding Page Layout + Progress UI

**Paste this into your AI IDE:**

```
Build the Stormo.io AI onboarding page layout. Reference SRS Section 8 and THEME.md.

Create app/(dashboard)/onboarding/page.tsx:

1. Page layout (NOT inside dashboard layout — full page, clean):
   - Left sidebar (desktop, 280px): 5 topic progress steps
     * Each step shows: step number, topic name, status (pending/active/completed)
     * Active step: orange background pill
     * Completed step: orange checkmark
     * Topics: (1) Your Store (2) Products & Pricing (3) Your Customer (4) Your Time (5) Your Challenges
   - Right main area: chat interface (streaming messages)

2. Chat interface:
   - Messages list (scrollable, grows upward)
   - User messages: right-aligned, orange bubble
   - AI messages: left-aligned, white bubble with shadow
   - Input area fixed at bottom: textarea + send button (orange)
   - Placeholder: "Type your message..."
   - Shift+Enter for new line, Enter to send

3. Top of page: "Let's set up your store" heading + "This takes about 10 minutes" subtext

4. On mobile: progress bar at top (5 segments) instead of sidebar

State management: use useState for messages, currentTopic (1-5), topicStatuses
```

**✅ TEST 6.1:** After login + subscribe (test user), visit `/onboarding`. You see the 5-step sidebar. The chat area is visible. The input field works (you can type). Nothing is sent yet — AI connection in next prompt.

---

### Prompt 6.2 — Onboarding Streaming AI Backend

**Paste this into your AI IDE:**

```
Build the AI backend for Stormo.io onboarding. Reference SRS Sections 8.2, 8.3, and 15.2.

1. Create lib/ai/onboarding-chain.ts:
   - Define 5 system prompts, one per onboarding topic:
     * Topic 1: Extract store URL, identify platform, be warm and professional
     * Topic 2: Extract product type and price range
     * Topic 3: Extract ideal customer description
     * Topic 4: Extract weekly_time_available
     * Topic 5: Extract current_challenges
   - Each prompt instructs Claude to: be conversational (not like a form), extract data, signal completion with JSON flag {"topicComplete": true} at the end of the response when topic is done
   - Use getModel() from lib/ai/model.ts (NEVER import ChatAnthropic directly)
   - Export: getOnboardingChain(topicNumber: number, conversationHistory: Message[])

2. Create app/api/onboarding/message/route.ts (POST, streaming):
   - Accept: { message: string, currentTopic: number, conversationHistory: Message[] }
   - Require auth session
   - Call getOnboardingChain() with the right topic prompt
   - Stream response back as Server-Sent Events (SSE)
   - Also: run parallel data extraction (non-streaming LangChain call) to extract JSON fields
   - Save extracted fields to store_profiles table via createStoreProfile()
   - If response contains {"topicComplete": true}: set topicComplete: true in SSE response
   - Advance topic counter in users.onboarding_step

3. Update onboarding/page.tsx to:
   - On send: POST to /api/onboarding/message with message + topic + history
   - Read SSE stream: append tokens to current AI message as they arrive
   - On topicComplete signal: advance progress sidebar
   - On all 5 topics complete: show "Your plan is ready!" + confetti + auto-redirect to /dashboard after 2s
```

**✅ TEST 6.2:** Visit `/onboarding`. Type "Hi" → Send. You see Claude's streaming response appear word by word. Complete Topic 1 by giving a store URL. Check Neon DB: `store_profiles` table has a new row with `store_url` populated. After all 5 topics, you are redirected to `/dashboard` and `users.onboarding_completed = true`.

---

### Prompt 6.3 — Store URL Analysis

**Paste this into your AI IDE:**

```
Implement store URL analysis during Stormo.io onboarding. Reference SRS Section 8.3.

Create lib/ai/store-analyzer.ts:
1. Function: analyzeStoreUrl(url: string, userId: string)
2. Fetch the URL using node-fetch (server-side):
   - Handle errors: timeout 10s, catch Cloudflare blocks, private stores
   - Extract text content (first 3000 chars of meaningful text)
3. Call getModel() (NOT ChatAnthropic directly) with prompt:
   "Analyze this ecommerce store. Extract: (1) primary product category, (2) target customer profile, (3) price positioning (budget/mid/premium), (4) unique selling proposition, (5) niche summary in 2 sentences. Store content: {content}"
4. Save to store_profiles: store_analysis + niche_summary
5. If fetch fails: return gracefully, log warning, don't crash onboarding

Trigger this function from /api/onboarding/message when store_url is first extracted in Topic 1 (run as fire-and-forget — don't await, use .then().catch())
```

**✅ TEST 6.3:** In onboarding Topic 1, provide a real store URL (e.g. any Shopify store). After a few seconds, check Neon DB `store_profiles` table — `store_analysis` and `niche_summary` columns are populated with AI-generated text.

---

---

# ⚡ SECTION 7 — DAILY ACTION ENGINE

---

### Prompt 7.1 — Action Generation API

**Paste this into your AI IDE:**

```
Build the daily action generation system for Stormo.io. Reference SRS Section 9 and Section 16 (repetition prevention).

Create lib/ai/action-generator.ts:
1. Function: generateDailyAction(userId: string): Promise<Action>
2. Call assembleActionContext(userId) from lib/ai/context-assembler.ts (already built)
3. Build the full prompt with context (store profile + coverage map + summaries + recent + near-duplicates)
4. Call getModel() with this prompt (output must be JSON):
   {
     "title": "Short action title",
     "description": "Full action description with step-by-step instructions",
     "content": "Pre-written content ready to paste/use",
     "channel": "reddit|instagram|email|pinterest|etc",
     "action_type": "community|content|outreach|seo|paid_ads"
   }
5. Parse JSON response
6. Generate embedding for the action: use getEmbeddingModel().embedQuery(title + " " + description)
7. Check cosine similarity against past actions (threshold 0.85 from config/constants.ts)
   - If too similar: regenerate once with explicit "Do not generate anything like: [title]" instruction
8. Insert into actions table with scheduled_for = today, status = 'pending', embedding saved
9. Trigger triggerCompressionIfNeeded(userId)
10. Return the saved action

Create app/api/actions/generate/route.ts (POST):
- Require auth + active subscription
- Check if action already exists for today → if yes, return existing action
- If no: call generateDailyAction(userId)
- Return the action JSON
```

**✅ TEST 7.1:** Visit `/dashboard`. Open browser DevTools → Network tab. You see a POST to `/api/actions/generate`. After a few seconds, an action appears in Neon DB `actions` table with today's date, a title, description, content, channel, and embedding (not null). No error in console.

---

### Prompt 7.2 — Today's Action Dashboard Card

**Paste this into your AI IDE:**

```
Build the Today's Action display card for Stormo.io dashboard. Reference SRS Section 9.2 and THEME.md.

Update app/(dashboard)/dashboard/page.tsx to replace the placeholder card:

1. On page load: fetch today's action (GET /api/actions/today)
   - If loading: show orange spinner in card
   - If no action yet: trigger generation (POST /api/actions/generate)
   - Show action once available

2. Action card UI (prominent, large white card with orange top border):
   - Action title: bold 20px, #1A1A1A
   - Channel badge: small orange pill (e.g. "Reddit")
   - Action type badge: gray pill
   - Description: full text with step-by-step instructions
   - Copyable content block: gray bg, monospace, "Copy" button (Clipboard icon)
     * On copy: button changes to "Copied!" for 2 seconds
   - Two action buttons:
     * "✓ Mark Complete" — green/orange, calls PATCH /api/actions/[id]/complete
     * "→ Do This Tomorrow" — secondary outline, calls PATCH /api/actions/[id]/postpone

3. Outcome modal (appears after "Mark Complete"):
   - Title: "How did it go?"
   - 4 options: "Got Traffic" / "Good Engagement" / "No Response" / "Too Difficult"
   - On select: save outcome_signal to action, close modal
   - Also: call updateCoverageMap(userId, channel, signal)

Create the API routes:
- GET /api/actions/today
- PATCH /api/actions/[id]/complete
- PATCH /api/actions/[id]/postpone
```

**✅ TEST 7.2:** Visit `/dashboard`. After a few seconds, the action card shows a real AI-generated action with title, description, and pre-written content. Click "Copy" — the content is in your clipboard. Click "Mark Complete" — outcome modal appears — select an option — action status changes to 'completed' in DB.

---

### Prompt 7.3 — Action History Page

**Paste this into your AI IDE:**

```
Build the action history view for Stormo.io. Reference SRS Section 9.3.

Add an action history section to app/(dashboard)/dashboard/page.tsx (below the main action card):

1. "Action History" section title
2. Fetch last 14 actions (excluding today's) from /api/actions/history
3. Table/list view:
   - Date, action title, channel badge, status badge (color-coded: completed=green, pending=yellow, postponed=gray, skipped=red), outcome signal if set
4. Filter bar above list:
   - Filter by status (all/completed/pending/postponed)
   - Filter by channel (all/reddit/instagram/email/etc)
5. Pagination: show 10 per page, "Load more" button

Create GET /api/actions/history route with query params for filters and pagination.
Style using THEME.md.
```

**✅ TEST 7.3:** After generating and completing a few test actions (you can call the API multiple times), visit `/dashboard`. The history section shows past actions with correct status badges. Filtering by "completed" shows only completed actions.

---

---

# 💬 SECTION 8 — ASK STORMO AI CHAT

---

### Prompt 8.1 — Ask Stormo Floating Button + Chat Panel

**Paste this into your AI IDE:**

```
Build the Ask Stormo floating chat widget for Stormo.io. Reference SRS Section 10 and THEME.md.

1. Create components/dashboard/AskStormo.tsx:
   - Floating button: fixed bottom-right, z-50, 56px circle, bg #E8621A
   - Icon: MessageCircle from lucide-react, white, 24px
   - Label: "Ask Stormo" tooltip on hover
   - State: isOpen (false by default)

2. Chat panel (opens on button click):
   - Desktop: 400px wide × 500px tall, slides up from bottom-right, border-radius 12px top, shadow
   - Mobile: full-screen modal
   - Panel header: "Ask Stormo" title, X close button, orange gradient bar
   - Messages area: scrollable, user messages right (orange bubble), AI left (white card)
   - On first open (no messages): show 3 suggested prompts as clickable buttons:
     * "What should I focus on this week?"
     * "How do I find micro-influencers for my store?"
     * "What's working in my niche?"
   - Input: textarea (2 rows), send button (orange), Enter to send, Shift+Enter new line

3. Add AskStormo component to app/(dashboard)/layout.tsx — render at root level so it appears on every dashboard page

4. On send: POST /api/ask-stormo/message (streaming) — implementation in next prompt
```

**✅ TEST 8.1:** Visit any dashboard page. Orange floating button visible bottom-right. Click it — panel slides up. 3 suggested prompts visible. Close button works. Resize to mobile — panel becomes full screen.

---

### Prompt 8.2 — Ask Stormo AI Streaming Backend

**Paste this into your AI IDE:**

```
Build the Ask Stormo AI backend for Stormo.io. Reference SRS Section 10.3.

1. Create lib/ai/ask-stormo-chain.ts:
   - Function: createAskStormoChain(userId: string, messageHistory: Message[])
   - Fetch store profile for userId from DB
   - Build system prompt (SRS Section 10.3 template):
     "You are Stormo, a friendly expert marketing advisor for [name]'s [product_type] store at [store_url]. Target customer: [target_customer]. Available time: [weekly_time_available] hours/week. Store niche: [niche_summary]. Always give specific, actionable advice tailored to their exact store and situation. Be encouraging, concise, and practical."
   - Build message history: last 20 messages from ask_stormo_messages table (as LangChain HumanMessage/AIMessage)
   - Use getModel() — NEVER import ChatAnthropic directly
   - Return chain configured for streaming

2. Create app/api/ask-stormo/message/route.ts (POST, streaming):
   - Require auth session
   - Accept: { message: string }
   - Save user message to ask_stormo_messages table
   - Fetch last 20 messages from DB for context
   - Stream AI response via SSE
   - After stream completes: save AI response to ask_stormo_messages table

3. Update AskStormo.tsx:
   - On open: GET /api/ask-stormo/history → load last N messages
   - On send: connect to streaming endpoint → show tokens as they arrive
   - Auto-scroll to bottom on new messages
```

**✅ TEST 8.2:** Open Ask Stormo panel. Click a suggested prompt OR type a question. You see the AI response streaming in word by word. The response mentions details about your store (from the profile). Close and reopen the panel — previous conversation is still there.

---

---

# 📧 SECTION 9 — EMAIL SYSTEM

---

### Prompt 9.1 — Nodemailer Setup + Email Templates

**Paste this into your AI IDE:**

```
Set up the Nodemailer email system for Stormo.io. Reference SRS Section 13.

1. Create lib/email/sender.ts:
   - Import nodemailer
   - Create transporter using SMTP env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
   - Export function: sendEmail({ to: string, subject: string, html: string })
   - Include try/catch — if email fails, log error but don't crash the app

2. Create lib/email/templates/ folder with these HTML template files:
   - welcome.html — "Welcome to Stormo! Your store is about to get customers."
   - verify-email.html — "Please verify your email" with {verificationLink} placeholder
   - password-reset.html — "Reset your password" with {resetLink} placeholder
   - subscription-active.html — "You're in! Let's get your first customer." with link to onboarding
   - payment-failed.html — "Action required: your payment failed" with retry link
   - subscription-canceled.html — "Your subscription has ended" with re-subscribe link
   - weekly-content-ready.html — "Your weekly content is ready!" with dashboard link
   - milestone-first-action.html — "First step taken! Keep going."
   - milestone-first-sale.html — "YOU GOT YOUR FIRST SALE! 🎉"

3. Create lib/email/send-templates.ts — export individual typed functions:
   - sendWelcomeEmail(to: string, name: string)
   - sendVerificationEmail(to: string, link: string)
   - sendPasswordResetEmail(to: string, link: string)
   - sendSubscriptionActiveEmail(to: string, name: string)
   - sendPaymentFailedEmail(to: string, retryLink: string)
   - sendWeeklyContentReadyEmail(to: string, name: string)
   - sendMilestoneEmail(to: string, milestone: string, name: string)

All templates: inline CSS, max-width 600px, orange CTA buttons, THEME.md brand colors. One CTA per email.
```

**✅ TEST 9.1:** Add your SMTP credentials to `.env.local`. Run this test in a temporary API route: call `sendWelcomeEmail('your@email.com', 'Test User')`. Check your inbox — you receive the welcome email within 60 seconds. It looks styled (not plain text).

---

### Prompt 9.2 — Wire All Email Triggers

**Paste this into your AI IDE:**

```
Wire up all email triggers throughout Stormo.io. Reference SRS Section 13.2.

Update these existing files to add email sending:

1. app/api/auth/register/route.ts:
   - After user created: call sendWelcomeEmail()
   - After user created: generate verification token (JWT, 24h expiry), call sendVerificationEmail()

2. app/api/auth/forgot-password/route.ts:
   - Replace console.log with real sendPasswordResetEmail() call

3. app/api/stripe/webhook/route.ts — add to existing handlers:
   - customer.subscription.created: call sendSubscriptionActiveEmail()
   - invoice.payment_failed: call sendPaymentFailedEmail() with Stripe portal link
   - customer.subscription.deleted: call sendSubscriptionCanceledEmail()

4. Create lib/milestones/check-milestones.ts:
   - Function: checkAndAwardMilestones(userId: string, event: string)
   - Events: 'action_completed', 'content_viewed', 'outreach_added', 'sale_reported', 'login'
   - Check which milestones are newly achieved
   - Insert into milestones table (if not already there)
   - Send milestone email if email_sent = false
   - Set email_sent = true

5. Call checkAndAwardMilestones() from:
   - PATCH /api/actions/[id]/complete (trigger: 'action_completed')
```

**✅ TEST 9.2:** Register a brand new test email. Check inbox — welcome email arrives. Complete an action on dashboard — in the DB, a milestone row for 'first_action' is inserted with email_sent=true. Check inbox — milestone email received.

---

---

# 📅 SECTION 10 — WEEKLY CONTENT PIPELINE

---

### Prompt 10.1 — Content Generation Jobs (BullMQ)

**Paste this into your AI IDE:**

```
Build the weekly content generation pipeline for Stormo.io. Reference SRS Section 11.

1. Create lib/ai/content-generators.ts:
   - Export 6 async functions, one per content type (SRS Section 11.1):
     * generateInstagramPost(userId, storeProfile)
     * generateRedditPost(userId, storeProfile)
     * generateOutreachEmail(userId, storeProfile)
     * generateProductDescription(userId, storeProfile)
     * generatePinterestPin(userId, storeProfile)
     * generateBlogOutline(userId, storeProfile)
   - Each function: uses getModel() (NEVER import ChatAnthropic directly), tailored prompt, returns { title, content }
   - Each prompt injects: current date, store profile, instruction "Do not repeat angles from previous weeks: {pastTitles}"

2. Create lib/jobs/workers/weekly-content.worker.ts:
   - Job name: "generate-weekly-content"
   - Job data: { userId: string, contentType: string, weekStart: string }
   - Worker: call the matching generator function, save to weekly_content table, update status to 'generated'
   - Retry: 3 times with backoff (1min, 5min, 15min)

3. Create app/api/content/trigger/route.ts (POST, admin-only):
   - Manually trigger content generation for a user (for testing)
   - Enqueue 6 jobs to weeklyContentQueue, one per content type

4. Add cron-like scheduling: create app/api/cron/weekly-content/route.ts
   - Triggered by Vercel Cron (configure in vercel.json)
   - Every Monday 6:00 AM UTC
   - Get all users with active subscription
   - Enqueue 6 jobs per user with 1-second stagger between users
```

**✅ TEST 10.1:** Call POST `/api/content/trigger` with your test userId. Wait ~30 seconds. Check Neon DB `weekly_content` table — 6 rows exist for this week with different content_type values. All have `status = 'generated'`.

---

### Prompt 10.2 — My Content Dashboard Page

**Paste this into your AI IDE:**

```
Build the /dashboard/content page for Stormo.io. Reference SRS Section 11.4 and THEME.md.

Update app/(dashboard)/dashboard/content/page.tsx:

1. This Week's Content section:
   - Heading: "This Week's Content" with current week dates
   - 6 content cards in 2×3 grid (desktop), single column (mobile)
   - Each card: content type icon (Lucide), content type label, title, first 100 chars preview
   - "View & Copy" button (orange outline)

2. View & Copy modal (opens on button click):
   - Full content displayed in scrollable area
   - Large "Copy All" button (orange, copies full content)
   - Copy animation: button changes to "Copied! ✓" for 2 seconds
   - Content type label + date generated

3. Previous Weeks section:
   - Accordion: each past week is a collapsible row
   - Click to expand: shows same 6-card grid for that week

4. If no content generated yet: show "Your content is being generated..." loading state with spinner

Fetch data from GET /api/content?week=current (create this route — returns weekly_content for current week start date)
```

**✅ TEST 10.2:** Visit `/dashboard/content`. You see 6 content cards from the generation test (Prompt 10.1). Click "View & Copy" — full content modal opens. Click "Copy All" — clipboard receives the content. Paste in a text editor to verify.

---

---

# 👥 SECTION 11 — OUTREACH CRM

---

### Prompt 11.1 — Outreach CRM Page

**Paste this into your AI IDE:**

```
Build the Outreach CRM for Stormo.io. Reference SRS Section 12.4 and THEME.md.

Update app/(dashboard)/dashboard/outreach/page.tsx:

1. Table header with stats: total contacts, contacts replied, follow-ups due today (orange badge if > 0)

2. "Add Contact" button (orange) → opens modal with form:
   - Fields: Name, Platform (dropdown: instagram/tiktok/youtube/blog/podcast), Profile URL, Follower Count (optional), Niche Match notes
   - On submit: POST /api/outreach/contacts → insert to outreach_contacts table
   - After save: run checkAndAwardMilestones(userId, 'outreach_added')

3. Contacts table:
   - Columns: Name, Platform badge, Status pipeline badge (color-coded), Follow-up Due (orange if overdue), Actions
   - Status colors: identified=gray, contacted=blue, replied=green, negotiating=yellow, agreed=emerald, declined=red, no_response=gray
   - "Generate Outreach Draft" button per row → POST /api/outreach/generate-draft
   - "Update Status" dropdown per row

4. AI draft generation (POST /api/outreach/generate-draft):
   - Takes contactId, userId
   - Fetches contact + store profile
   - Calls getModel() with prompt: "Write a personalized outreach message to [name] on [platform]. Store: [store details]. Match their niche: [niche_match]. Be genuine, brief, specific. No templates."
   - Saves to outreach_contacts.ai_outreach_draft
   - Shows draft in modal with copy button

Create CRUD API routes: GET/POST /api/outreach/contacts, PATCH /api/outreach/contacts/[id]
```

**✅ TEST 11.1:** Visit `/dashboard/outreach`. Click "Add Contact" — add a test Instagram contact. It appears in the table. Click "Generate Outreach Draft" — after a few seconds, a modal shows an AI-written personalized outreach message. The draft references your store's product type.

---

---

# 📅 SECTION 12 — CAMPAIGNS + MILESTONES

---

### Prompt 12.1 — Seasonal Campaign Planner

**Paste this into your AI IDE:**

```
Build the Seasonal Campaign Planner for Stormo.io. Reference SRS Section 12.5 and THEME.md.

Update app/(dashboard)/dashboard/campaigns/page.tsx:

1. 60-day calendar view (current month + next month):
   - Horizontal scrollable month layout
   - Pre-populated events for next 60 days (hardcode key events relevant to ecommerce):
     July: Independence Day (US), Amazon Prime Day, Back to School starts
     August: Back to School peak, National Dog Day, National Wellness Day
     September: Labor Day (US), Fall season start
     October: Halloween (big ecommerce month), Breast Cancer Awareness Month
   - Each event shown as colored tag on its date
   - Niche-relevant filtering: AI pre-suggests which events matter for the user's store type

2. "Build Campaign" button on each event:
   - Opens modal with event name + date
   - Button: "Generate Campaign Plan" → POST /api/campaigns/generate
   - API: calls getModel() with store profile + event → returns:
     { campaignName, overview, suggestedActions: [3 actions], contentIdeas: [3 ideas] }
   - Shows result in modal with "Save Campaign" button
   - Saved campaigns appear as highlighted on calendar

Create GET /api/campaigns and POST /api/campaigns/generate routes
(Campaigns can be stored in a simple JSON field in store_profiles for MVP — no new table needed)
```

**✅ TEST 12.1:** Visit `/dashboard/campaigns`. You see a 60-day calendar with events marked. Click "Build Campaign" on any event → click "Generate Campaign Plan" → a campaign plan appears with 3 action suggestions specific to your store type.

---

### Prompt 12.2 — Milestones Page + Confetti

**Paste this into your AI IDE:**

```
Build the Milestones page for Stormo.io. Reference SRS Section 12.6 and THEME.md.

1. Update app/(dashboard)/dashboard/milestones/page.tsx:
   - Page title: "Your Progress" with subtitle
   - Achievement grid: all milestone_keys from SRS Section 12.6 as cards
     * Achieved: orange card with trophy icon, checkmark, achievement date
     * Not achieved: gray card with lock icon, description of how to unlock
   - Milestone cards: first_action, first_week, first_content, first_outreach, first_sale, ten_sales, thirty_days, ninety_days, first_influencer_deal
   - "Report a Sale" button: opens modal → user enters approximate sale amount (optional) → POST /api/milestones/report-sale
     * This increments users.total_sales
     * Triggers milestone check for first_sale and ten_sales
     * If total_sales >= 10: shows Growth upgrade notification card

2. Confetti trigger: create components/dashboard/MilestoneConfetti.tsx:
   - Checks session/localStorage for 'pendingConfetti' flag
   - If first_sale just achieved: fires canvas-confetti full-screen for 3 seconds
   - Import: import confetti from 'canvas-confetti'
   - Add to dashboard/page.tsx (check on load if first_sale milestone is newly achieved)

3. Create POST /api/milestones/report-sale route
```

**✅ TEST 12.2:** Visit `/dashboard/milestones`. You see the grid of milestones (first_action should be achieved from earlier tests — orange card). Click "Report a Sale" → submit → check DB: `users.total_sales` incremented. If you report 10 sales, the Growth upgrade notification appears.

---

---

# 📝 SECTION 13 — BLOG

---

### Prompt 13.1 — Blog System + Initial Posts

**Paste this into your AI IDE:**

```
Build the Blog for Stormo.io. Reference SRS Section 14 and THEME.md.

1. Create app/(public)/blog/page.tsx (listing page):
   - Public page (no auth required)
   - Navbar same as homepage (build basic version — full homepage later)
   - Heading: "The Stormo Blog" / subtitle: "Marketing tactics for ecommerce store owners"
   - Grid of post cards: title, excerpt, date, "Read More" link
   - Fetch from blog_posts table where published = true, order by published_at DESC
   - SEO: <title>, <meta description> in generateMetadata()

2. Create app/(public)/blog/[slug]/page.tsx (individual post):
   - Fetch post by slug from DB
   - Render content as markdown (use react-markdown)
   - SEO: og:title, og:description, og:image from post fields
   - Social share buttons: Twitter, LinkedIn (plain links)
   - Mid-post CTA banner: "Ready to get your first customers? Start for $9" → /register
   - End-of-post CTA: same

3. Create app/api/sitemap.xml/route.ts → returns XML with all published post URLs

4. Create app/robots.txt/route.ts → allow all crawlers

5. Seed 4 initial blog posts via a seed script (create scripts/seed-blog.ts):
   - Run with: npx tsx scripts/seed-blog.ts
   - Insert the 4 posts from SRS Section 14.3 with lorem ipsum content bodies for now
   - Set published = true, published_at = NOW()
```

**✅ TEST 13.1:** Visit `http://localhost:3000/blog`. You see 4 blog posts listed. Click one — you see the full post page with CTA banners. Visit `/sitemap.xml` — all 4 post URLs appear in the XML. Visit `/robots.txt` — shows "Allow: /".

---

---

# 🏠 SECTION 14 — HOMEPAGE

---

### Prompt 14.1 — Homepage Navbar + Hero Section

**Paste this into your AI IDE:**

```
Build the Stormo.io homepage Navbar and Hero section. Reference SRS Sections 5.1, 5.2 and THEME.md exactly.

Update app/(public)/page.tsx and create components/homepage/ files:

1. Create components/homepage/Navbar.tsx:
   - Fixed position, full width
   - Left: "Stormo.io" text in #E8621A, font-bold
   - Center: two links "How It Works" and "Pricing" with smooth scroll (#how-it-works, #pricing)
   - Right: "Start for $9" CTA button — orange bg, white text, rounded
   - On scroll (use useEffect + window.scrollY > 50): bg transitions to #1A1A1A with shadow
   - Mobile: hamburger icon (Menu from lucide-react), drawer shows links + CTA
   - CTA NEVER hidden on mobile

2. Create components/homepage/HeroSection.tsx:
   - Background: #1A1A1A with subtle orange geometric SVG accent (low opacity abstract shapes)
   - Headline: "You Built The Store. Where Are The Customers?" — 56-64px, weight 800, white
   - Subheadline: "Stormo is your AI marketing manager — working beside you every single day." — 18-20px, #AAAAAA, max-w-2xl centered
   - Supporting line: "One action a day. Content written. Outreach managed. Campaigns planned." — 16px, lighter
   - CTA Button: "Start Getting Customers — First Month $9" — large orange, white text, 14px 32px padding
   - Trust line below: "$9 first month. Then $29/month. Cancel anytime. Works with every store platform." — 13px #666666
   - Center everything, generous vertical padding (120px)

Add both to app/(public)/page.tsx
```

**✅ TEST 14.1:** Visit `http://localhost:3000`. You see the dark hero with the white headline. Scroll down — navbar background turns dark. On mobile, hamburger opens menu. CTA button visible at all times.

---

### Prompt 14.2 — Homepage Sections: Pain + How It Works + Features

**Paste this into your AI IDE:**

```
Build homepage sections 2, 3, and 4 for Stormo.io. Reference SRS Sections 5.3, 5.4, 5.5 and THEME.md.

1. Create components/homepage/PainSection.tsx (SRS 5.3):
   - Background #FFFFFF
   - Headline: "Are You Experiencing This?" centered, 36px bold
   - Two-column card layout (stacked mobile):
     * LEFT "Without Stormo": 5 pain bullets with ✗ in red (#DC2626)
       - "Posting to nobody and wondering if it's working"
       - "Afraid to spend on ads without knowing if they'll work"
       - "Writing the same type of content over and over"
       - "No idea which channels are worth your time"
       - "Watching your store sit empty for months"
     * RIGHT "With Stormo": 5 solutions with ✓ in orange (#E8621A)
       - "One specific action to take every single day"
       - "Content written and ready to post"
       - "Know exactly which channels are working for your niche"
       - "Influencer outreach managed and followed up"
       - "A plan that adapts as your store grows"

2. Create components/homepage/HowItWorksSection.tsx (SRS 5.4):
   - id="how-it-works" for smooth scroll
   - Background #F5F5F5
   - 3 steps with large orange number, bold title, 2-sentence description
   - Connecting arrow between steps (desktop only — CSS)

3. Create components/homepage/FeaturesSection.tsx (SRS 5.5):
   - Background #FFFFFF
   - 6 feature cards in 3×2 grid with Lucide icons (orange)
   - Cards: Stop Guessing / Stop Writing Content / Ideal Customer / Influencer Outreach / Never Miss Opportunity / Graduate to Paid Ads

Add all three to app/(public)/page.tsx
```

**✅ TEST 14.2:** Homepage shows all three sections below the hero. Pain section has two columns. How It Works has 3 numbered steps. Features shows 6 cards. All orange styling matches THEME.md.

---

### Prompt 14.3 — Homepage: Comparison Table + Pricing + Social Proof + Footer

**Paste this into your AI IDE:**

```
Build the remaining homepage sections for Stormo.io. Reference SRS Sections 5.6–5.10 and THEME.md.

1. Create components/homepage/ComparisonSection.tsx (SRS 5.6):
   - Background #F5F5F5
   - Headline: "Why Stormo Beats Every Alternative"
   - Table: Stormo vs DIY vs Paid Ads vs Freelancer vs Generic AI
   - Orange header row, Stormo column highlighted in #FDF0E8
   - Checkmarks (✓ orange) and dashes (—) for features

2. Create components/homepage/PricingSection.tsx (SRS 5.7):
   - id="pricing" for smooth scroll
   - Background #FFFFFF
   - STARTER card (light gray bg): crossed-out $29, "$9 first month" large, then $29/month after, feature list with orange checkmarks, CTA button
   - GROWTH card (#1A1A1A bg, orange top border 3px): $39/month white text, "Unlocks when you hit 10 sales", feature list in white
   - CRITICAL: prices must match SRS exactly

3. Create components/homepage/SocialProofSection.tsx (SRS 5.8):
   - Background #1A1A1A
   - Founder quote centered italic white
   - 3 dark stat cards with orange top borders: 26M stores / 90% fail / $1,500+ agency cost
   - CTA button: "Start For $9 — See It Work Before You Commit"

4. Create components/homepage/FinalCTASection.tsx (SRS 5.9):
   - Full-width #E8621A orange band, 80-120px vertical padding
   - Headline: "Your Store Deserves Customers" — white, 48px bold
   - White button with orange text

5. Create components/homepage/Footer.tsx (SRS 5.10):
   - Background #1A1A1A, orange top border 2px
   - Logo + "Momentum for your store." tagline
   - Link columns: Product / Company / Support
   - Bottom: copyright line

Add all to app/(public)/page.tsx
```

**✅ TEST 14.3:** Full homepage is visible with all 10 sections. Smooth scroll works on "How It Works" and "Pricing" nav links. Pricing shows $9/$29/$39 correctly. Footer links are present. Page looks professional.

---

### Prompt 14.4 — Homepage Performance Optimization

**Paste this into your AI IDE:**

```
Optimize the Stormo.io homepage for performance. Reference SRS Section 5.11.

1. All images: use Next.js <Image> component with width/height/priority props
2. Hero section image (if any): add priority={true}
3. Below-fold images: add loading="lazy" (default in Next.js Image)
4. Remove any unused JavaScript imports from homepage components
5. Add generateMetadata() to app/(public)/page.tsx:
   - title: "Stormo.io — AI Marketing for Ecommerce Store Owners"
   - description: "One daily action. Content written. Customers growing. Start for $9."
   - og:title, og:description, og:image (use /og-image.png placeholder)
6. Create app/icon.ico placeholder (or use a simple orange square as favicon)
7. Run Lighthouse in Chrome DevTools on the homepage
8. Fix any issues that score below 80 on Performance or Accessibility
```

**✅ TEST 14.4:** Run Lighthouse on `localhost:3000`. Performance score ≥ 80. No horizontal scroll at 375px mobile width. Page title in browser tab shows "Stormo.io — AI Marketing for Ecommerce Store Owners".

---

---

# 🔧 SECTION 15 — FINAL INTEGRATION & TESTING

---

### Prompt 15.1 — Wire Onboarding → Dashboard Redirect

**Paste this into your AI IDE:**

```
Ensure the complete Stormo.io user journey flow works end-to-end. Reference SRS Section 17 (Development Sequence).

Verify and fix these flow connections:
1. Register (/register) → /pricing (no auth redirect needed, just page link)
2. Subscribe on /pricing → Stripe checkout → success → /onboarding (set in checkout success_url)
3. Onboarding completes → users.onboarding_completed = true → redirect to /dashboard
4. Login (/login) → if onboarding_completed=false and subscription active → /onboarding
5. Login → if onboarding_completed=true → /dashboard
6. Middleware: /dashboard/* requires session + active subscription (already done in 3.1 — verify it still works)

Update middleware.ts to handle the onboarding check:
- If session exists + subscription active + onboarding_completed=false → redirect to /onboarding
- If session exists + subscription active + onboarding_completed=true → allow /dashboard/* access

Test the complete user journey manually.
```

**✅ TEST 15.1:** Create a brand new test user. Full journey: Register → subscribe (test card) → redirected to /onboarding → complete all 5 topics → redirected to /dashboard → today's action appears. Refresh dashboard — stays on dashboard. Log out, log back in — goes to /dashboard (not /onboarding again).

---

### Prompt 15.2 — Run Full 35-Item Acceptance Checklist

**Paste this into your AI IDE:**

```
Run the complete Stormo.io acceptance checklist from SRS Section 18.2. Go through all 35 items.

For each item that fails, identify the issue and fix it. Report which items pass and which fail.

Here is the full 35-item checklist from the SRS — run each one:
[The AI should reference SRS Section 18.2 — all 35 items listed there]

Focus especially on:
- Item 3: Pricing shows $9/$29/$39 exactly
- Item 8: Unauthenticated /dashboard access → /login
- Item 21: 50 actions for same user, no two exceed 0.85 cosine similarity
- Item 22: Ask Stormo visible on ALL dashboard pages
- Item 30: First sale confetti fires
- Item 35: No horizontal scroll at 375px

For any item that cannot be tested yet (like item 5/6 Apple Sign-In which needs Apple Developer account), mark as PENDING and document why.
```

**✅ TEST 15.2:** You have a written list of all 35 items marked PASS, FAIL (with fix applied), or PENDING (with reason). At minimum 30 of 35 items pass.

---

### Prompt 15.3 — Mobile Responsive QA

**Paste this into your AI IDE:**

```
Run mobile responsive QA for all Stormo.io pages. Reference SRS Section 5.11 and THEME.md breakpoints.

Test at these exact widths: 375px (iPhone SE), 768px (iPad), 1280px (Desktop)

Fix any issues found at each breakpoint for these pages:
1. Homepage (/) — all 10 sections
2. /register and /login — form cards
3. /onboarding — chat interface + progress sidebar
4. /dashboard — stats cards + action card + sidebar/mobile nav
5. /dashboard/content — 6 content cards grid
6. /dashboard/outreach — contacts table
7. /dashboard/milestones — achievement grid
8. /blog — post listing grid
9. /blog/[slug] — post content

Rules from THEME.md:
- Mobile < 768px: single column, no horizontal scroll
- Tablet 768-1024px: max 2 columns
- Desktop > 1024px: full layout, max-width 1280px
- Hamburger nav on mobile everywhere (dashboard + homepage)
- Ask Stormo on mobile: full-screen modal
```

**✅ TEST 15.3:** Open Chrome DevTools → toggle device toolbar → test at 375px. No horizontal scrollbar on any page. All content readable. All buttons tappable (≥44px touch target). Hamburger menu works on dashboard AND homepage.

---

---

# 🚀 SECTION 16 — DEPLOYMENT

---

### Prompt 16.1 — Vercel Deployment Setup

**Paste this into your AI IDE:**

```
Set up Stormo.io for production deployment on Vercel. Reference SRS Section 19.2.

1. Initialize Git repository if not done:
   git init
   git add .
   git commit -m "Initial Stormo.io build"

2. Push to GitHub:
   - Create new private repo on GitHub: stormo-app
   - git remote add origin https://github.com/YOUR_USERNAME/stormo-app.git
   - git push -u origin main

3. Create vercel.json in project root:
   {
     "crons": [
       { "path": "/api/cron/weekly-content", "schedule": "0 6 * * 1" }
     ]
   }

4. Guide me through Vercel deployment:
   - Go to vercel.com → New Project → Import from GitHub → select stormo-app
   - Framework: Next.js (auto-detected)
   - Add ALL environment variables from .env.local (production values, not test)
   - Deploy

5. After deployment:
   - Add custom domain stormo.io in Vercel → Settings → Domains
   - In Porkbun DNS: add CNAME record pointing to Vercel's cname

6. Add production redirect URI in Google OAuth console:
   https://stormo.io/api/auth/callback/google

7. In Stripe: add production webhook endpoint:
   https://stormo.io/api/stripe/webhook
   Copy new webhook secret → update STRIPE_WEBHOOK_SECRET in Vercel env vars
```

**✅ TEST 16.1:** Visit `https://stormo.io` (or your Vercel deployment URL). Homepage loads. Register a new user. Stripe checkout works in live mode (use a real card for final test OR keep in test mode during QA).

---

---

# 💳 STRIPE SETUP GUIDE (Separate Reference)

> Complete this guide during **ACC-4** (before any coding). Reference it again during **Section 4** prompts.

## Step 1: Create Stripe Account
- Go to stripe.com → Sign up with business email
- Complete business verification (can do later, but needed for live payments)

## Step 2: Understand Test vs Live Mode
- **Test Mode** (toggle top-right): safe for development — use card `4242 4242 4242 4242`, any expiry, any CVC
- **Live Mode**: real money — switch only when going to production
- Keep Test Mode for ALL development

## Step 3: Create Products & Prices
In Stripe Dashboard → **Products** tab:

**Product 1: Stormo Starter**
- Name: "Stormo Starter"
- Add Price 1: $9.00 → Recurring → Monthly → Save → copy Price ID → `STRIPE_PRICE_STARTER_INTRO`
- Add Price 2: $29.00 → Recurring → Monthly → Save → copy Price ID → `STRIPE_PRICE_STARTER`

**Product 2: Stormo Growth**
- Name: "Stormo Growth"
- Add Price: $39.00 → Recurring → Monthly → Save → copy Price ID → `STRIPE_PRICE_GROWTH`

## Step 4: Handle the $9 Intro Price
The $9 intro price has two approaches. Use **Approach A** (simpler):

**Approach A: Stripe Coupon**
- Go to **Billing → Coupons → Create coupon**
- Amount off: $20 | Duration: once | Name: "Intro Discount"
- Apply this coupon to the Checkout Session in your code:
  ```js
  discounts: [{ coupon: 'COUPON_ID' }]
  ```
- User pays $9 first month, $29 from month 2 automatically

## Step 5: Set Up Webhooks (Development)
- Install Stripe CLI: `npm install -g stripe` then `stripe login`
- Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- This prints a webhook secret starting with `whsec_...` → copy to `STRIPE_WEBHOOK_SECRET` in `.env.local`
- This runs in a separate terminal window while you develop

## Step 6: Set Up Webhooks (Production — after deployment)
- Stripe Dashboard → **Developers → Webhooks → Add endpoint**
- Endpoint URL: `https://stormo.io/api/stripe/webhook`
- Events to select:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- After creating: copy the **Signing secret** → update `STRIPE_WEBHOOK_SECRET` in Vercel env vars

## Test Cards (Test Mode Only)
| Scenario | Card Number |
|---|---|
| Successful payment | 4242 4242 4242 4242 |
| Payment declined | 4000 0000 0000 0002 |
| Requires authentication | 4000 0025 0000 3155 |

Use any future expiry date and any 3-digit CVC.

---

---

# ✅ FINAL CHECKLIST REPORT

> Use this to verify every feature has been built before going live.

| Feature | SRS Section | Prompt(s) | Status |
|---------|------------|-----------|--------|
| Neon DB + Drizzle setup | §4 | 1.1, 1.2, 1.3 | ☐ |
| All 10 DB tables created | §4 | 1.2, 1.3 | ☐ |
| DB query helpers | §4 | 1.4 | ☐ |
| LangChain model factory | §3.3, §15 | 2.1 | ☐ |
| Repetition prevention context assembler | §16 | 2.2 | ☐ |
| BullMQ compression job | §16.4 | 2.3 | ☐ |
| NextAuth.js configuration | §6 | 3.1 | ☐ |
| Route protection middleware | §6.5 | 3.1 | ☐ |
| Register page + API | §6.1 | 3.2 | ☐ |
| Login page | §6.2 | 3.3 | ☐ |
| Google OAuth | §6.3 | 3.1, 3.3 | ☐ |
| Forgot/Reset password | §6.4 | 3.4 | ☐ |
| Stripe checkout flow | §7.2 | 4.1 | ☐ |
| Stripe webhook handler | §7.3 | 4.2 | ☐ |
| Subscription management (cancel/upgrade) | §7.4 | 4.3 | ☐ |
| Dashboard layout + sidebar | §12.1, §12.2 | 5.1 | ☐ |
| Dashboard home stats | §12.3 | 5.2 | ☐ |
| All 6 dashboard routes | §12.2 | 5.3 | ☐ |
| Onboarding page UI | §8.1, §8.4 | 6.1 | ☐ |
| AI onboarding streaming | §8.3 | 6.2 | ☐ |
| Store URL analysis | §8.3 | 6.3 | ☐ |
| Daily action generation (with repetition prevention) | §9, §16 | 7.1 | ☐ |
| Today's action card (Mark Complete / Postpone) | §9.2 | 7.2 | ☐ |
| Outcome modal + coverage map update | §9.2, §16.3 | 7.2 | ☐ |
| Action history list + filters | §9.3 | 7.3 | ☐ |
| Ask Stormo floating button + chat UI | §10.1 | 8.1 | ☐ |
| Ask Stormo AI streaming + store context | §10.3 | 8.2 | ☐ |
| Ask Stormo chat history persistence | §10.2 | 8.2 | ☐ |
| Nodemailer setup + all email templates | §13.1, §13.2 | 9.1 | ☐ |
| All email triggers wired | §13.2 | 9.2 | ☐ |
| Milestone detection + milestone emails | §12.6 | 9.2, 12.2 | ☐ |
| BullMQ weekly content workers | §11.2 | 10.1 | ☐ |
| Weekly cron job setup | §11.2 | 10.1 | ☐ |
| My Content page + copy | §11.4 | 10.2 | ☐ |
| Outreach CRM page + add contact | §12.4 | 11.1 | ☐ |
| Outreach AI draft generation | §12.4 | 11.1 | ☐ |
| Seasonal Campaign Planner | §12.5 | 12.1 | ☐ |
| Milestones page + confetti | §12.6 | 12.2 | ☐ |
| Blog listing + post pages | §14 | 13.1 | ☐ |
| sitemap.xml + robots.txt | §14.4 | 13.1 | ☐ |
| 4 seed blog posts | §14.3 | 13.1 | ☐ |
| Homepage Navbar + Hero | §5.1, §5.2 | 14.1 | ☐ |
| Homepage Pain + How It Works + Features | §5.3–5.5 | 14.2 | ☐ |
| Homepage Comparison + Pricing + Social Proof + Footer | §5.6–5.10 | 14.3 | ☐ |
| Homepage SEO meta + performance | §5.11 | 14.4 | ☐ |
| Full user journey flow | §17 | 15.1 | ☐ |
| 35-item acceptance checklist | §18.2 | 15.2 | ☐ |
| Mobile responsive QA | §5.11 | 15.3 | ☐ |
| Vercel deployment + DNS | §19.2 | 16.1 | ☐ |
| Stripe production webhooks | §19.2 | 16.1 + Stripe Guide | ☐ |
| All env vars in Vercel dashboard | §19.1 | 16.1 | ☐ |

---

**Total Prompts: 47 build prompts + 6 account setup steps + Stripe Guide**

> 🎉 When all checkboxes are ticked, Stormo.io is ready for launch at stormo.io
