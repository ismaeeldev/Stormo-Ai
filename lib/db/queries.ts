import { eq, desc, and } from 'drizzle-orm';
import { db } from './index';
import {
  users,
  storeProfiles,
  actions,
  actionCompressedSummaries,
  weeklyContent,
  outreachContacts,
  milestones,
  askStormoMessages,
} from './schema';
import type { InferInsertModel } from 'drizzle-orm';

// 1. getUserById
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}

// 2. getUserByEmail
export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

// 3. getStoreProfile
export async function getStoreProfile(userId: string) {
  const [profile] = await db.select().from(storeProfiles).where(eq(storeProfiles.userId, userId));
  return profile || null;
}

// 4. createStoreProfile (inserts or updates)
export async function createStoreProfile(userId: string, data: Partial<InferInsertModel<typeof storeProfiles>>) {
  const insertData = { ...data, userId } as InferInsertModel<typeof storeProfiles>;
  
  const [profile] = await db
    .insert(storeProfiles)
    .values(insertData)
    .onConflictDoUpdate({
      target: storeProfiles.userId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
  return profile;
}

// 5. getTodaysAction
export async function getTodaysAction(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const [action] = await db
    .select()
    .from(actions)
    .where(
      and(
        eq(actions.userId, userId),
        eq(actions.scheduledFor, today)
      )
    );
  return action || null;
}

// 6. getRecentActions
export async function getRecentActions(userId: string, limit: number) {
  return await db
    .select()
    .from(actions)
    .where(eq(actions.userId, userId))
    .orderBy(desc(actions.createdAt))
    .limit(limit);
}

// 7. getCompressedSummaries
export async function getCompressedSummaries(userId: string) {
  return await db
    .select()
    .from(actionCompressedSummaries)
    .where(eq(actionCompressedSummaries.userId, userId))
    .orderBy(desc(actionCompressedSummaries.batchStart));
}

// 8. getWeeklyContent
export async function getWeeklyContent(userId: string, weekStart: Date) {
  return await db
    .select()
    .from(weeklyContent)
    .where(
      and(
        eq(weeklyContent.userId, userId),
        eq(weeklyContent.weekStart, weekStart.toISOString().split('T')[0])
      )
    );
}

// 9. getOutreachContacts
export async function getOutreachContacts(userId: string) {
  return await db
    .select()
    .from(outreachContacts)
    .where(eq(outreachContacts.userId, userId))
    .orderBy(desc(outreachContacts.createdAt));
}

// 10. getMilestones
export async function getMilestones(userId: string) {
  return await db
    .select()
    .from(milestones)
    .where(eq(milestones.userId, userId))
    .orderBy(desc(milestones.achievedAt));
}

// 11. updateUserSubscription
export async function updateUserSubscription(userId: string, data: Partial<InferInsertModel<typeof users>>) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

// 12. updateCoverageMap
export async function updateCoverageMap(userId: string, channel: string, signal: string) {
  const profile = await getStoreProfile(userId);
  if (!profile) return null;

  const map = profile.coverageMap ? (profile.coverageMap as Record<string, any>) : {};
  if (!map[channel]) {
    map[channel] = { count: 0 };
  }
  map[channel].count += 1;
  map[channel].lastUsed = new Date().toISOString().split('T')[0];
  map[channel].signal = signal;

  const [updated] = await db
    .update(storeProfiles)
    .set({ coverageMap: map, updatedAt: new Date() })
    .where(eq(storeProfiles.userId, userId))
    .returning();
  
  return updated;
}

// 13. getAskStormoMessages
export async function getAskStormoMessages(userId: string, limit: number = 20) {
  return await db
    .select()
    .from(askStormoMessages)
    .where(eq(askStormoMessages.userId, userId))
    .orderBy(desc(askStormoMessages.createdAt))
    .limit(limit);
}

// 14. saveAskStormoMessage
export async function saveAskStormoMessage(userId: string, role: 'user' | 'assistant', content: string) {
  const [msg] = await db
    .insert(askStormoMessages)
    .values({
      userId,
      role,
      content,
    })
    .returning();
  return msg;
}
