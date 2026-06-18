import { sql, eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { storeProfiles, actions, actionCompressedSummaries } from '../db/schema';
import { getEmbeddingModel } from './model';

interface ActionContext {
  storeProfile: any;
  coverageMap: any;
  compressedSummaries: any[];
  recentActions: any[];
  nearDuplicateCandidates: any[];
  systemContext: string;
}

/**
 * Estimates the number of tokens in a text string.
 * Uses a standard rule of thumb: ~4 characters per token.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Assembles context for the AI daily action generator to prevent repetition.
 * Fetches store profile, coverage map, compressed summaries, recent actions, and
 * uses pgvector similarity search to find near-duplicate candidates.
 *
 * @param userId - The ID of the user.
 * @returns The assembled context object and formatted systemContext string.
 */
export async function assembleActionContext(userId: string): Promise<ActionContext> {
  // 1. Fetch store profile from DB
  const [profile] = await db
    .select()
    .from(storeProfiles)
    .where(eq(storeProfiles.userId, userId))
    .limit(1);

  // 2. Fetch coverage_map from store_profiles
  const coverageMap = profile?.coverageMap || {};

  // 3. Fetch ALL compressed summaries from action_compressed_summaries table
  const compressedSummaries = await db
    .select()
    .from(actionCompressedSummaries)
    .where(eq(actionCompressedSummaries.userId, userId))
    .orderBy(desc(actionCompressedSummaries.createdAt));

  // 4. Fetch last 20 actions from actions table (verbatim, newest first)
  const recentActions = await db
    .select({
      id: actions.id,
      title: actions.title,
      description: actions.description,
      channel: actions.channel,
      actionType: actions.actionType,
      status: actions.status,
      outcomeSignal: actions.outcomeSignal,
      scheduledFor: actions.scheduledFor,
      completedAt: actions.completedAt,
      createdAt: actions.createdAt,
    })
    .from(actions)
    .where(eq(actions.userId, userId))
    .orderBy(desc(actions.createdAt))
    .limit(20);

  // 5. Run pgvector similarity search: find 10 actions with highest similarity to a generic seed embedding
  let nearDuplicateCandidates: any[] = [];
  try {
    const embeddingModel = getEmbeddingModel();
    const seedEmbedding = await embeddingModel.embedQuery("generic marketing action");
    const serializedEmbedding = JSON.stringify(seedEmbedding);

    // Drizzle raw SQL for vector similarity search
    const query = sql`
      SELECT id, title, channel 
      FROM actions 
      WHERE user_id = ${userId}::uuid 
      ORDER BY embedding <=> ${serializedEmbedding}::vector 
      LIMIT 10
    `;
    const result = await db.execute(query);
    nearDuplicateCandidates = result.rows || [];
  } catch (error) {
    console.error("Error generating seed embedding or performing vector search:", error);
  }

  // 7. Format systemContext string ready to inject into Claude prompt
  const systemContext = `
=== BRAND & STORE PROFILE ===
Product Type: ${profile?.productType || "N/A"}
Target Customer: ${profile?.targetCustomer || "N/A"}
Price Range: ${profile?.priceRange || "N/A"}
Challenges: ${profile?.currentChallenges || "N/A"}
Store Analysis/Niche Summary: ${profile?.storeAnalysis || profile?.nicheSummary || "N/A"}

=== DETAILED ONBOARDING QUESTIONNAIRE ANSWERS ===
${profile?.onboardingAnswers ? JSON.stringify(profile.onboardingAnswers, null, 2) : "N/A"}

=== MARKETING CHANNEL COVERAGE ===
${JSON.stringify(coverageMap, null, 2)}

=== HISTORICAL COMPRESSED NARRATIVE ===
${compressedSummaries.map((s, idx) => `Batch ${idx + 1}: ${s.summary}`).join("\n")}

=== RECENT DETAILED ACTIONS (LAST 20) ===
${recentActions
  .map(
    (a) =>
      `- [${a.channel}] ${a.title}: ${a.description || ""} (Status: ${a.status}, Outcome: ${a.outcomeSignal || "None"})`
  )
  .join("\n")}

=== SIMILAR MARKETING ACTIONS (POTENTIAL DUPLICATES) ===
${nearDuplicateCandidates
  .map((a) => `- [${a.channel}] ${a.title} (ID: ${a.id})`)
  .join("\n")}
`.trim();

  // Estimate total tokens in the systemContext string
  const totalTokens = estimateTokens(systemContext);
  if (totalTokens > 2000) {
    console.warn(
      `[Warning] Assembled AI context for user ${userId} exceeds 2,000 tokens limit. Estimated tokens: ${totalTokens}`
    );
  }

  return {
    storeProfile: profile || null,
    coverageMap,
    compressedSummaries,
    recentActions,
    nearDuplicateCandidates,
    systemContext,
  };
}
