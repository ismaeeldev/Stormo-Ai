import { pgTable, uuid, varchar, text, boolean, timestamp, integer, date, jsonb, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config: any) { return `vector(${config?.dimensions ?? 1536})`; },
  toDriver(value) { return JSON.stringify(value); },
  fromDriver(value) { return JSON.parse(value as string); },
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  provider: varchar('provider', { length: 50 }).default('email'),
  emailVerified: boolean('email_verified').default(false),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('free'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('inactive'),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  trialEndsAt: timestamp('trial_ends_at'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  onboardingStep: integer('onboarding_step').default(0),
  totalSales: integer('total_sales').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const storeProfiles = pgTable('store_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  storeUrl: text('store_url'),
  storePlatform: varchar('store_platform', { length: 100 }),
  productType: text('product_type'),
  targetCustomer: text('target_customer'),
  priceRange: varchar('price_range', { length: 100 }),
  weeklyTimeAvailable: varchar('weekly_time_available', { length: 100 }),
  currentChallenges: text('current_challenges'),
  storeAnalysis: text('store_analysis'),
  nicheSummary: text('niche_summary'),
  coverageMap: jsonb('coverage_map'),
  campaigns: jsonb('campaigns'),
  onboardingAnswers: jsonb('onboarding_answers'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const actions = pgTable('actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }),
  description: text('description'),
  content: text('content'),
  channel: varchar('channel', { length: 100 }),
  actionType: varchar('action_type', { length: 100 }),
  status: varchar('status', { length: 50 }),
  outcomeSignal: varchar('outcome_signal', { length: 50 }),
  scheduledFor: date('scheduled_for'),
  completedAt: timestamp('completed_at'),
  embedding: vector('embedding'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const actionCompressedSummaries = pgTable('action_compressed_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  batchStart: integer('batch_start'),
  batchEnd: integer('batch_end'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const weeklyContent = pgTable('weekly_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  weekStart: date('week_start'),
  contentType: varchar('content_type', { length: 100 }),
  title: varchar('title', { length: 500 }),
  content: text('content'),
  status: varchar('status', { length: 50 }),
  generationJobId: varchar('generation_job_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const askStormoMessages = pgTable('ask_stormo_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const outreachContacts = pgTable('outreach_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }),
  platform: varchar('platform', { length: 100 }),
  profileUrl: text('profile_url'),
  followerCount: integer('follower_count'),
  nicheMatch: text('niche_match'),
  status: varchar('status', { length: 50 }),
  lastContactAt: timestamp('last_contact_at'),
  followUpDue: date('follow_up_due'),
  aiOutreachDraft: text('ai_outreach_draft'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  milestoneKey: varchar('milestone_key', { length: 100 }),
  achievedAt: timestamp('achieved_at').defaultNow(),
  emailSent: boolean('email_sent').default(false),
});

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).unique(),
  title: varchar('title', { length: 500 }),
  excerpt: text('excerpt'),
  content: text('content'),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  ogImageUrl: text('og_image_url'),
  published: boolean('published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  status: varchar('status', { length: 50 }),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type DatabaseSchema = {
  users: typeof users;
  storeProfiles: typeof storeProfiles;
  actions: typeof actions;
  actionCompressedSummaries: typeof actionCompressedSummaries;
  weeklyContent: typeof weeklyContent;
  askStormoMessages: typeof askStormoMessages;
  outreachContacts: typeof outreachContacts;
  milestones: typeof milestones;
  blogPosts: typeof blogPosts;
  subscriptions: typeof subscriptions;
};
