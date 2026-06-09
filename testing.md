# Stormo.io — Absolute Beginner Testing Guide

Welcome to the beginner testing guide for Stormo.io! This guide will walk you through how to test every feature of the application step-by-step. You do not need any advanced programming experience to follow these steps.

---

## 🛠️ Step 0: Preparation & Setting Up

Before testing, you need to start the application and ensure your database is ready.

1. **Start the Development Server**:
   Open your terminal in the `Stormo` project root folder and run:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

2. **Seeding the Blog Database**:
   Ensure you have populated the database with test blog posts by running:
   ```bash
   npx tsx scripts/seed-blog.ts
   ```

---

## 🌐 1. Public Pages, Navigation, & SEO

### 1.1 Homepage Visuals & Scroll
* **Action**: Load `http://localhost:3000` in your browser.
* **Observe**: You should see a dark hero section with the headline *"You Built The Store. Where Are The Customers?"*
* **Action**: Scroll down the page.
* **Observe**: The top navigation bar background should transition from transparent to dark `#1A1A1A` with a subtle shadow.

### 1.2 Smooth Navigation Scroll
* **Action**: Click "How It Works" in the header.
* **Observe**: The page should scroll smoothly to the structured 3-step section.
* **Action**: Click "Pricing" in the header.
* **Observe**: The page should scroll smoothly to the Starter and Growth pricing plan cards.

### 1.3 Blog Listing & Detail Pages
* **Action**: Click "Blog" in the header navigation or visit `http://localhost:3000/blog`.
* **Observe**: You should see 4 blog post cards with titles, dates, excerpts, and image placeholders.
* **Action**: Click "Read Full Article" on the first card (e.g. *How to Get Your First 100 Customers*).
* **Observe**: The page loads with the full article content. You should see a social sharing header, a mid-post orange CTA banner ("Ready to get your first customers?"), and an identical end-of-post CTA banner.
* **Action**: Click "Start for $9" on any CTA banner.
* **Observe**: It redirects you to `/register`.

### 1.4 Search Engine Optimization (SEO) & Sitemaps
* **Action**: Visit `http://localhost:3000/robots.txt` in your browser.
* **Observe**: You should see plain text output allowing crawlers and pointing to the sitemap:
  ```txt
  User-agent: *
  Allow: /
  Sitemap: https://stormo.io/api/sitemap.xml
  ```
* **Action**: Visit `http://localhost:3000/api/sitemap.xml` in your browser.
* **Observe**: You should see XML outputs showing URL entries for `/`, `/pricing`, `/blog`, and all 4 article URLs.

---

## 🔐 2. Authentication Flow

### 2.1 User Registration
* **Action**: Visit `http://localhost:3000/register`.
* **Action**: Fill in a test name, a new email address (e.g., `testfounder@example.com`), and a password, then submit.
* **Observe**: Upon successful account creation, you should be redirected to `http://localhost:3000/pricing`.

### 2.2 Unauthenticated Route Block (Middleware)
* **Action**: Manually enter `http://localhost:3000/dashboard` in the URL bar.
* **Observe**: The browser should immediately redirect you back to `/pricing` because the logged-in user does not have an active subscription yet.
* **Action**: Log out, then try to visit `http://localhost:3000/dashboard` or `http://localhost:3000/onboarding` directly.
* **Observe**: The browser should redirect you immediately to `http://localhost:3000/login`.

---

## 💳 3. Subscription & Billing

### 3.1 Stripe Checkout Simulation
* **Action**: Log in with your new user, and visit `http://localhost:3000/pricing`.
* **Action**: Click "Get Started with Starter" on the Starter Plan card ($9 intro).
* **Observe**: You should be redirected to the Stripe Checkout page.
* **Action**: Fill in details using a Stripe test card (e.g., card number `4242 4242 4242 4242`, any future expiration date, and any 3-digit CVV) and submit payment.
* **Observe**: Upon successful checkout, you should be automatically redirected to `http://localhost:3000/onboarding`.

### 3.2 Cancellation & Upgrades
* **Action**: Once onboarding is complete and you are on the dashboard, visit `http://localhost:3000/dashboard/settings`.
* **Observe**: Under subscription settings, you should see your active Starter Plan. The "Upgrade to Growth" button should be hidden or disabled because you have logged less than 10 sales.
* **Action**: Click "Cancel Subscription" and confirm the alert.
* **Observe**: The status updates, showing when your subscription will cancel at the period end.

---

## 🚀 4. Conversational AI Onboarding

### 4.1 Onboarding Interface
* **Action**: Visit `http://localhost:3000/onboarding`.
* **Observe**: The progress sidebar lists 5 steps starting with *"Your Store"*. The chat assistant greets you and asks for your store URL and platform.

### 4.2 Scraper Analysis & Chat Responses
* **Action**: Type a valid or mock e-commerce store URL (e.g., `https://myawesomeclothingbrand.com Shopify`) and press Enter.
* **Observe**: The AI will output a streaming message analyzing your store profile, then mark Step 1 complete and transition to Step 2 (*Products & Pricing*).
* **Action**: Reply to all questions through the remaining steps (Demographics, Time Availability, Niche Challenges).
* **Observe**: When Step 5 completes:
  - Confetti explodes on the screen.
  - An orange box announces your plan is ready.
  - The page automatically redirects to `http://localhost:3000/dashboard` after 2 seconds.

### 4.3 Refresh Resumability
* **Action**: Refresh the browser page midway through onboarding (e.g., during Step 3).
* **Observe**: The interface should reload exactly on Step 3, keeping your chat history intact.

---

## 📅 5. Daily Action Engine & Dashboard

### 5.1 Stats Row & Streak
* **Action**: Go to `http://localhost:3000/dashboard`.
* **Observe**: The Quick Stats cards display count scores for Actions Completed, Content Pieces, and Outreach Contacts. You should see a streak counter indicating your current consecutive days.

### 5.2 Today's Action Card Actions
* **Action**: Locate the top "Today's Action" card. It should show a title, description, copyable content template, and action buttons.
* **Action**: Click "Postpone to Tomorrow".
* **Observe**: The action card content shifts to reflect tomorrow's date, and a confirmation banner appears.
* **Action**: Click "Mark Complete".
* **Observe**: A pop-up dialog asks you to log results. Choose an outcome signal (e.g. "Low response rate" or "Great response rate") and submit.
* **Observe**: The Action Completed counter increases by 1, and the daily card updates to a completed state.

### 5.3 History Log & Filters
* **Action**: Scroll down the dashboard home page to the "Action History" section.
* **Observe**: The task you just completed appears in the log list.
* **Action**: Click on channel filter buttons (e.g., *Instagram, Blog, Outreach*).
* **Observe**: The history log list filters items dynamically.

---

## 📄 6. My Content Hub

### 6.1 Generated Content Hub Visibility
* **Action**: Click "My Content" in the dashboard sidebar or visit `http://localhost:3000/dashboard/content`.
* **Observe**: You should see a page titled *"My Content"*. If your onboarding has completed successfully, you will see a grid of generated card-based assets under "This Week's Content" (representing Instagram Posts, Outreach Emails, Product Descriptions, etc.).

### 6.2 View & Copy Modal
* **Action**: Click the "View & Copy" button on one of the content cards.
* **Observe**: A modal opens displaying the title and the complete content text.
* **Action**: Click the "Copy All" button in the modal footer.
* **Observe**: The button changes color to green with the text *"Copied! ✓"*, and the text is copied to your clipboard. Close the modal by clicking the X button in the top-right corner.

### 6.3 Previous Weeks Accordion
* **Action**: Scroll down to see if there is a "Previous Weeks" section (if simulated data exists).
* **Action**: Click on one of the past weeks listed in the accordion button.
* **Observe**: The accordion expands to show the grid of content items generated for that week.

---

## 💬 7. Ask Stormo Floating AI Assistant

### 7.1 Visibility
* **Action**: Click around all pages in the dashboard (e.g. `/dashboard`, `/dashboard/content`, `/dashboard/outreach`).
* **Observe**: The orange chat bubble button with a Trophy/Message icon remains floating in the bottom-right corner of every page.

### 7.2 Chat Modal & Suggestions
* **Action**: Click the Ask Stormo floating bubble.
* **Observe**: A chat panel opens. On desktop, it is a sleek overlay window. On mobile (width < 768px), it covers the full viewport.
* **Action**: Click on one of the quick suggestions (e.g., *"What should I focus on this week?"*).
* **Observe**: The AI streaming response responds to the query using details scraped during onboarding (demographics, time, niche).
* **Action**: Close the panel, refresh the page, and open it again.
* **Observe**: Your past questions and answers are loaded.

---

## 📱 8. Outreach CRM & Bulk Import

### 8.1 Single Contact Add
* **Action**: Go to `http://localhost:3000/dashboard/outreach`.
* **Action**: Click "Add Contact" (orange button).
* **Action**: Fill in Name, Platform (select *Instagram*), profile link, and follower count, then submit.
* **Observe**: The contact is added to the table. The Platform badge reads "Instagram" in a custom color theme.

### 8.2 Bulk Import Parser
* **Action**: On the outreach page, click the "Bulk Import" button.
* **Action**: Select the platform (*TikTok* or *Instagram*).
* **Action**: Paste multiple handles one per line in the textbox (e.g. `@mike_crafts\n@crafty_lisa\nhttps://tiktok.com/@woodwork_guru`) and click "Import & Analyze".
* **Observe**: The UI shows a loader. Once processed, a table displays the parsed handles, estimated follower ranges, and niche alignment markers.
* **Action**: Select which leads you want to keep and click "Confirm Import".
* **Observe**: They are saved and added directly to your CRM contacts table.

### 8.3 Status Transitions & AI Outreach Draft
* **Action**: On any CRM lead row, click the "Update Status" dropdown and change it from *identified* to *contacted*.
* **Observe**: The pipeline status badge changes color immediately.
* **Action**: Click "Generate Outreach Draft" on a lead row.
* **Observe**: A modal pops up displaying a custom pitch message drafted by the AI matching the influencer's niche. Click "Copy Draft".
* **Observe**: A confirmation toast appears, and the copied text changes status indicators.

---

## 📈 9. Seasonal Campaign Planner

### 9.1 Scrollable 60-Day Calendar
* **Action**: Visit `http://localhost:3000/dashboard/campaigns`.
* **Observe**: You should see a horizontal calendar showing events for the current month and the next. High-value retail events (such as Prime Day, Back to School, Labor Day) appear as tags on their respective dates.
* **Action**: Click the "Niche Recommendations Only" checkbox.
* **Observe**: The calendar hides generic dates, showing only events matching the store product category you entered during onboarding.

### 9.2 Campaign Plan Generation & Queue Integration
* **Action**: Click "Build Campaign" next to an upcoming holiday (e.g., *Labor Day*).
* **Action**: In the modal, click "Generate Campaign Plan".
* **Observe**: The AI outputs a campaign summary detailing an overview, three suggested daily lead-up actions, and promotional angles.
* **Action**: Click "Confirm & Save Campaign".
* **Observe**: Go back to `http://localhost:3000/dashboard`. Under your action history and upcoming schedule, you will find the 3 campaign actions automatically queued with statuses set to `scheduled` leading up to the holiday date.

---

## 🏆 10. Progress Milestones & Confetti

### 10.1 Milestones Display
* **Action**: Visit `http://localhost:3000/dashboard/milestones`.
* **Observe**: You should see a grid displaying 9 milestone achievement cards. Achieved milestones (like `first_action` or `first_login`) appear as orange cards with checkmarks and achievement dates. Unlocked milestones are gray and display lock icons.

### 10.2 Report a Sale Interaction
* **Action**: Click "Report a Sale".
* **Action**: Enter an optional sale amount and click "Log Sale".
* **Observe**: A full-screen canvas-confetti celebration triggers to celebrate your first sale.
* **Observe**: The "First Dollar" milestone card on the page transitions to an unlocked orange state showing today's date.
* **Action**: Report 9 more sales (total sales counter >= 10).
* **Observe**: A prominent orange **Growth Tier Upgrade** notification banner immediately appears at the top of the milestones page, offering a link button to upgrade.

---

## ⚙️ 11. Profile & Settings Dashboard

### 11.1 Viewing Settings Data
* **Action**: Navigate to `http://localhost:3000/dashboard/settings` by clicking the "Settings" tab in the sidebar.
* **Observe**: The subscription section shows your current active plan tier, your total logged sales count, and the next renewal billing date.

### 11.2 Growth Tier Upgrade Action
* **Action**: If you have logged 10 or more sales under the Milestones tab, navigate to the settings page.
* **Observe**: You should see an active, orange **Upgrade to Growth Plan** button next to your plan status details.
* **Action**: Click "Upgrade to Growth Plan".
* **Observe**: A loader shows up, followed by a green success banner saying *"Successfully upgraded to Growth plan!"* and your current tier status text transitions to **Growth Plan**.

### 11.3 Plan Cancellation Action
* **Action**: Click the red "Cancel Subscription" button on the Settings page.
* **Action**: Confirm the confirmation box alert that pops up in the browser.
* **Observe**: A warning message details when your subscription ends. The red "Cancel Subscription" button disappears or disables, and the next billing label updates to show when your access expires.

---

## 📱 12. Responsive QA (Device Simulator)

* **Action**: Open Chrome DevTools (`F12`), toggle the Device Toolbar, and select **iPhone SE** (width **375px**).
* **Observe**:
  - Visit the homepage (`/`): Sections stack vertically with no horizontal scrollbars.
  - Visit the CRM (`/dashboard/outreach`): The contacts table scrolls horizontally inside its card container rather than clipping or breaking layout boundaries.
  - Open Ask Stormo: The chat covers the full viewport with at least 44px buttons, making it easy to tap on mobile.
