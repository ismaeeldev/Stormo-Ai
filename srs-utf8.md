__STORMO\.IO__

__Software Requirements Specification__

*AI\-Powered Customer Acquisition SaaS Platform*

__Field__

__Detail__

Version

1\.0

Date

June 2026

Tech Stack

Next\.js \(Full\-Stack\) \+ Express API Layer

AI Engine

LangChain \+ LangGraph \(model\-agnostic\)

Database

PostgreSQL \(Neon\) \+ pgvector

Status

Draft for Development

# __Table of Contents__

__Section 1 ΓÇö Theme & Design System__

Section 2 ΓÇö Project Overview & Purpose

Section 3 ΓÇö Tech Stack & Architecture

Section 4 ΓÇö Database Schema

Section 5 ΓÇö Module 01: Homepage \(Public Site\)

Section 6 ΓÇö Module 02: Authentication

Section 7 ΓÇö Module 03: Stripe Subscriptions & Billing

Section 8 ΓÇö Module 04: Conversational AI Onboarding

Section 9 ΓÇö Module 05: Daily Action Engine

Section 10 ΓÇö Module 06: Ask Stormo \(AI Chat Assistant\)

Section 11 ΓÇö Module 07: Weekly Content Generation Pipeline

Section 12 ΓÇö Module 08: User Dashboard

Section 13 ΓÇö Module 09: Email Automation \(Nodemailer\)

Section 14 ΓÇö Module 10: Blog

Section 15 ΓÇö AI Model Configuration \(LangChain/LangGraph\)

Section 16 ΓÇö Repetition Prevention Architecture

Section 17 ΓÇö Development Sequence & Milestones

Section 18 ΓÇö Testing Requirements

Section 19 ΓÇö Deployment & Infrastructure

# __Section 1 ΓÇö Theme & Design System__

This section must be read before writing any frontend code\. Every UI component, page, and section must follow this theme exactly\. Consistency is critical for brand trust\.

## __1\.1 Brand Identity__

__Token__

__Value__

__Usage__

Primary Orange

\#E8621A

CTAs, logos, headings, icons, borders, checkmarks

Dark Background

\#1A1A1A

Hero section, footer, dark cards, navbar \(on scroll\)

White

\#FFFFFF

Section backgrounds, card backgrounds, button text on orange

Light Gray BG

\#F5F5F5

Alternate section backgrounds \(How It Works, Why Stormo\)

Body Text

\#1A1A1A

All body copy, default text

Muted Gray

\#AAAAAA

Subheadlines, secondary text

Subtle Gray

\#666666

Trust lines, captions, footer sub\-text

Light Orange Tint

\#FDF0E8

Table highlight column, card hover bg, subtle accent

Orange Border

\#E8621A at 2px

Card top borders, section dividers, Growth pricing card

## __1\.2 Typography__

__Element__

__Font__

__Size \(Desktop\)__

__Size \(Mobile\)__

__Weight__

__Color__

Primary Font

Inter \(Google Fonts\)

All sizes

All sizes

Variable

Per context

Hero Headline

Inter

56ΓÇô64px

36ΓÇô40px

800 Black

\#FFFFFF

Section Headline

Inter

36ΓÇô40px

28ΓÇô32px

700 Bold

\#1A1A1A

Sub\-headline

Inter

18ΓÇô20px

16ΓÇô18px

400 Regular

\#AAAAAA

Body Copy

Inter

16ΓÇô18px

15ΓÇô16px

400 Regular

\#1A1A1A

Card Title

Inter

18ΓÇô20px

17ΓÇô18px

600 SemiBold

\#1A1A1A

Card Body

Inter

14ΓÇô16px

14ΓÇô15px

400 Regular

\#666666

Button Text

Inter

16ΓÇô18px

15ΓÇô16px

600 SemiBold

\#FFFFFF

Nav Links

Inter

15ΓÇô16px

14px

500 Medium

\#AAAAAA

Trust Lines

Inter

12ΓÇô13px

12px

400 Regular

\#666666

Footer Text

Inter

13ΓÇô14px

13px

400 Regular

\#AAAAAA

## __1\.3 Component Tokens__

### __Buttons__

__Variant__

__Background__

__Text__

__Border Radius__

__Padding__

__Hover__

Primary CTA \(Orange\)

\#E8621A

\#FFFFFF

8px

14px 28px

darken 10% \(\#C4531A\)

Primary CTA \(White\)

\#FFFFFF

\#E8621A

8px

14px 28px

bg \#FDF0E8

Secondary Outline

transparent

\#E8621A

8px

12px 24px

bg \#FDF0E8

Nav CTA

\#E8621A

\#FFFFFF

6px

10px 20px

darken 10%

Destructive

\#DC2626

\#FFFFFF

8px

12px 24px

darken 10%

### __Cards__

- White background, subtle box\-shadow: 0 2px 12px rgba\(0,0,0,0\.08\)
- Border radius: 12px
- Padding: 24px
- Optional: orange top border 3px for highlighted/featured cards
- Hover state: shadow deepens, slight translateY\(\-2px\) transform

### __Spacing Scale__

__Name__

__Value__

__Usage__

xs

4px

Icon gaps, small inline spacing

sm

8px

Button icon gaps, tight list items

md

16px

Card inner padding \(tight\), list item spacing

lg

24px

Card padding, section inner spacing

xl

48px

Between sub\-sections

2xl

80px

Section top/bottom padding \(desktop\)

3xl

120px

Hero vertical padding

## __1\.4 Icons__

- Library: Lucide React \(open source, tree\-shakeable\)
- Size: 24px default, 20px in cards, 18px inline
- Color: always \#E8621A for accent icons, \#1A1A1A for neutral icons

## __1\.5 Responsive Breakpoints__

__Breakpoint__

__Width__

__Rule__

Mobile

< 768px

Single column, stacked layout, hamburger nav

Tablet

768px ΓÇô 1024px

Two column max, reduced hero padding

Desktop

> 1024px

Full multi\-column, max\-width 1280px container

# __Section 2 ΓÇö Project Overview & Purpose__

## __2\.1 What Is Stormo\.io?__

Stormo\.io is an AI\-powered customer acquisition SaaS platform built for new ecommerce store owners\. The core problem it solves: most new store owners spend months guessing how to get customers ΓÇö posting to nobody, afraid of ad costs, watching their store sit empty\. Stormo acts as an always\-available AI marketing manager that works beside the user every single day\.

The platform guides users from zero customers to consistent weekly growth through:

- Daily AI\-generated marketing actions ΓÇö one specific action per day, written and ready to execute
- Automated weekly content generation ΓÇö social posts, outreach emails, product descriptions
- Influencer outreach management ΓÇö finds micro\-influencers, writes outreach, manages follow\-ups
- Seasonal campaign planning ΓÇö 60\-day lookahead, never scrambling for upcoming events
- Ask Stormo assistant ΓÇö persistent AI chat for any marketing question, always aware of the user's store
- Competitor intelligence ΓÇö monitors what similar stores are doing
- Milestone system ΓÇö celebrates wins, motivates progress toward first sale

## __2\.2 Target Users__

- New ecommerce store owners \(Shopify, WooCommerce, Etsy, any platform\)
- Zero to low advertising budget \($0ΓÇô$50/month\)
- Limited time ΓÇö need focused daily actions, not strategy documents
- No prior marketing experience required

## __2\.3 Product Goals__

1. Validate that users return daily \(engagement metric\)
2. Validate that users complete daily actions \(retention metric\)
3. Validate willingness to pay $29/month after first month at $9
4. Build a scalable AI platform that never becomes repetitive

## __2\.4 Success Metrics \(Phase 1 MVP\)__

__Metric__

__Target__

Day\-7 retention

> 40% of registered users

Action completion rate

> 50% of daily actions marked complete

Starter\-to\-paid conversion

> 25% convert past first month

Ask Stormo queries/user/week

> 3

Content downloads/week

> 2 per active user

# __Section 3 ΓÇö Tech Stack & Architecture__

## __3\.1 Architecture Decision__

The entire application lives in a single Next\.js monorepo\. The Express API runs as Next\.js API routes \(or as a standalone Express server in the same repo, co\-deployed\)\. This keeps deployment simple, avoids CORS complexity in development, and allows sharing TypeScript types between frontend and backend\.

## __3\.2 Technology Stack__

__Layer__

__Technology__

__Purpose__

__Why__

Frontend

Next\.js 14\+ \(App Router\)

All UI pages, streaming AI responses, SSR/SSG

Server components \+ streaming \+ single deploy

API Layer

Express\.js \(inside Next\.js API routes\)

All backend routes, business logic, AI orchestration

Lightweight, familiar, easily testable

AI Orchestration

LangChain \+ LangGraph

Model\-agnostic AI routing, memory, chains, agents

Single config change to swap Claude/GPT/Haiku/Opus

LLM

Claude API via LangChain \(default: claude\-sonnet\)

All AI features

Configurable per environment variable

Database

PostgreSQL on Neon \(serverless\)

All persistent data storage

Serverless, scales to zero, pgvector built\-in

Vector Search

pgvector extension on PostgreSQL

Semantic similarity for AI repetition prevention

No extra service needed, lives in same DB

ORM

Drizzle ORM \(or Prisma\)

Type\-safe DB queries

TypeScript native, great with Neon

Cache / Queue

Redis \(Upstash\) \+ BullMQ

Background jobs, weekly content pipeline, rate limiting

Serverless Redis, BullMQ for reliable job queues

Auth

NextAuth\.js v5

Email/password, Google OAuth, Apple Sign\-In

Built\-in session management, Next\.js native

Payments

Stripe

Subscription billing, webhooks, cancellation

Industry standard, webhook\-driven

Email

Nodemailer \(free, self\-hosted\)

Transactional emails, milestone triggers, digests

Free, no third\-party dependency, SMTP\-based

Styling

Tailwind CSS

All UI styling

Utility\-first, consistent design tokens

Hosting

Vercel \(frontend \+ API routes\)

Global CDN, edge functions, CI/CD

Optimal for Next\.js, zero\-config deploy

Domain

Porkbun

DNS management for stormo\.io

Already registered

## __3\.3 AI Model Configuration \(Critical ΓÇö Client Requirement\)__

The AI integration must NEVER hardcode a model name anywhere in the codebase\. The model is set via environment variable and consumed through a single LangChain factory function\.

### __Environment Variable Setup__

__In \.env\.local:__

AI\_MODEL=claude\-sonnet\-4\-20250514

AI\_PROVIDER=anthropic  \# or "openai" or "openrouter"

### __LangChain Model Factory Pattern__

__Create ONE file: /lib/ai/model\.ts__

import \{ ChatAnthropic \} from "@langchain/anthropic";
import \{ ChatOpenAI \} from "@langchain/openai";

export function getModel\(\) \{
  const provider = process\.env\.AI\_PROVIDER || "anthropic";
  const model = process\.env\.AI\_MODEL || "claude\-sonnet\-4\-20250514";
  if \(provider === "openai"\) return new ChatOpenAI\(\{ model \}\);
  return new ChatAnthropic\(\{ model \}\); // default
\}

Every AI call in the entire codebase calls getModel\(\)\. Switching from Sonnet to Haiku to Opus is ONE environment variable change\. No code changes needed\.

__≡ƒÆí Note: __*When switching to Haiku for cost, set AI\_MODEL=claude\-haiku\-4\-5\-20251001\. For Opus: AI\_MODEL=claude\-opus\-4\-6\. For OpenAI GPT\-4o: AI\_PROVIDER=openai, AI\_MODEL=gpt\-4o\.*

## __3\.4 Project Folder Structure__

__/stormo\-app__

- /app                    ΓÇö Next\.js App Router pages
-   /app/\(public\)         ΓÇö Homepage, pricing, blog \(no auth required\)
-   /app/\(auth\)           ΓÇö Login, register, forgot password
-   /app/\(dashboard\)      ΓÇö All protected dashboard pages
-   /app/api              ΓÇö Express API routes \(Next\.js API handlers\)
- /lib                    ΓÇö Shared utilities
-   /lib/ai               ΓÇö LangChain model factory, chains, agents
-   /lib/db               ΓÇö Drizzle ORM schema and queries
-   /lib/jobs             ΓÇö BullMQ job definitions
-   /lib/email            ΓÇö Nodemailer templates and sender
- /components             ΓÇö React components
-   /components/ui        ΓÇö Shadcn/Radix primitives
-   /components/dashboard ΓÇö Dashboard\-specific components
-   /components/homepage  ΓÇö Homepage sections
- /config                 ΓÇö AI model config, constants
- \.env\.local              ΓÇö Environment variables \(never committed\)

# __Section 4 ΓÇö Database Schema__

All tables live in PostgreSQL on Neon\. The pgvector extension is enabled for vector similarity search\. Use Drizzle ORM for all queries\. Relations are described below each table\.

## __4\.1 users Table__

__Column__

__Type__

__Constraints__

__Description__

id

UUID

PRIMARY KEY, DEFAULT gen\_random\_uuid\(\)

Unique user identifier

email

VARCHAR\(255\)

UNIQUE, NOT NULL

User email address

password\_hash

VARCHAR\(255\)

NULLABLE

Bcrypt hash, null for OAuth users

name

VARCHAR\(255\)

NULLABLE

Display name

avatar\_url

TEXT

NULLABLE

Profile picture URL

provider

VARCHAR\(50\)

DEFAULT "email"

email / google / apple

email\_verified

BOOLEAN

DEFAULT false

Email verification status

stripe\_customer\_id

VARCHAR\(255\)

NULLABLE, UNIQUE

Stripe customer ID

subscription\_tier

VARCHAR\(50\)

DEFAULT "free"

free / starter / growth

subscription\_status

VARCHAR\(50\)

DEFAULT "inactive"

active / inactive / canceled / past\_due

subscription\_id

VARCHAR\(255\)

NULLABLE

Stripe subscription ID

trial\_ends\_at

TIMESTAMP

NULLABLE

When $9 intro period expires

onboarding\_completed

BOOLEAN

DEFAULT false

Has completed AI onboarding?

onboarding\_step

INTEGER

DEFAULT 0

Current onboarding progress \(0\-5\)

total\_sales

INTEGER

DEFAULT 0

Total sales count, used for Growth unlock

created\_at

TIMESTAMP

DEFAULT NOW\(\)

Account creation timestamp

updated\_at

TIMESTAMP

DEFAULT NOW\(\)

Last update timestamp

## __4\.2 store\_profiles Table__

One\-to\-one with users\. Created during onboarding\. Stores all AI\-extracted information about the user's store\.

__Column__

__Type__

__Description__

id

UUID

PRIMARY KEY

user\_id

UUID

FOREIGN KEY ΓåÆ users\.id \(CASCADE DELETE, UNIQUE\)

store\_url

TEXT

Store URL provided by user

store\_platform

VARCHAR\(100\)

Detected platform: shopify / etsy / woocommerce / other

product\_type

TEXT

What they sell \(extracted by AI\)

target\_customer

TEXT

Ideal customer description \(extracted by AI\)

price\_range

VARCHAR\(100\)

Product price range

weekly\_time\_available

VARCHAR\(100\)

How many hours/week for marketing

current\_challenges

TEXT

User\-described marketing challenges

store\_analysis

TEXT

AI\-generated store analysis after URL fetch

niche\_summary

TEXT

AI\-generated niche and positioning summary

coverage\_map

JSONB

Channel coverage: \{reddit: \{count:5, lastUsed:"2026\-05\-01", signal:"positive"\}, \.\.\.\}

created\_at

TIMESTAMP

DEFAULT NOW\(\)

updated\_at

TIMESTAMP

DEFAULT NOW\(\)

## __4\.3 actions Table__

Stores every AI\-generated daily action for every user\.

__Column__

__Type__

__Description__

id

UUID

PRIMARY KEY

user\_id

UUID

FOREIGN KEY ΓåÆ users\.id

title

VARCHAR\(500\)

Short action title \(e\.g\. "Post in r/entrepreneur"\)

description

TEXT

Full action description with step\-by\-step instructions

content

TEXT

Pre\-written content ready to use \(post copy, email copy, etc\.\)

channel

VARCHAR\(100\)

Marketing channel: reddit / instagram / email / pinterest / etc\.

action\_type

VARCHAR\(100\)

community / content / outreach / seo / paid\_ads

status

VARCHAR\(50\)

pending / completed / postponed / skipped

outcome\_signal

VARCHAR\(50\)

NULLABLE: positive / neutral / negative / untested

scheduled\_for

DATE

Date this action is assigned to

completed\_at

TIMESTAMP

NULLABLE, when marked complete

embedding

vector\(1536\)

pgvector embedding for similarity search

created\_at

TIMESTAMP

DEFAULT NOW\(\)

__≡ƒÆí Note: __*The embedding column requires: CREATE EXTENSION IF NOT EXISTS vector; and then the column type vector\(1536\) for OpenAI embeddings, or vector\(1024\) for Claude embeddings\.*

## __4\.4 action\_compressed\_summaries Table__

Every 30 actions, a BullMQ job compresses them into a short narrative\. This keeps AI context bounded at ~2000 tokens regardless of user tenure\.

__Column__

__Type__

__Description__

id

UUID

PRIMARY KEY

user\_id

UUID

FOREIGN KEY ΓåÆ users\.id

batch\_start

INTEGER

Action batch start index \(1, 31, 61, \.\.\.\)

batch\_end

INTEGER

Action batch end index \(30, 60, 90, \.\.\.\)

summary

TEXT

AI\-generated narrative summary of this batch

created\_at

TIMESTAMP

DEFAULT NOW\(\)

## __4\.5 weekly\_content Table__

__Column__

__Type__

__Description__

id

UUID

PRIMARY KEY

user\_id

UUID

FOREIGN KEY ΓåÆ users\.id

week\_start

DATE

Monday of the week this content is for

content\_type

VARCHAR\(100\)

instagram\_post / reddit\_post / email / product\_description / pinterest\_pin / blog\_outline

title

VARCHAR\(500\)

Short descriptive title

content

TEXT

Full generated content text

status

VARCHAR\(50\)

generated / viewed / downloaded / used

generation\_job\_id

VARCHAR\(255\)

BullMQ job ID for tracking

created\_at

TIMESTAMP

DEFAULT NOW\(\)

## __4\.6 ask\_stormo\_messages Table__

__Column__

__Type__

__Description__

id

UUID

PRIMARY KEY

user\_id

UUID

FOREIGN KEY ΓåÆ users\.id

role

VARCHAR\(20\)

user / assistant

content

TEXT

Message content

created\_at

TIMESTAMP

DEFAULT NOW\(\)

## __4\.7 outreach\_contacts Table__

__Column__

__Type__

__Description__

id

UUID

PRIMARY KEY

user\_id

UUID

FOREIGN KEY ΓåÆ users\.id

name

VARCHAR\(255\)

Influencer / partner name

platform

VARCHAR\(100\)

instagram / tiktok / youtube / blog / podcast

profile\_url

TEXT

Social profile URL

follower\_count

INTEGER

NULLABLE, approximate follower count

niche\_match

TEXT

Why this person matches the user's niche

status

VARCHAR\(50\)

identified / contacted / replied / negotiating / agreed / declined / no\_response

last\_contact\_at

TIMESTAMP

NULLABLE, last outreach date

follow\_up\_due

DATE

NULLABLE, 3\-day follow\-up flag date

ai\_outreach\_draft

TEXT

AI\-generated outreach message draft

notes

TEXT

NULLABLE, user notes

created\_at

TIMESTAMP

DEFAULT NOW\(\)

## __4\.8 milestones Table__

__Column__

__Type__

__Description__

id

UUID

PRIMARY KEY

user\_id

UUID

FOREIGN KEY ΓåÆ users\.id

milestone\_key

VARCHAR\(100\)

first\_action / first\_week / first\_content / first\_outreach / first\_sale / ten\_sales / thirty\_days / ninety\_days / first\_influencer\_deal

achieved\_at

TIMESTAMP

DEFAULT NOW\(\)

email\_sent

BOOLEAN

DEFAULT false, tracks if milestone email was sent

## __4\.9 blog\_posts Table__

__Column__

__Type__

__Description__

id

UUID

PRIMARY KEY

slug

VARCHAR\(255\)

UNIQUE, URL\-friendly slug

title

VARCHAR\(500\)

Post title

excerpt

TEXT

Short description for listing pages

content

TEXT

Full post content \(Markdown or HTML\)

meta\_title

VARCHAR\(255\)

SEO meta title

meta\_description

VARCHAR\(500\)

SEO meta description

og\_image\_url

TEXT

Open Graph image URL

published

BOOLEAN

DEFAULT false

published\_at

TIMESTAMP

NULLABLE

created\_at

TIMESTAMP

DEFAULT NOW\(\)

## __4\.10 subscriptions Table \(Stripe Webhook Mirror\)__

__Column__

__Type__

__Description__

id

UUID

PRIMARY KEY

user\_id

UUID

FOREIGN KEY ΓåÆ users\.id

stripe\_subscription\_id

VARCHAR\(255\)

UNIQUE

stripe\_price\_id

VARCHAR\(255\)

Stripe price ID

status

VARCHAR\(50\)

active / past\_due / canceled / unpaid / trialing

current\_period\_start

TIMESTAMP

Current billing period start

current\_period\_end

TIMESTAMP

Current billing period end

cancel\_at\_period\_end

BOOLEAN

DEFAULT false

created\_at

TIMESTAMP

DEFAULT NOW\(\)

updated\_at

TIMESTAMP

DEFAULT NOW\(\)

# __Section 5 ΓÇö Module 01: Homepage \(Public Site\)__

Purpose: Convert visitors into paying subscribers\. The homepage is a marketing asset\. Every section has one job: move the visitor one step closer to clicking the CTA\. This is the most important page for business success\.

## __5\.1 Navigation Bar__

- Fixed position ΓÇö stays visible at all times as user scrolls
- Left: Stormo\.io logo in orange \#E8621A
- Center: Two nav links ΓÇö "How It Works" and "Pricing" ΓÇö smooth scroll to sections
- Right: CTA button ΓÇö "Start for $9" ΓÇö orange bg, white text, rounded corners
- On scroll: navbar background transitions to dark \#1A1A1A with subtle shadow
- Mobile: hamburger menu icon, CTA button always visible \(never hidden\)

__≡ƒÆí Note: __*Use Next\.js Link component for nav links\. Implement smooth scroll with scroll\-behavior: smooth on html element\.*

## __5\.2 Section 1 ΓÇö Hero__

- Background: Dark \#1A1A1A with subtle orange geometric accent elements \(abstract shapes, low opacity\)
- Headline: "You Built The Store\. Where Are The Customers?" ΓÇö 56\-64px bold white \(Inter 800\)
- Subheadline: 18\-20px light gray \#AAAAAA, max\-width 600px centered
- Supporting line: 16px lighter gray, max\-width 560px centered
- CTA Button: "Start Getting Customers ΓÇö First Month $9" ΓÇö large orange, white text, generous padding
- Trust line below button: "$9 first month\. Then $29/month\. Cancel anytime\. Works with every store platform\." ΓÇö 13px muted gray

## __5\.3 Section 2 ΓÇö Pain \(Without/With\)__

- Background: White \#FFFFFF
- Section headline: "Are You Experiencing This?" ΓÇö 36px bold dark centered
- Two columns side by side \(stacked on mobile\), each in a card with light shadow
- Left column: Without Stormo ΓÇö 5 bullet points of pain \(no icons, plain text or Γ£ù icon\)
- Right column: With Stormo ΓÇö 5 bullet points of solution ΓÇö orange checkmarks \(Γ£ô\)

## __5\.4 Section 3 ΓÇö How It Works__

- Background: \#F5F5F5
- Headline: "How Stormo Works" centered, subheadline: "From zero to first customers in three steps"
- Three steps horizontal desktop, vertical mobile
- Each step: large orange step number \(1/2/3\), bold title, two\-sentence description
- Connecting arrow between steps on desktop \(CSS or SVG arrow\)
- Step 1: Tell Us About Your Store ΓÇö 10\-minute AI conversation
- Step 2: Get Your Personalized Plan ΓÇö AI analyzes, builds strategy
- Step 3: Take One Action At A Time ΓÇö daily action, content written

## __5\.5 Section 4 ΓÇö Features \(6 Cards\)__

- Background: White \#FFFFFF
- Headline: "Everything You Need To Go From Zero To Customers" ΓÇö centered
- Six feature cards in 3├ù2 grid \(desktop\), single column \(mobile\)
- Each card: white bg, subtle shadow, orange Lucide icon top\-left, bold title, two\-sentence description
- Feature cards: Stop Guessing | Stop Writing Content | Ideal Customer | Influencer Outreach | Never Miss Opportunity | Graduate to Paid Ads

## __5\.6 Section 5 ΓÇö Comparison Table__

- Background: \#F5F5F5
- Headline: "Why Stormo Beats Every Alternative"
- Comparison table: Stormo vs DIY vs Paid Ads vs Freelancer vs Generic AI
- Orange header row\. Stormo column highlighted in light orange \#FDF0E8
- Checkmarks \(Γ£ô\) for yes, dashes \(ΓÇö\) for no
- Three callout boxes below table: unique selling points

## __5\.7 Section 6 ΓÇö Pricing__

- Background: White \#FFFFFF
- Headline: "Simple Pricing\. Grows With Your Store\." ΓÇö centered
- Two pricing cards side by side \(stacked mobile\)
- STARTER card: light gray bg, crossed\-out $29, $9 first month price \(large bold\), orange checkmarks feature list, orange CTA button, trust line below
- GROWTH card: dark \#1A1A1A bg, orange top border, $39/month white text, unlock condition text, feature list in white, separate CTA

__≡ƒÆí Note: __*The pricing displayed must match exactly: Starter = $9 first month, then $29/month\. Growth = $39/month, unlocks at 10 sales, user choice, never automatic\.*

## __5\.8 Section 7 ΓÇö Social Proof__

- Background: Dark \#1A1A1A
- Founder quote in centered italic white text
- Three stat boxes: 26M stores globally / 90% never reach first sale / $1,500\+ agency cost
- Each stat box: dark card with orange top border
- Four bullet points with orange bullets re\-emphasizing pricing value
- CTA button: "Start For $9 ΓÇö See It Work Before You Commit"

## __5\.9 Section 8 ΓÇö Final CTA__

- Full\-width orange band \(\#E8621A\), generous vertical padding \(80\-120px\)
- Headline: "Your Store Deserves Customers" ΓÇö 48px bold white centered
- Body paragraph: emotional copy about believing in their store
- CTA button: white background, orange text ΓÇö "Start Getting Customers ΓÇö First Month $9"
- Trust line below button

## __5\.10 Footer__

- Background: Dark \#1A1A1A, orange top border 2px
- Logo left with tagline: "Momentum for your store\."
- Four column link groups: Product / Company / Support \(see design brief for links\)
- Bottom bar: copyright centered, small gray text

## __5\.11 Homepage Performance Rules__

- No large uncompressed images ΓÇö use Next\.js Image component with optimization
- Lazy load all images below the fold
- Target: under 2 seconds on mobile
- No unnecessary JavaScript libraries
- CTA button must appear in: Hero \+ Features section end \+ Pricing \+ Final CTA ΓÇö visitor never more than one screen from signup

## __5\.12 Testing ΓÇö Homepage__

__Test__

__Expected Result__

Navbar stays fixed on scroll

Navbar visible at all scroll positions

Hamburger menu opens on mobile

Menu toggles correctly, CTA visible

Smooth scroll on nav links

Page scrolls to correct section

CTA button opens registration

Redirects to /register or opens signup modal

Pricing shows correct amounts

$9 first month, $29/month, $39 growth

Page loads under 2s on mobile \(Lighthouse\)

Performance score > 80

Responsive at 375px, 768px, 1280px

No horizontal scroll, correct layout

# __Section 6 ΓÇö Module 02: Authentication__

Purpose: Securely register and authenticate users\. Support three methods\. Gate all dashboard routes\. Manage session state across the app\.

## __6\.1 Registration \(/register\)__

- Fields: Email, Password, Name \(optional\), Terms acceptance checkbox
- Validation: email format, password min 8 chars, terms must be checked
- On submit: create user record, hash password with bcrypt \(cost 12\), send verification email via Nodemailer
- After registration: redirect to /onboarding if subscription active, else redirect to /pricing to subscribe first

__≡ƒÆí Note: __*Users must subscribe before accessing the dashboard\. Free tier does not exist ΓÇö the $9 first month IS the entry point\.*

## __6\.2 Login \(/login\)__

- Fields: Email, Password
- Support: Google OAuth button, Apple Sign\-In button
- On successful login: check subscription status ΓåÆ if active redirect to /dashboard, if not active redirect to /pricing
- "Forgot password?" link ΓåÆ /forgot\-password flow

## __6\.3 OAuth Providers__

- Google: NextAuth\.js Google provider, requires GOOGLE\_CLIENT\_ID and GOOGLE\_CLIENT\_SECRET in \.env
- Apple: NextAuth\.js Apple provider, requires APPLE\_ID, APPLE\_SECRET in \.env
- On first OAuth login: create user record, set provider field, skip email verification

## __6\.4 Password Reset__

- User enters email ΓåÆ if exists, send reset link via Nodemailer \(expires in 1 hour\)
- Reset link contains signed JWT token with user ID
- User clicks link ΓåÆ /reset\-password?token=xxx ΓåÆ enter new password ΓåÆ update hash

## __6\.5 Route Protection__

- All /dashboard/\* routes: require valid session, redirect to /login if not authenticated
- All /dashboard/\* routes: require active subscription \(starter or growth\), redirect to /pricing if not subscribed
- Implement using Next\.js middleware\.ts ΓÇö checks session \+ subscription tier on every protected request

## __6\.6 Session Management__

- NextAuth\.js handles sessions ΓÇö JWT strategy or database sessions
- Session contains: userId, email, subscriptionTier, onboardingCompleted
- Session TTL: 30 days rolling

## __6\.7 Testing ΓÇö Auth__

__Test__

__Expected__

Register with valid email/password

User created, verification email sent

Register with duplicate email

Error: "Email already registered"

Login with wrong password

Error: "Invalid credentials"

Google OAuth login flow

User created/found, redirected to dashboard

Apple Sign\-In flow

User created/found, redirected to dashboard

Access /dashboard without session

Redirected to /login

Access /dashboard without subscription

Redirected to /pricing

Password reset full flow

Email received, password changed, can login

# __Section 7 ΓÇö Module 03: Stripe Subscriptions & Billing__

Purpose: Monetize the platform\. Handle initial $9 introductory price, recurring monthly billing, subscription tier upgrades, cancellations, and failed payments\.

## __7\.1 Pricing Tiers__

__Tier__

__Price__

__Stripe Price ID__

__Conditions__

Starter \(intro\)

$9 for first month

price\_starter\_intro \(configure in Stripe\)

All new users ΓÇö one\-time $9 first month

Starter \(recurring\)

$29/month

price\_starter\_recurring

Auto\-renews after intro month

Growth

$39/month

price\_growth\_recurring

User must have 10\+ sales, user initiates upgrade voluntarily

__≡ƒÆí Note: __*Growth tier is NEVER automatic\. Even when users\.total\_sales >= 10, Growth simply unlocks as an option\. The user explicitly clicks "Upgrade to Growth" to trigger the plan change\.*

## __7\.2 Stripe Integration Flow__

1. User clicks "Start for $9" CTA
2. If not logged in: redirect to /register, then to /checkout after registration
3. Create Stripe Customer via API: stripe\.customers\.create\(\{email\}\)
4. Save stripe\_customer\_id to users table
5. Create Stripe Checkout Session with intro price \+ subscription setup
6. Redirect user to Stripe\-hosted checkout
7. On payment success: Stripe sends webhook ΓåÆ update subscription\_tier to "starter", subscription\_status to "active"
8. User redirected to /onboarding

## __7\.3 Webhook Handling \(/api/stripe/webhook\)__

- Verify Stripe webhook signature with stripe\.webhooks\.constructEvent\(\)
- Handle events:
	- customer\.subscription\.created ΓåÆ set subscription active in DB
	- customer\.subscription\.updated ΓåÆ sync status changes
	- customer\.subscription\.deleted ΓåÆ set status to canceled, revoke dashboard access
	- invoice\.payment\_succeeded ΓåÆ log, send receipt email
	- invoice\.payment\_failed ΓåÆ update status to past\_due, send email with payment retry link

## __7\.4 Subscription Management \(User\-facing\)__

- Dashboard Settings page: show current plan, next billing date, cancel option
- Cancel: sets cancel\_at\_period\_end = true in Stripe ΓÇö user keeps access until period ends
- Upgrade to Growth: shown only when total\_sales >= 10 ΓÇö calls stripe\.subscriptions\.update\(\) to change price

## __7\.5 Testing ΓÇö Billing__

__Test__

__Expected__

Checkout with Stripe test card 4242\.\.\.

Subscription created, dashboard accessible

Webhook: subscription\.deleted

User status = canceled, /dashboard access blocked

Webhook: payment\_failed

Status = past\_due, failure email sent

Cancel subscription

cancel\_at\_period\_end set, access continues till end of period

Growth upgrade \(10\+ sales\)

Plan changes to $39/month in Stripe and DB

Growth upgrade button hidden \(< 10 sales\)

Button not visible/disabled in UI

# __Section 8 ΓÇö Module 04: Conversational AI Onboarding__

Purpose: Collect all the information needed to personalize Stormo for each user's specific store\. This is the first impression\. It must feel premium, fast, and intelligent ΓÇö not like filling out a form\.

## __8\.1 Onboarding Overview__

- Triggered on first login after subscription ΓÇö /onboarding page
- 5\-topic conversational chat powered by Claude via streaming
- Each user message is sent to the AI which extracts structured data and saves it to store\_profiles in real time
- No form submission step ΓÇö data saves automatically as the conversation progresses
- Total time: approximately 10 minutes

## __8\.2 Five Onboarding Topics__

__Topic \#__

__Topic Name__

__Data Extracted__

__AI Goal__

1

Store Introduction

store\_url, store\_platform

Get the store URL, trigger server\-side URL fetch \+ AI analysis

2

Products & Pricing

product\_type, price\_range

Understand what they sell and at what price point

3

Target Customer

target\_customer

Build a clear ICP \(ideal customer profile\)

4

Time & Availability

weekly\_time\_available

Know how much time they have for daily actions

5

Current Challenges

current\_challenges

Understand biggest marketing frustrations

## __8\.3 Technical Implementation__

### __Streaming Chat Interface__

- Frontend: Next\.js streaming route using ReadableStream
- Each user message ΓåÆ POST /api/onboarding/message
- Backend: LangChain chain with system prompt for current topic
- Response streamed back to frontend using Server\-Sent Events \(SSE\)
- Frontend renders tokens as they arrive ΓÇö premium feel, no loading spinner

### __Real\-Time Data Extraction__

- Parallel to the streaming response, a second LangChain call extracts structured JSON from the conversation
- Example extraction prompt: "From this conversation turn, extract JSON: \{ store\_url: string | null, platform: string | null \}"
- Extracted fields immediately PATCH to /api/profile ΓÇö no second step
- Topic progress state advances when AI signals completion via a JSON flag in its response

### __Store URL Analysis__

- When store\_url is extracted: server\-side fetch of the URL
- Claude analyzes the fetched HTML/text: identifies products, niche, positioning, target audience
- Result saved to store\_profiles\.store\_analysis and niche\_summary before onboarding ends

__≡ƒÆí Note: __*Use puppeteer or node\-fetch for URL fetching\. Handle errors gracefully \(private stores, Cloudflare blocks\) ΓÇö if fetch fails, continue with user\-provided info\.*

## __8\.4 Onboarding Progress UI__

- Left sidebar \(desktop\) or top progress bar \(mobile\): shows 5 topics, highlights active, checks completed
- Topic names visible so user knows what to expect
- On final topic completion: celebration animation \+ "Your plan is ready" message
- Auto\-redirect to /dashboard after 2\-second delay

## __8\.5 Testing ΓÇö Onboarding__

__Test__

__Expected__

Send first message in Topic 1

Streaming response appears token\-by\-token

Provide valid store URL in conversation

URL extracted, store analysis generated, saved to DB

Complete all 5 topics

onboarding\_completed = true in users table

All store profile fields populated

store\_profiles row has all non\-null key fields

Refresh page mid\-onboarding

Resumes from last completed topic

Invalid store URL gracefully handled

AI continues, notes URL could not be analyzed

# __Section 9 ΓÇö Module 05: Daily Action Engine__

Purpose: The core product loop\. Every day, each user receives one specific marketing action ΓÇö written, ready, and tailored to their store\. This is what users come back for every day\. This module MUST never become repetitive\.

## __9\.1 Action Generation Flow__

1. User opens dashboard ΓÇö system checks if today's action exists
2. If no action for today: trigger action generation job
3. Generation job assembles context \(see Section 16 ΓÇö Repetition Prevention\)
4. LangChain chain sends context \+ prompt to Claude \(or configured model\)
5. Claude generates: title, description, step\-by\-step instructions, pre\-written content
6. Action saved to actions table with embedding generated via LangChain embeddings
7. Action displayed to user

## __9\.2 Action Display \(Dashboard ΓÇö Today's Action Card\)__

- Large prominent card at top of dashboard
- Action title \(bold, large\), channel badge \(e\.g\. "Reddit"\), action type badge
- Full description with step\-by\-step instructions
- Copyable content block ΓÇö pre\-written text ready to paste/post
- Two action buttons:
	- "Mark Complete" ΓÇö marks status=completed, prompts optional outcome tag
	- "Do This Tomorrow" ΓÇö postpones action to tomorrow \(sets scheduled\_for to next day\)
- Outcome tagging modal \(after "Mark Complete"\): "How did it go?" ΓÇö traffic / good engagement / no response / too difficult

## __9\.3 Action History__

- Accessible from dashboard sidebar
- List of all previous actions with status, date, outcome signal
- Filter by: status / channel / date range

## __9\.4 Repetition Prevention \(Summary ΓÇö See Section 16 for Detail\)__

- Three\-layer architecture keeps context bounded at ~2000 tokens regardless of user tenure
- Layer 1: Vector similarity search ΓÇö flags near\-duplicate actions before generation
- Layer 2: Coverage map ΓÇö compact JSON of channel usage counts and signals
- Layer 3: Compressed summaries ΓÇö every 30 actions compressed to narrative

__≡ƒÆí Note: __*Similarity threshold: 0\.85 cosine similarity\. If a proposed action is too similar to a past action, regenerate with explicit exclusion\.*

## __9\.5 Testing ΓÇö Daily Action Engine__

__Test__

__Expected__

User has no action for today

Action generated on page load \(or within 30s\)

Mark Complete triggers outcome modal

Modal appears, selection updates action record

Do This Tomorrow

Action scheduled\_for updates to tomorrow

After 30 actions, compression job runs

Summary created in action\_compressed\_summaries

Generate 50 actions for same user

No two actions have cosine similarity > 0\.85

Coverage map updates after action

Channel count increments, signal recorded

# __Section 10 ΓÇö Module 06: Ask Stormo \(AI Chat Assistant\)__

Purpose: Give users an always\-available marketing advisor who knows their store intimately\. Ask Stormo answers any marketing question, suggests strategies, explains action steps, and provides personalized guidance ΓÇö at any time, from any dashboard page\.

## __10\.1 UI Implementation__

- Fixed\-position floating button in bottom\-right corner ΓÇö ALWAYS visible on all dashboard pages
- Rendered at Next\.js root layout level ΓÇö NO individual dashboard page can hide or displace it
- Z\-index: above all dashboard components \(z\-50 or higher\)
- Button: circular, orange \(\#E8621A\), "Ask Stormo" label or speech bubble icon
- Click opens chat panel: slides up from bottom\-right, 400px wide x 500px tall \(desktop\)
- Mobile: full\-screen modal

## __10\.2 Chat Panel Features__

- Chat history: last N messages loaded from ask\_stormo\_messages table on panel open
- Streaming responses ΓÇö tokens appear as AI generates them
- Store profile injected into system prompt on EVERY message \(user never has to re\-explain their store\)
- Input: textarea \+ send button, Enter to send \(Shift\+Enter for new line\)
- Suggested prompts on first open: "What should I focus on this week?", "How do I find micro\-influencers?", "What's working in my niche?"

## __10\.3 LangChain Implementation__

- System prompt template: "You are Stormo, a marketing advisor for \[user\_name\]'s \[product\_type\] store at \[store\_url\]\. Their target customer is \[target\_customer\]\. They have \[weekly\_time\_available\] hours per week for marketing\. Always give specific, actionable advice tailored to their exact store\."
- Conversation history: last 20 messages passed as LangChain MessageHistory
- Stream response via LangChain streaming callbacks ΓåÆ Server\-Sent Events ΓåÆ frontend
- All messages saved to ask\_stormo\_messages with role and content

## __10\.4 Testing ΓÇö Ask Stormo__

__Test__

__Expected__

Floating button visible on all dashboard pages

Button present and clickable on every route

Chat panel opens and closes

Animation smooth, no layout shift

Send message ΓÇö streaming response

Tokens appear progressively

Response mentions store details

AI references their actual product/niche

Chat history persists on close \+ reopen

Previous messages shown on panel open

Mobile: full screen layout

Panel fills screen on mobile, scrollable

# __Section 11 ΓÇö Module 07: Weekly Content Generation Pipeline__

Purpose: Automatically generate 6 pieces of ready\-to\-use marketing content every week for each active user\. Content is personalized to their store and niche, and never repeats formats or angles from previous weeks\.

## __11\.1 Content Types Generated Weekly__

__Content Type__

__What It Is__

__Where Used__

Instagram Post

Caption \+ hashtags for a product post

Instagram / Facebook

Reddit Post

Authentic community contribution for relevant subreddits

Reddit

Outreach Email

Cold email to a micro\-influencer or potential partner

Email

Product Description

SEO\-optimized product listing copy

Store product page

Pinterest Pin Description

Pin title \+ description optimized for Pinterest SEO

Pinterest

Blog Post Outline

Headline \+ outline for a blog post targeting ideal customers

Store blog

## __11\.2 BullMQ Pipeline Architecture__

- Every Monday at 6:00 AM UTC: a master job fires for each active subscriber
- Master job spawns 6 child jobs \(one per content type\) ΓÇö each job independent
- Jobs spread across a rolling 24\-hour window to avoid API rate limit spikes \(e\.g\. 1 job per second staggered\)
- Each child job: pull user profile \+ content history \+ coverage map ΓåÆ call Claude ΓåÆ save to weekly\_content table ΓåÆ set status = generated
- Failed jobs: retry 3 times with exponential backoff \(1min, 5min, 15min\)
- After all 6 jobs complete: send "Your weekly content is ready" email via Nodemailer
- Admin\-visible job monitor: per\-user job status in BullMQ dashboard \(or simple admin endpoint\)

## __11\.3 Repetition Prevention for Content__

- Content history compressed using same approach as action engine \(see Section 16\)
- System prompt explicitly instructs: "Do not repeat structures, angles, or formats from previous weeks"
- Current date injected into every content prompt ΓåÆ naturally references timely angles

## __11\.4 User\-Facing Content Page__

- Dashboard route: /dashboard/content
- This week's content: 6 cards, one per content type
- Each card: content type label, title, preview \(first 100 chars\), "View & Copy" button
- On "View & Copy": full content shown in modal with one\-click copy button
- Previous weeks: accordion or tab to access past weeks' content
- Content status tracking: generated / viewed / downloaded

## __11\.5 Testing ΓÇö Weekly Content Pipeline__

__Test__

__Expected__

Trigger weekly generation job manually

6 content pieces created for user in DB

All 6 content types generated

weekly\_content has 6 rows with correct types

Failed job retries

After failure, job retried up to 3 times

Content shows on /dashboard/content

All 6 pieces visible with correct content

Copy button works

Clipboard receives full content text

Two consecutive weeks of content

Week 2 content does not repeat Week 1 formats

# __Section 12 ΓÇö Module 08: User Dashboard__

Purpose: The command center of Stormo\. Everything a user needs to track progress, access actions, view content, manage outreach, plan campaigns, and monitor milestones ΓÇö in one clean, organized interface\.

## __12\.1 Dashboard Layout__

- Fixed sidebar \(desktop\): Logo, nav links, user avatar \+ name, subscription badge
- Mobile: bottom tab bar or hamburger drawer
- Main content area: changes based on active route
- Ask Stormo floating button: always visible \(see Module 06\)

## __12\.2 Sidebar Navigation__

__Nav Item__

__Route__

__Description__

Today's Action

/dashboard

Daily action card, primary landing page

My Content

/dashboard/content

Weekly generated content library

Outreach

/dashboard/outreach

Influencer & partner CRM

Campaigns

/dashboard/campaigns

Seasonal campaign planner

Milestones

/dashboard/milestones

Progress tracker, achievements

Settings

/dashboard/settings

Account, subscription, notifications

## __12\.3 Today's Action Page \(/dashboard\)__

- Today's action prominently displayed \(Module 05\)
- Progress indicator: "Action X of 30 this month"
- Streak counter: "7\-day streak\! Keep it up\."
- Quick stats row: Actions completed / Content pieces generated / Outreach contacts

## __12\.4 Outreach CRM \(/dashboard/outreach\)__

- Table view of all outreach contacts
- Status pipeline: identified ΓåÆ contacted ΓåÆ replied ΓåÆ negotiating ΓåÆ agreed ΓåÆ declined ΓåÆ no\_response
- 3\-day follow\-up flag: orange indicator when follow\_up\_due <= today
- "Add Contact" button: manual entry form
- "Generate Outreach" button: AI generates personalized outreach draft for selected contact using their store context
- Bulk import: paste Instagram handles or URLs, AI identifies suitability and adds to CRM

## __12\.5 Seasonal Campaign Planner \(/dashboard/campaigns\)__

- 60\-day calendar lookahead showing upcoming holidays, seasonal events relevant to their niche
- AI pre\-suggests campaign ideas for each upcoming event
- User can click an event ΓåÆ "Build Campaign" ΓåÆ AI generates full campaign plan \(actions \+ content outline\)
- Campaigns saved and linked to action queue for scheduled delivery

## __12\.6 Milestones \(/dashboard/milestones\)__

__Milestone Key__

__Trigger__

__Celebration__

first\_action

Complete first daily action

Badge \+ email

first\_week

Complete 7 consecutive daily actions

Badge \+ email

first\_content

View first piece of weekly content

Badge

first\_outreach

Send first outreach contact

Badge \+ email

first\_sale

User reports first sale

CONFETTI animation \+ email \+ notification

ten\_sales

User reports 10th sale

Badge \+ Growth tier unlock notification

thirty\_days

Active for 30 days

Badge \+ email

ninety\_days

Active for 90 days

Badge \+ email

first\_influencer\_deal

Outreach contact marked as "agreed"

Badge \+ email

__≡ƒÆí Note: __*First Sale milestone: use canvas\-confetti library \(MIT license, 3KB\)\. Full\-screen celebration for 3 seconds on dashboard load after milestone achieved\.*

## __12\.7 Settings \(/dashboard/settings\)__

- Account info: name, email, avatar \(edit\)
- Password change \(for email/password users\)
- Subscription info: current plan, next billing date, cancel button
- Notification preferences: email on milestone / weekly content ready / daily action reminder
- Growth upgrade button \(visible only when total\_sales >= 10\)

## __12\.8 Testing ΓÇö Dashboard__

__Test__

__Expected__

Dashboard loads after login

Today's action visible, stats correct

All 6 nav routes load correctly

No 404 errors, content loads

Milestone confetti triggers on first sale

canvas\-confetti fires on /dashboard load

Mobile bottom nav works

All routes accessible on mobile

Settings: cancel subscription flow

Stripe cancel called, confirmation shown

Outreach CRM: add contact \+ generate draft

Contact saved, AI draft generated

# __Section 13 ΓÇö Module 09: Email Automation \(Nodemailer\)__

Purpose: Send transactional emails for key platform events\. Nodemailer is used as the free, self\-hosted email solution\. No third\-party paid email service required\.

## __13\.1 Nodemailer Setup__

- Configure SMTP credentials in \.env: SMTP\_HOST, SMTP\_PORT, SMTP\_USER, SMTP\_PASS
- Recommended: use Gmail SMTP with App Password, or any SMTP provider \(SendGrid free tier, Mailgun free tier\)
- Create /lib/email/sender\.ts ΓÇö single function: sendEmail\(\{to, subject, html\}\)
- Create /lib/email/templates/ ΓÇö one HTML template file per email type

__≡ƒÆí Note: __*For production scale, consider upgrading to SendGrid free tier \(100 emails/day\) or Resend\. Nodemailer works for MVP launch\.*

## __13\.2 Email Types__

__Email Trigger__

__Subject Line__

__Content__

Registration

Welcome to Stormo\!

Confirmation of account, link to start subscription

Email verification

Verify your email address

Verification link \(expires 24h\)

Password reset

Reset your Stormo password

Reset link \(expires 1h\)

Subscription active

You're in\! Let's get your first customer\.

Welcome \+ link to onboarding

Payment failed

Action required: payment failed

Retry payment link, what happens if not resolved

Subscription canceled

Your Stormo subscription has ended

What they'll lose, re\-subscribe link

Weekly content ready

Your weekly content is ready\!

Preview of 6 content pieces, link to dashboard

Milestone: first action

First step taken\!

Encouraging message, what's next

Milestone: first sale

YOU GOT YOUR FIRST SALE\!

Celebration, Growth tier option

Weekly digest \(optional\)

Your Stormo week in review

Actions completed, content generated this week

## __13\.3 Email Template Guidelines__

- All emails: inline CSS only \(email client compatibility\)
- Max width: 600px, centered
- Brand colors: orange CTAs, dark text, clean white background
- Every email has exactly one CTA button
- Footer: unsubscribe link \+ Stormo\.io address

## __13\.4 Testing ΓÇö Email__

__Test__

__Expected__

Registration email

Received within 60 seconds of registration

Password reset email

Received, link valid for 1 hour only

Weekly content email

Sent after all 6 content pieces generated

Payment failed email

Sent within 60s of Stripe invoice\.payment\_failed webhook

Email renders on mobile \(Gmail test\)

No broken layout, images optional

# __Section 14 ΓÇö Module 10: Blog__

Purpose: Drive organic SEO traffic to Stormo\.io\. Blog posts target keywords relevant to ecommerce store owners seeking growth without paid ads\.

## __14\.1 Blog Routes__

- /blog ΓÇö Blog listing page \(all published posts, newest first\)
- /blog/\[slug\] ΓÇö Individual post page

## __14\.2 Blog Post Features__

- Title, excerpt, content \(Markdown rendered as HTML\), published date
- SEO: meta\_title, meta\_description, og\_image for each post
- Social share buttons: Twitter/X, Facebook, LinkedIn
- Related posts section \(3 posts by same category or tag\)
- CTA banner mid\-post and end\-post: "Start for $9 ΓÇö Get your first customers"

## __14\.3 Initial Launch Content \(4 Posts\)__

- Post 1: "How to Get Your First 100 Customers Without Spending on Ads"
- Post 2: "Why 90% of New Ecommerce Stores Fail in Year One \(And How to Beat the Odds\)"
- Post 3: "The Daily Marketing Habit That Grows Ecommerce Stores Without an Agency"
- Post 4: "Micro\-Influencer Marketing: The Zero\-Budget Strategy Big Brands Don't Want You to Know"

## __14\.4 SEO Requirements__

- Every page: proper <title>, <meta name="description">, <meta property="og:\*">
- Semantic HTML: <h1> for post title, <h2>/<h3> for sections
- URL structure: /blog/how\-to\-get\-first\-100\-customers \(slug from title\)
- sitemap\.xml: auto\-generated including all published blog posts
- robots\.txt: allow all crawlers
- Blog listing page: canonical URLs for all posts

## __14\.5 Testing ΓÇö Blog__

__Test__

__Expected__

Blog listing page loads

All published posts visible

Individual post loads by slug

Full content renders correctly

SEO meta tags present

og:title, og:description, og:image in page <head>

CTA in blog post links to /register

CTA navigates to correct route

sitemap\.xml accessible

All published post URLs in sitemap

# __Section 15 ΓÇö AI Model Configuration \(LangChain / LangGraph\)__

Purpose: Ensure every AI call in the system goes through a single configurable model factory\. This is non\-negotiable per client requirement\.

## __15\.1 LangChain Integration Points__

__Feature__

__LangChain Component__

__Notes__

Onboarding chat

LLMChain with ConversationBufferMemory

Streaming, 5 topic system prompts

Store URL analysis

LLMChain, single call

Non\-streaming, analyze fetched HTML

Daily action generation

LLMChain with structured output

See Section 16 for context assembly

Ask Stormo chat

ConversationalRetrievalChain or LLMChain

Streaming, persistent history from DB

Weekly content generation

LLMChain per content type

6 parallel chains in BullMQ jobs

Outreach draft generation

LLMChain single call

Uses contact \+ store profile context

Action embedding

LangChain Embeddings \(OpenAI or Anthropic\)

For pgvector similarity search

Repetition check

Direct pgvector query \+ LLMChain

Cosine similarity filter

## __15\.2 LangGraph Usage__

- Use LangGraph for the multi\-step onboarding flow ΓÇö each topic is a node in the graph
- State transitions: topic completion signals advance to next node
- Graph state includes: userId, currentTopic, extractedData, conversationHistory
- LangGraph provides clean state management for multi\-step AI workflows

__≡ƒÆí Note: __*LangGraph is particularly useful for the onboarding flow where we need to track progress across 5 distinct topics and potentially allow the user to go back or branch\.*

## __15\.3 Model Switching Guide__

__Switch To__

__ENV Change Required__

__Code Change Required__

Claude Haiku \(cheaper\)

AI\_MODEL=claude\-haiku\-4\-5\-20251001

None

Claude Sonnet \(default\)

AI\_MODEL=claude\-sonnet\-4\-20250514

None

Claude Opus \(most capable\)

AI\_MODEL=claude\-opus\-4\-6

None

GPT\-4o

AI\_PROVIDER=openai, AI\_MODEL=gpt\-4o

None

GPT\-4o\-mini \(cheap\)

AI\_PROVIDER=openai, AI\_MODEL=gpt\-4o\-mini

None

Different per feature

Add AI\_MODEL\_CHAT, AI\_MODEL\_CONTENT etc\.

Update getModel\(\) to accept modelType param

# __Section 16 ΓÇö Repetition Prevention Architecture__

Purpose: The single most critical architectural requirement\. AI responses must never become repetitive regardless of how long a user has been on the platform\. This section defines the three\-layer system that keeps context bounded and responses fresh\.

## __16\.1 The Problem__

Naive approach: pass all past actions to every Claude API call\. This fails because:

- After 30 days: ~30 raw action records in prompt ΓåÆ expensive, context bloat
- After 90 days: ~90 records ΓåÆ prompt overflow, quality degrades
- After 180 days: ~180 records ΓåÆ exceeds reasonable context, high cost, repetitive anyway

Solution: Three layers that keep TOTAL context injected per call bounded at ~2,000 tokens ALWAYS\.

## __16\.2 Layer 1 ΓÇö Semantic Similarity Filtering \(Vector Search\)__

- Every generated action: embed using LangChain embeddings ΓåÆ store vector in actions\.embedding \(pgvector\)
- Before generating a new action: run cosine similarity search against ALL past actions for that user
- Actions with similarity score > 0\.85: flagged as near\-duplicates
- Only flagged near\-duplicates \(typically 10\-15\) injected into Claude prompt as: "Do not generate anything resembling these: \[list\]"
- Claude sees only the most likely\-to\-repeat actions ΓÇö NOT all 180\+

__≡ƒÆí Note: __*This is stronger than keyword matching because vector similarity catches semantic duplicates\. "Post in r/entrepreneur" and "Share your story on the entrepreneur subreddit" have high similarity despite different words\.*

## __16\.3 Layer 2 ΓÇö Structured Coverage Map__

The store\_profiles\.coverage\_map is a compact JSON object \(never grows beyond ~300 tokens\):

\{
  "reddit": \{ "count": 12, "lastUsed": "2026\-05\-20", "signal": "positive" \},
  "pinterest": \{ "count": 4, "lastUsed": "2026\-05\-15", "signal": "neutral" \},
  "email": \{ "count": 8, "lastUsed": "2026\-05\-18", "signal": "negative" \},
  "instagram": \{ "count": 6, "lastUsed": "2026\-05\-19", "signal": "positive" \},
  "cold\_outreach": \{ "count": 3, "lastUsed": "2026\-05\-10", "signal": "no\_response" \}
\}

- Claude sees channel priority context: which to prioritize, which to avoid
- Coverage map injected as: "Channel performance summary: \[JSON\]"
- Updated every time a user tags an action outcome

## __16\.4 Layer 3 ΓÇö Rolling Compressed Summaries__

- BullMQ job runs after every 30th action for a user
- Job calls Claude to compress the 30\-action batch into a ~100\-token narrative
- Example: "Days 1\-30: Reddit community engagement \(6 actions, positive traffic signals\), Pinterest SEO \(4 actions, neutral\), cold email outreach \(3 actions, no responses\)\. Strong signal from community channels\."
- Summaries stack in action\_compressed\_summaries table
- By day 180: 6 short summaries Γëê 600 tokens total ΓÇö vs 180 raw records Γëê 10,000\+ tokens

## __16\.5 Final Context Budget Per API Call__

__Context Piece__

__Approx\. Tokens__

__Source__

Store profile

~300 tokens

store\_profiles table

Coverage map

~200 tokens

store\_profiles\.coverage\_map JSON

Compressed summaries

~400 tokens

action\_compressed\_summaries \(all batches\)

Recent 20 actions verbatim

~800 tokens

Last 20 actions from actions table

Near\-duplicate near\-misses

~300 tokens

pgvector similarity query result

TOTAL

~2,000 tokens

CONSTANT ΓÇö never grows with user tenure

# __Section 17 ΓÇö Development Sequence & Milestones__

Build in this exact order\. Each milestone produces a working, testable deliverable before the next begins\. Never skip ahead ΓÇö each phase depends on the previous\.

## __Phase 1 ΓÇö Weeks 1ΓÇô2: Foundation__

- Set up Next\.js monorepo with TypeScript
- Configure Tailwind CSS with Stormo theme tokens \(colors, fonts, spacing\)
- Set up Neon PostgreSQL \+ Drizzle ORM \+ all DB schemas from Section 4
- Enable pgvector extension in Neon
- Configure NextAuth\.js ΓÇö email/password, Google OAuth, Apple Sign\-In
- Implement all auth pages: /register, /login, /forgot\-password, /reset\-password
- Set up Stripe: create products/prices in Stripe dashboard, implement checkout flow
- Implement Stripe webhook handler with all required events
- Build user dashboard shell \(layout, sidebar, empty route pages\)
- Set up LangChain model factory \(getModel\(\) function\) ΓÇö THE FIRST AI FILE TO CREATE
- Deploy to Vercel, configure Porkbun DNS for stormo\.io
- Γ£à Deliverable: User can register, verify email, subscribe for $9, reach empty dashboard

## __Phase 2 ΓÇö Weeks 3ΓÇô4: AI Core__

- Build conversational AI onboarding \(LangGraph multi\-step flow, streaming\)
- Implement store URL fetching \+ Claude analysis
- Build /lib/ai/context\-assembler\.ts ΓÇö the repetition prevention context builder
- Implement pgvector embedding generation for actions
- Build daily action generation with full 3\-layer context injection
- Build Today's Action dashboard page \(display, Mark Complete, Do This Tomorrow\)
- Implement coverage map update logic
- Implement BullMQ compression job \(every 30 actions\)
- Γ£à Deliverable: Full onboarding flow \+ daily action engine working end\-to\-end

## __Phase 3 ΓÇö Weeks 5ΓÇô6: Full Feature Set__

- Build Ask Stormo floating chat \(LangChain conversation \+ streaming \+ DB history\)
- Build BullMQ weekly content generation pipeline \(all 6 content types\)
- Build /dashboard/content page
- Build Outreach CRM \(/dashboard/outreach\) ΓÇö table, pipeline stages, AI draft generation
- Build Seasonal Campaign Planner \(/dashboard/campaigns\)
- Build Milestone system \(detection triggers, confetti, DB tracking\)
- Set up Nodemailer \+ all email templates
- Implement all email triggers
- Build /dashboard/settings page
- Γ£à Deliverable: Complete beta application, all features functional

## __Phase 4 ΓÇö Weeks 7ΓÇô8: Polish, QA & Launch__

- Build complete homepage following Section 5 design spec exactly
- Build /blog listing \+ /blog/\[slug\] pages
- Write 4 initial blog posts, configure SEO meta
- Generate sitemap\.xml and robots\.txt
- Full mobile responsive QA \(375px, 768px, 1280px breakpoints\)
- Cross\-browser testing: Chrome, Firefox, Safari, Edge
- Run 35\-item acceptance checklist
- SSL certificate verification
- Performance audit \(Lighthouse > 80 on mobile\)
- Γ£à Deliverable: Signed\-off production\-ready application live at stormo\.io

# __Section 18 ΓÇö Testing Requirements__

Every module must be tested before marking it complete\. Tests are written alongside features, not after\. Use Jest for unit/integration tests\. Use Playwright or Cypress for E2E flows\.

## __18\.1 Testing Stack__

- Unit / Integration: Jest \+ Supertest \(API route testing\)
- E2E: Playwright \(full browser automation\)
- Stripe testing: Stripe CLI for webhook replay
- AI testing: mock LangChain calls in unit tests \(avoid real API calls in CI\)

## __18\.2 Complete 35\-Item Acceptance Checklist__

__\#__

__Item__

__Module__

1

Homepage loads under 2 seconds on mobile \(Lighthouse\)

Homepage

2

All homepage CTA buttons navigate to /register correctly

Homepage

3

Pricing shows $9 / $29 / $39 correctly

Homepage

4

Register with email/password creates user in DB

Auth

5

Google OAuth registers and logs in user

Auth

6

Apple Sign\-In registers and logs in user

Auth

7

Password reset full flow works end\-to\-end

Auth

8

Unauthenticated access to /dashboard redirects to /login

Auth

9

Stripe checkout with test card creates subscription

Billing

10

subscription\.deleted webhook revokes access

Billing

11

invoice\.payment\_failed sends failure email

Billing

12

Cancel subscription sets cancel\_at\_period\_end

Billing

13

Growth upgrade button hidden when sales < 10

Billing

14

AI onboarding: all 5 topics complete, data saved to DB

Onboarding

15

Store URL fetched and analyzed by AI during onboarding

Onboarding

16

Onboarding progress resumable on page refresh

Onboarding

17

Daily action generated for new user on dashboard load

Actions

18

Mark Complete updates action status \+ triggers outcome modal

Actions

19

Do This Tomorrow reschedules action to next day

Actions

20

After 30 actions: compression job creates summary

Actions

21

50 actions for same user: no two actions exceed 0\.85 cosine similarity

Actions

22

Ask Stormo floating button visible on all dashboard pages

Ask Stormo

23

Ask Stormo streaming response works

Ask Stormo

24

Ask Stormo chat history persists across sessions

Ask Stormo

25

Weekly content generation: all 6 pieces created for user

Content

26

Content pipeline: failed job retries 3 times

Content

27

Content visible and copyable on /dashboard/content

Content

28

Outreach CRM: add contact, status pipeline updates

Outreach

29

AI outreach draft generated for contact

Outreach

30

First Sale milestone: confetti animation fires

Milestones

31

Milestone emails sent for first\_action and first\_sale

Email

32

Weekly content ready email sent after generation completes

Email

33

Blog listing page shows all published posts

Blog

34

Blog post SEO meta tags present in page <head>

Blog

35

Full mobile responsive: no horizontal scroll at 375px

Responsive

# __Section 19 ΓÇö Deployment & Infrastructure__

## __19\.1 Environment Variables Required__

__Variable__

__Description__

DATABASE\_URL

Neon PostgreSQL connection string

NEXTAUTH\_SECRET

NextAuth\.js secret \(random 32\-char string\)

NEXTAUTH\_URL

Full URL of app \(https://stormo\.io\)

GOOGLE\_CLIENT\_ID

Google OAuth client ID

GOOGLE\_CLIENT\_SECRET

Google OAuth client secret

APPLE\_ID

Apple Sign\-In service ID

APPLE\_SECRET

Apple Sign\-In private key

STRIPE\_SECRET\_KEY

Stripe secret API key \(sk\_live\_\.\.\.\)

STRIPE\_PUBLISHABLE\_KEY

Stripe publishable key \(pk\_live\_\.\.\.\)

STRIPE\_WEBHOOK\_SECRET

Stripe webhook signing secret

STRIPE\_PRICE\_STARTER\_INTRO

Stripe price ID for $9 intro

STRIPE\_PRICE\_STARTER

Stripe price ID for $29/month

STRIPE\_PRICE\_GROWTH

Stripe price ID for $39/month

AI\_PROVIDER

anthropic \(default\) or openai

AI\_MODEL

claude\-sonnet\-4\-20250514 \(default\)

ANTHROPIC\_API\_KEY

Anthropic API key

OPENAI\_API\_KEY

OpenAI API key \(optional, for switching\)

UPSTASH\_REDIS\_REST\_URL

Upstash Redis URL for BullMQ

UPSTASH\_REDIS\_REST\_TOKEN

Upstash Redis auth token

SMTP\_HOST

Email SMTP host

SMTP\_PORT

Email SMTP port \(usually 587\)

SMTP\_USER

Email SMTP username

SMTP\_PASS

Email SMTP password or app password

FROM\_EMAIL

Sender email address \(e\.g\. hello@stormo\.io\)

## __19\.2 Vercel Deployment__

- Connect GitHub repo to Vercel
- Set all environment variables in Vercel dashboard
- Production domain: stormo\.io ΓÇö configure in Vercel ΓåÆ Settings ΓåÆ Domains
- Porkbun DNS: add CNAME record pointing stormo\.io to Vercel's assigned URL
- Vercel automatically handles SSL \(Let's Encrypt\)
- Preview deployments: each pull request gets a unique preview URL

## __19\.3 Staging Environment__

- Maintain a staging environment throughout entire development
- Staging URL: staging\.stormo\.io \(or stormo\-staging\.vercel\.app\)
- Separate Neon database branch for staging
- Separate Stripe test mode keys for staging
- All features tested on staging before promoting to production

## __19\.4 Client Ownership & Access__

__Asset__

__Access Type__

__Commitment__

GitHub Repository

Full owner access

Client added as owner from Day 1

Vercel Project

Full owner access

Transferred to client on project completion

Neon Database

Full owner access

Client owns database account

Stripe Account

Client\-owned account

Developer uses client's Stripe credentials

Anthropic API Key

Client\-owned

Client's API key, developer never retains

Domain \(Porkbun\)

Client\-owned

Already registered by client

Email SMTP

Client\-owned credentials

Set up in client's preferred SMTP

__*ΓÇö End of SRS Document ΓÇö*__

Stormo\.io | Version 1\.0 | June 2026

