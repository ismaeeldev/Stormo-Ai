import { config } from 'dotenv';
config({ path: '.env.local' });

// We dynamically import db and blogPosts so dotenv config runs first and DATABASE_URL is available
async function seed() {
  console.log('Starting blog database seed...');
  try {
    const { db } = await import('../lib/db');
    const { blogPosts } = await import('../lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const INITIAL_POSTS = [
      {
        slug: 'how-to-get-first-100-customers',
        title: 'How to Get Your First 100 Customers Without Spending on Ads',
        excerpt: 'Acquiring your first 100 customers is the hardest part of starting an ecommerce store. Learn how to do it with zero ad spend using organic strategies.',
        content: `# How to Get Your First 100 Customers Without Spending on Ads

Acquiring your first 100 customers is the hardest part of starting an ecommerce store. When you have zero brand awareness, no budget, and no traffic, it feels impossible.

Here is a step-by-step roadmap to scale from zero to 100 sales using only organic, zero-budget marketing.

## 1. Leverage Your Existing Network
Before launching to strangers, leverage the people who already know and trust you. This isn't about spamming friends; it's about asking for support and feedback.
- Send personalized messages (not group texts) explaining your project.
- Offer a special founder's discount.
- Ask them to share if they know anyone who fits your target audience.

## 2. Master One Social Platform
Do not try to be on Instagram, TikTok, Pinterest, and YouTube all at once. Pick the one where your target customer hangs out most.
- **TikTok/Instagram Reels**: Post vertical videos showing the behind-the-scenes of building your brand.
- **Pinterest**: Pin high-quality, aesthetic images linking directly to your product pages.

## 3. Engage in Online Communities
Go where your target customers are already talking. Reddit, Facebook Groups, and Discord channels are goldmines if used correctly.
- Do not spam links.
- Answer questions, provide value, and build authority.
- Place a link in your profile or mention your store naturally only when relevant.

Ready to automate this process? Stormo builds daily marketing habits so you can scale consistently.`,
        metaTitle: 'How to Get Your First 100 Customers Without Ads | Stormo',
        metaDescription: 'Acquiring your first 100 customers is the hardest part of starting an ecommerce store. Here is how to do it with zero ad spend using organic strategies.',
        ogImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80',
        published: true,
      },
      {
        slug: 'why-90-percent-ecommerce-stores-fail',
        title: 'Why 90% of New Ecommerce Stores Fail in Year One (And How to Beat the Odds)',
        excerpt: 'Most ecommerce stores shut down within 12 months. Discover the primary reasons for failure and how you can position your store to survive and thrive.',
        content: `# Why 90% of New Ecommerce Stores Fail in Year One (And How to Beat the Odds)

The stats are brutal: 9 out of 10 new ecommerce stores shut down within their first year. But why?

Understanding the primary pitfalls is the first step toward beat the odds and building a sustainable business.

## Pitfall 1: Building It and Expecting Them to Come
Many store owners believe that a beautiful Shopify site is enough. It isn't. Without active marketing, your store is like a boutique in the middle of a desert.
* **The Solution**: Allocate at least 50% of your time to marketing and customer outreach rather than tweaking layout elements.

## Pitfall 2: Low-Quality Product Presentation
If your product descriptions are copied directly from manufacturers and your images are blurry, customers will leave immediately.
* **The Solution**: Write compelling copy that focuses on benefits rather than features, and use clean, professional photography.

## Pitfall 3: Not Understanding Your Target Customer
If you are selling to "everyone," you are selling to no one. You must target a highly specific niche.
* **The Solution**: Refine your brand message so it speaks directly to your ideal customer's pain points.`,
        metaTitle: 'Why 90% of Ecommerce Stores Fail (And How to Prevent It) | Stormo',
        metaDescription: 'Discover why 90% of new ecommerce stores fail in their first year and the actionable strategies you can implement to beat the odds.',
        ogImageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&h=630&q=80',
        published: true,
      },
      {
        slug: 'daily-marketing-habit-grows-stores',
        title: 'The Daily Marketing Habit That Grows Ecommerce Stores Without an Agency',
        excerpt: 'Consistency beats intensity. Learn why small, daily marketing habits are the secret to scaling your brand without hiring expensive agencies.',
        content: `# The Daily Marketing Habit That Grows Ecommerce Stores Without an Agency

Many store owners think they need a massive agency budget to grow. The reality is that consistency beats intensity. Doing one marketing action every single day builds compound interest for your brand.

Here is how to build a daily marketing habit that actually generates traffic.

## Why Daily Consistency Matters
Algorithms favor accounts that post and engage regularly. Search engines favor websites that update frequently. Customers trust brands that are consistently active.
- **Day 1**: Send 3 influencer outreach DMs.
- **Day 2**: Update one product description for SEO.
- **Day 3**: Post a behind-the-scenes video.
- **Day 4**: Write a value-first Reddit comment.

By breaking marketing down into bite-sized daily tasks, you prevent burnout and keep making progress.`,
        metaTitle: 'The Daily Marketing Habit for Ecommerce Growth | Stormo',
        metaDescription: 'Learn why consistency beats intensity and how small, daily marketing actions can scale your ecommerce store without expensive agency fees.',
        ogImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&h=630&q=80',
        published: true,
      },
      {
        slug: 'micro-influencer-marketing-zero-budget',
        title: "Micro-Influencer Marketing: The Zero-Budget Strategy Big Brands Don't Want You to Know",
        excerpt: 'You do not need thousands of dollars to partner with influencers. Learn the zero-budget influencer outreach strategy that drives high-converting traffic.',
        content: `# Micro-Influencer Marketing: The Zero-Budget Strategy Big Brands Don't Want You to Know

Influencer marketing isn't just for massive companies with million-dollar budgets. In fact, micro-influencers (accounts with 1,000 to 10,000 followers) often have far higher engagement rates than celebrity accounts.

Here is how to secure partnerships with micro-influencers without paying a single dollar upfront.

## Step 1: Identify the Right Creators
Look for creators who post content directly related to your niche. Ensure their engagement (likes, comments, video views) is healthy relative to their follower count.

## Step 2: Pitch Value, Not Just Free Stuff
When reaching out, focus on building a relationship. Offer a free product sample in exchange for an honest review, or propose an affiliate commission so they earn whenever their followers buy.

## Step 3: Streamline Your CRM
Keep track of who you have messaged, who replied, and when to follow up. Systematizing this prevents missed opportunities.`,
        metaTitle: 'Zero-Budget Micro-Influencer Strategy | Stormo',
        metaDescription: 'Learn how to secure high-converting micro-influencer partnerships for your ecommerce store with zero budget upfront.',
        ogImageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&h=630&q=80',
        published: true,
      },
    ];

    for (const post of INITIAL_POSTS) {
      const existing = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, post.slug));

      if (existing.length > 0) {
        console.log(`Post already exists, updating: ${post.title}`);
        await db
          .update(blogPosts)
          .set({
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            ogImageUrl: post.ogImageUrl,
            published: post.published,
            publishedAt: new Date(),
          })
          .where(eq(blogPosts.slug, post.slug));
      } else {
        console.log(`Inserting new post: ${post.title}`);
        await db.insert(blogPosts).values({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          ogImageUrl: post.ogImageUrl,
          published: post.published,
          publishedAt: new Date(),
        });
      }
    }
    console.log('Blog database seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}

seed();
